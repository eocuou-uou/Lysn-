// 生成设备码
function generateDeviceCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part3 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

// 验证逻辑
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cookie = request.headers.get('cookie');

  if (cookie && cookie.includes('device_code=')) {
    const deviceCode = cookie.split('device_code=')[1].split(';')[0];
    const validActivation = await env.ACTIVATION_KV.get(deviceCode);
    if (validActivation) {
      return context.next();
    }
  }

  if (request.method === 'POST' && url.pathname === '/activate') {
    const formData = await request.formData();
    const submitDeviceCode = formData.get('device_code');
    const submitActivationCode = formData.get('activation_code');
    const realCode = await env.ACTIVATION_KV.get(submitDeviceCode);

    if (realCode && realCode === submitActivationCode) {
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `device_code=${submitDeviceCode}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      return new Response(getActivationPage(submitDeviceCode, "激活码错误，请重试"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }

  const newDeviceCode = generateDeviceCode();
  return new Response(getActivationPage(newDeviceCode), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// 粉色精美UI
function getActivationPage(deviceCode, errorText = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>激活</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      body {
        width: 100vw;
        height: 100vh;
        background: linear-gradient(160deg, #FFC0D9 0%, #FF9BB3 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        background: #ffffff;
        width: 100%;
        max-width: 380px;
        border-radius: 28px;
        padding: 40px 32px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        text-align: center;
      }
      .title {
        font-size: 32px;
        font-weight: 700;
        color: #FF4A8E;
        margin-bottom: 8px;
      }
      .subtitle {
        font-size: 16px;
        color: #999;
        margin-bottom: 30px;
      }
      .device-box {
        background: #FFF5F8;
        border: 1px solid #FFD6E4;
        border-radius: 16px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .device-label {
        font-size: 15px;
        color: #666;
      }
      .device-code {
        font-size: 17px;
        font-weight: bold;
        color: #FF4A8E;
        letter-spacing: 1px;
      }
      .copy-btn {
        background: #FFE6EF;
        color: #FF4A8E;
        border: none;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .input {
        width: 100%;
        padding: 18px;
        border-radius: 16px;
        border: 1px solid #FFD6E4;
        background: #FFF5F8;
        text-align: center;
        font-size: 18px;
        color: #333;
        margin-bottom: 16px;
      }
      .input::placeholder {
        color: #ff9dbd;
      }
      .btn {
        width: 100%;
        padding: 18px;
        border-radius: 20px;
        background: linear-gradient(90deg, #FF69A4, #FF4A8E);
        color: white;
        font-size: 18px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(255,74,142,0.25);
      }
      .error {
        color: #FF4A6E;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .footer {
        margin-top: 28px;
        font-size: 13px;
        color: #ff8fb8;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 class="title">Lysn 激活</h1>
      <p class="subtitle">请输入激活码以继续</p>

      <div class="device-box">
        <span class="device-label">设备码</span>
        <span class="device-code" id="code">${deviceCode}</span>
        <button class="copy-btn" onclick="copy()">复制</button>
      </div>

      <form method="post" action="/activate">
        <input type="hidden" name="device_code" value="${deviceCode}">
        <input class="input" type="text" name="activation_code" placeholder="请输入激活码" required>
        ${errorText ? `<p class="error">${errorText}</p>` : ''}
        <button class="btn" type="submit">立即激活</button>
      </form>

      <div class="footer">
        请联系作者获取激活码
      </div>
    </div>

    <script>
      function copy() {
        const t = document.getElementById('code').innerText;
        navigator.clipboard.writeText(t).then(()=>alert('已复制')).catch(()=>alert('复制成功'));
      }
    </script>
  </body>
  </html>
  `;
}
