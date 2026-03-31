// 生成和截图格式一致的随机设备码（XXX-XXXX-XXXX）
function generateDeviceCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part3 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

// 核心验证逻辑，完全保留未改动
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
      // 激活成功，给浏览器种Cookie，10年内不用重新激活
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `device_code=${submitDeviceCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`
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

// 韩系黑白灰极简风格激活页UI
function getActivationPage(deviceCode, errorText = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>uou lysn激活</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      body {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow: hidden;
      }
      /* 核心卡片 - 韩系大圆角+柔影 */
      .activate-card {
        width: 100%;
        max-width: 420px;
        background: #ffffff;
        border-radius: 32px;
        padding: 52px 32px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(240, 240, 240, 0.8);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .activate-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 48px rgba(0, 0, 0, 0.06);
      }
      /* 标题排版 - 韩系字重对比+紧凑字距 */
      .card-title {
        font-size: 44px;
        font-weight: 700;
        color: #121212;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      .card-subtitle {
        font-size: 16px;
        color: #666666;
        margin-bottom: 44px;
        font-weight: 400;
      }
      /* 设备码区域 - 低饱和灰阶+柔和交互 */
      .device-code-box {
        width: 100%;
        background-color: #f8f8f8;
        border-radius: 20px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 36px;
        border: 1px solid #f0f0f0;
        transition: background-color 0.3s ease;
      }
      .device-code-box:hover {
        background-color: #f5f5f5;
      }
      .device-label {
        font-size: 15px;
        color: #333333;
        font-weight: 500;
      }
      .device-code {
        font-size: 20px;
        font-weight: 700;
        color: #121212;
        letter-spacing: 2px;
        margin: 0 12px;
        flex: 1;
        text-align: center;
      }
      /* 复制按钮 - 灰阶过渡+微交互 */
      .copy-btn {
        background-color: #f0f0f0;
        border: none;
        border-radius: 12px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        color: #333333;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      .copy-btn:hover {
        background-color: #e5e5e5;
        color: #121212;
      }
      .copy-btn:active {
        transform: scale(0.96);
      }
      /* 输入框 - 极简灰阶+聚焦柔反馈 */
      .code-input {
        width: 100%;
        padding: 18px;
        border: 1px solid #e5e5e5;
        border-radius: 16px;
        font-size: 18px;
        text-align: center;
        color: #121212;
        margin-bottom: 20px;
        background-color: #f8f8f8;
        transition: all 0.3s ease;
      }
      .code-input:focus {
        outline: none;
        border-color: #666666;
        background-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
      }
      .code-input::placeholder {
        color: #999999;
      }
      /* 激活按钮 - 纯黑主调+柔和hover */
      .activate-btn {
        width: 100%;
        padding: 18px;
        background: #121212;
        border: none;
        border-radius: 16px;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        margin-bottom: 36px;
        transition: all 0.3s ease;
      }
      .activate-btn:hover {
        background: #2a2a2a;
      }
      .activate-btn:active {
        transform: scale(0.98);
      }
      /* 错误提示 - 黑白灰兼容+不破坏整体调性 */
      .error-tip {
        color: #333333;
        font-size: 14px;
        margin-bottom: 20px;
        padding: 10px;
        border-radius: 8px;
        background-color: #f5f5f5;
        border: 1px solid #e5e5e5;
      }
      /* 底部文字 - 低饱和灰+舒适行高 */
      .footer-text {
        font-size: 13px;
        color: #888888;
        line-height: 1.8;
      }
      .footer-text p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="activate-card">
      <h1 class="card-title">uou lysn</h1>
      <p class="card-subtitle">请输入新的激活码</p>

      <div class="device-code-box">
        <span class="device-label">设备码</span>
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
        <p>🍠@eocuou 5049019907</p>
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

      // 自动聚焦输入框，提升操作体验
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.code-input')?.focus();
      });
    </script>
  </body>
  </html>
  `;
}