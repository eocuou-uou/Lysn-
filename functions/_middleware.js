// 生成和截图格式一致的随机设备码（XXX-XXXX-XXXX）
function generateDeviceCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part3 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

// 核心验证逻辑，不要改！
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cookie = request.headers.get('cookie');

  // 1. 检查用户是否已经激活过，已激活直接放行
  if (cookie && cookie.includes('device_code=')) {
    const deviceCode = cookie.split('device_code=')[1].split(';')[0];
    const validActivation = await env.ACTIVATION_KV.get(deviceCode);
    if (validActivation) {
      return context.next();
    }
  }

  // 2. 处理用户提交激活码的请求
  if (request.method === 'POST' && url.pathname === '/activate') {
    const formData = await request.formData();
    const submitDeviceCode = formData.get('device_code');
    const submitActivationCode = formData.get('activation_code');

    // 去KV里验证激活码是否正确
    const realCode = await env.ACTIVATION_KV.get(submitDeviceCode);
    if (realCode && realCode === submitActivationCode) {
      // 激活成功，给浏览器种Cookie，30天内不用重新激活
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `device_code=${submitDeviceCode}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      // 激活码错误，返回激活页并提示错误
      return new Response(getActivationPage(submitDeviceCode, "激活码错误，请联系作者获取正确的激活码"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }

  // 3. 首次访问，生成新设备码，返回激活页
  const newDeviceCode = generateDeviceCode();
  return new Response(getActivationPage(newDeviceCode), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// 激活页UI，和你截图完全一致，可改文字/颜色/样式
function getActivationPage(deviceCode, errorText = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eocuou bubble 激活</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      body {
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .activate-card {
        width: 100%;
        max-width: 420px;
        background-color: #ffffff;
        border-radius: 24px;
        padding: 40px 28px;
        text-align: center;
      }
      .card-title {
        font-size: 36px;
        font-weight: 700;
        color: #1d1d1f;
        margin-bottom: 12px;
      }
      .card-subtitle {
        font-size: 18px;
        color: #6e6e73;
        margin-bottom: 32px;
      }
      .device-code-box {
        width: 100%;
        background-color: #f5f5f7;
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .device-label {
        font-size: 16px;
        color: #1d1d1f;
        font-weight: 500;
      }
      .device-code {
        font-size: 18px;
        font-weight: 700;
        color: #0066cc;
        letter-spacing: 1px;
        margin: 0 8px;
      }
      .copy-btn {
        background-color: #e8e8ed;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 15px;
        font-weight: 500;
        color: #1d1d1f;
        cursor: pointer;
        flex-shrink: 0;
      }
      .code-input {
        width: 100%;
        padding: 16px;
        border: 1px solid #d2d2d7;
        border-radius: 12px;
        font-size: 18px;
        text-align: center;
        color: #1d1d1f;
        margin-bottom: 16px;
      }
      .code-input::placeholder {
        color: #86868b;
      }
      .activate-btn {
        width: 100%;
        padding: 16px;
        background-color: #0071e3;
        border: none;
        border-radius: 20px;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        margin-bottom: 32px;
      }
      .error-tip {
        color: #ff3b30;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .footer-text {
        font-size: 14px;
        color: #86868b;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="activate-card">
      <h1 class="card-title">eocuou bubble</h1>
      <p class="card-subtitle">请输入新的激活码。</p>

      <div class="device-code-box">
        <span class="device-label">设备码:</span>
        <span class="device-code" id="deviceCode">${deviceCode}</span>
        <button class="copy-btn" onclick="copyDeviceCode()">复制</button>
      </div>

      <form method="post" action="/activate">
        <input type="hidden" name="device_code" value="${deviceCode}">
        <input 
          type="text" 
          name="activation_code" 
          class="code-input" 
          placeholder="输入激活码" 
          required
        >
        ${errorText ? `<p class="error-tip">${errorText}</p>` : ''}
        <button type="submit" class="activate-btn">立即激活</button>
      </form>

      <div class="footer-text">
        <p>请联系作者获取激活码</p>
        <p>作者🍠@eucuou</p>
      </div>
    </div>

    <script>
      // 复制设备码功能
      function copyDeviceCode() {
        const code = document.getElementById('deviceCode').innerText;
        navigator.clipboard.writeText(code).then(() => {
          alert('设备码已复制');
        }).catch(() => {
          // 兼容不支持clipboard的浏览器
          const input = document.createElement('input');
          input.value = code;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          alert('设备码已复制');
        });
      }
    </script>
  </body>
  </html>
  `;
}
