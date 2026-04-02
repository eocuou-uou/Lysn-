// 生成和截图格式一致的随机设备码（XXX-XXXX-XXXX）
function generateDeviceCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part3 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

// 辅助函数：安全获取 Cookie
function getCookie(request, name) {
  const cookieString = request.headers.get('Cookie');
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 读取浏览器 Cookie 中的设备码和已保存的激活码
  let deviceCode = getCookie(request, 'device_code');
  let savedActivationCode = getCookie(request, 'activation_code');
  let isNewDevice = false;

  // 如果没有设备码，生成一个固定的
  if (!deviceCode) {
    deviceCode = generateDeviceCode();
    isNewDevice = true;
  }

  // 2. 核心拦截逻辑：检查是否已经成功激活过
  if (deviceCode && savedActivationCode) {
    const realCode = await env.ACTIVATION_KV.get(deviceCode);
    // 只有当 Cookie 里的激活码和 KV 里的真实激活码完全一致时，才永久放行！
    if (realCode && realCode === savedActivationCode) {
      return context.next();
    }
  }

  // 3. 处理用户提交激活码的表单请求
  if (request.method === 'POST' && url.pathname === '/activate') {
    const formData = await request.formData();
    const submitDeviceCode = formData.get('device_code');
    const submitActivationCode = formData.get('activation_code');

    const realCode = await env.ACTIVATION_KV.get(submitDeviceCode);
    
    if (realCode && realCode === submitActivationCode) {
      // ✅ 激活成功：同时把设备码和激活码种入 Cookie（有效期10年）
      const headers = new Headers();
      headers.append("Location", "/");
      headers.append("Set-Cookie", `device_code=${submitDeviceCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`);
      headers.append("Set-Cookie", `activation_code=${submitActivationCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`);
      
      return new Response("", { status: 302, headers });
    } else {
      // ❌ 激活码错误：返回当前设备码的激活页并报错
      return new Response(getActivationPage(submitDeviceCode, "激活码错误，请联系作者获取正确的激活码"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }

  // 4. 未激活状态：返回激活页面
  const response = new Response(getActivationPage(deviceCode), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });

  // 如果是第一次打开网页，立刻把生成的设备码种入浏览器，防止一刷新设备码就变
  if (isNewDevice) {
    response.headers.append("Set-Cookie", `device_code=${deviceCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`);
  }

  return response;
}

// 韩系黑白灰极简风格激活页UI (保持不变)
function getActivationPage(deviceCode, errorText = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>uou lysn 激活</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      body { width: 100vw; height: 100vh; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden; }
      .activate-card { width: 100%; max-width: 420px; background: #ffffff; border-radius: 32px; padding: 52px 32px; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04); border: 1px solid rgba(240, 240, 240, 0.8); transition: transform 0.3s ease, box-shadow 0.3s ease; }
      .activate-card:hover { transform: translateY(-4px); box-shadow: 0 14px 48px rgba(0, 0, 0, 0.06); }
      .card-title { font-size: 44px; font-weight: 700; color: #121212; margin-bottom: 8px; letter-spacing: -0.5px; }
      .card-subtitle { font-size: 16px; color: #666666; margin-bottom: 44px; font-weight: 400; }
      .device-code-box { width: 100%; background-color: #f8f8f8; border-radius: 20px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; border: 1px solid #f0f0f0; transition: background-color 0.3s ease; }
      .device-code-box:hover { background-color: #f5f5f5; }
      .device-label { font-size: 15px; color: #333333; font-weight: 500; }
      .device-code { font-size: 20px; font-weight: 700; color: #121212; letter-spacing: 2px; margin: 0 12px; flex: 1; text-align: center; }
      .copy-btn { background-color: #f0f0f0; border: none; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 500; color: #333333; cursor: pointer; flex-shrink: 0; transition: all 0.2s ease; }
      .copy-btn:hover { background-color: #e5e5e5; color: #121212; }
      .copy-btn:active { transform: scale(0.96); }
      .code-input { width: 100%; padding: 18px; border: 1px solid #e5e5e5; border-radius: 16px; font-size: 18px; text-align: center; color: #121212; margin-bottom: 20px; background-color: #f8f8f8; transition: all 0.3s ease; }
      .code-input:focus { outline: none; border-color: #666666; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05); }
      .code-input::placeholder { color: #999999; }
      .activate-btn { width: 100%; padding: 18px; background: #121212; border: none; border-radius: 16px; font-size: 18px; font-weight: 600; color: #ffffff; cursor: pointer; margin-bottom: 36px; transition: all 0.3s ease; }
      .activate-btn:hover { background: #2a2a2a; }
      .activate-btn:active { transform: scale(0.98); }
      .error-tip { color: #ff4d4f; font-size: 14px; margin-bottom: 20px; padding: 10px; border-radius: 8px; background-color: #fff1f0; border: 1px solid #ffa39e; }
      .footer-text { font-size: 13px; color: #888888; line-height: 1.8; }
      .footer-text p { margin: 4px 0; }
    </style>
  </head>
  <body>
    <div class="activate-card">
      <h1 class="card-title">uou lysn</h1>
      <p class="card-subtitle">请输入激活码以继续</p>

      <div class="device-code-box">
        <span class="device-label">设备码</span>
        <span class="device-code" id="deviceCode">${deviceCode}</span>
        <button class="copy-btn" onclick="copyDeviceCode()">复制</button>
      </div>

      <form method="post" action="/activate">
        <input type="hidden" name="device_code" value="${deviceCode}">
        <input type="text" name="activation_code" class="code-input" placeholder="输入激活码" required autofocus>
        ${errorText ? `<p class="error-tip">${errorText}</p>` : ''}
        <button type="submit" class="activate-btn">立即激活</button>
      </form>

      <div class="footer-text">
        <p>请联系作者获取激活码</p>
        <p>🍠@eocuou 5049019907</p>
      </div>
    </div>

    <script>
      function copyDeviceCode() {
        const code = document.getElementById('deviceCode').innerText;
        navigator.clipboard.writeText(code).then(() => {
          alert('设备码已复制');
        }).catch(() => {
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