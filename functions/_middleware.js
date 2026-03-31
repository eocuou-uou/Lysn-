// 生成和截图格式一致的随机设备码
function generateDeviceCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const part3 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

// 辅助函数：获取 Cookie
function getCookie(request, name) {
  const cookieString = request.headers.get('Cookie');
  if (!cookieString) return null;
  const cookies = cookieString.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 获取当前浏览器的设备码（从 Cookie 读取）
  let deviceCode = getCookie(request, 'device_code');
  let isNewDevice = false;

  // 如果没有设备码，说明是第一次访问，生成一个
  if (!deviceCode) {
    deviceCode = generateDeviceCode();
    isNewDevice = true;
  }

  // 2. 检查该设备码是否已激活
  const validActivation = await env.ACTIVATION_KV.get(deviceCode);
  
  // 如果已激活，且不是正在提交激活请求，则直接放行
  if (validActivation && url.pathname !== '/activate') {
    return context.next();
  }

  // 3. 处理激活码提交请求 (POST /activate)
  if (request.method === 'POST' && url.pathname === '/activate') {
    const formData = await request.formData();
    const submitDeviceCode = formData.get('device_code');
    const submitActivationCode = formData.get('activation_code');

    // 验证激活码
    const realCode = await env.ACTIVATION_KV.get(submitDeviceCode);
    if (realCode && realCode === submitActivationCode) {
      // 激活成功：重定向到首页，并确保 Cookie 有效期为10年
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `device_code=${submitDeviceCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      // 激活失败：返回错误提示，保持当前设备码
      return new Response(getActivationPage(submitDeviceCode, "激活码错误，请联系作者获取正确的激活码"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }

  // 4. 返回激活页面
  // 如果是新生成的设备码，返回页面的同时要种下 Cookie，防止刷新变动
  const response = new Response(getActivationPage(deviceCode), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });

  if (isNewDevice) {
    // 给未激活的用户也种下 Cookie，这样刷新页面设备码就不会变了
    response.headers.append("Set-Cookie", `device_code=${deviceCode}; Max-Age=315360000; Path=/; HttpOnly; Secure; SameSite=Lax`);
  }

  return response;
}

// UI 部分保持不变
function getActivationPage(deviceCode, errorText = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>uou lysn 激活</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { width: 100vw; height: 100vh; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden; }
      .activate-card { width: 100%; max-width: 420px; background: #ffffff; border-radius: 32px; padding: 52px 32px; text-align: center; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04); border: 1px solid rgba(240, 240, 240, 0.8); }
      .card-title { font-size: 44px; font-weight: 700; color: #121212; margin-bottom: 8px; letter-spacing: -0.5px; }
      .card-subtitle { font-size: 16px; color: #666666; margin-bottom: 44px; }
      .device-code-box { width: 100%; background-color: #f8f8f8; border-radius: 20px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; border: 1px solid #f0f0f0; }
      .device-label { font-size: 15px; color: #333333; font-weight: 500; }
      .device-code { font-size: 20px; font-weight: 700; color: #121212; letter-spacing: 2px; flex: 1; text-align: center; }
      .copy-btn { background-color: #f0f0f0; border: none; border-radius: 12px; padding: 10px 16px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
      .copy-btn:hover { background-color: #e5e5e5; }
      .code-input { width: 100%; padding: 18px; border: 1px solid #e5e5e5; border-radius: 16px; font-size: 18px; text-align: center; margin-bottom: 20px; background-color: #f8f8f8; }
      .activate-btn { width: 100%; padding: 18px; background: #121212; border: none; border-radius: 16px; font-size: 18px; font-weight: 600; color: #ffffff; cursor: pointer; margin-bottom: 36px; }
      .error-tip { color: #ff4d4f; font-size: 14px; margin-bottom: 20px; padding: 10px; border-radius: 8px; background-color: #fff1f0; border: 1px solid #ffa39e; }
      .footer-text { font-size: 13px; color: #888888; line-height: 1.8; }
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
        navigator.clipboard.writeText(code).then(() => alert('设备码已复制'));
      }
    </script>
  </body>
  </html>
  `;
}