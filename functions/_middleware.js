<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>uou bubble激活</title>
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
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }
    /* 卡片悬浮效果 */
    .activate-card {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border-radius: 32px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.8);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .activate-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    }
    /* 标题样式 */
    .card-title {
      font-size: 42px;
      font-weight: 700;
      color: #212529;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .card-subtitle {
      font-size: 16px;
      color: #6c757d;
      margin-bottom: 40px;
      font-weight: 400;
    }
    /* 设备码区域 */
    .device-code-box {
      width: 100%;
      background-color: #f8f9fa;
      border-radius: 20px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      border: 1px solid #e9ecef;
      transition: background-color 0.2s ease;
    }
    .device-code-box:hover {
      background-color: #f1f3f5;
    }
    .device-label {
      font-size: 16px;
      color: #495057;
      font-weight: 500;
    }
    .device-code {
      font-size: 20px;
      font-weight: 700;
      color: #212529;
      letter-spacing: 2px;
      margin: 0 12px;
      flex: 1;
      text-align: center;
    }
    /* 复制按钮 */
    .copy-btn {
      background-color: #e9ecef;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .copy-btn:hover {
      background-color: #dee2e6;
      color: #212529;
    }
    .copy-btn:active {
      transform: scale(0.96);
    }
    /* 输入框 */
    .code-input {
      width: 100%;
      padding: 18px;
      border: 1px solid #ced4da;
      border-radius: 16px;
      font-size: 18px;
      text-align: center;
      color: #212529;
      margin-bottom: 20px;
      background-color: #f8f9fa;
      transition: all 0.2s ease;
    }
    .code-input:focus {
      outline: none;
      border-color: #adb5bd;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(173, 181, 189, 0.2);
    }
    .code-input::placeholder {
      color: #adb5bd;
    }
    /* 激活按钮 */
    .activate-btn {
      width: 100%;
      padding: 18px;
      background: #212529;
      border: none;
      border-radius: 16px;
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
      margin-bottom: 32px;
      transition: all 0.2s ease;
    }
    .activate-btn:hover {
      background: #495057;
    }
    .activate-btn:active {
      transform: scale(0.98);
    }
    /* 错误提示 */
    .error-tip {
      color: #dc3545;
      font-size: 14px;
      margin-bottom: 20px;
      padding: 8px;
      border-radius: 8px;
      background-color: rgba(220, 53, 69, 0.05);
    }
    /* 底部文字 */
    .footer-text {
      font-size: 13px;
      color: #6c757d;
      line-height: 1.8;
    }
    .footer-text p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="activate-card">
    <h1 class="card-title">uou bubble</h1>
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
        alert('✓设备码复制成功');
      }).catch(() => {
        // 兼容不支持clipboard的浏览器
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('✓设备码复制成功');
      });
    }

    // 自动聚焦输入框
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelector('.code-input')?.focus();
    });
  </script>
</body>
</html>
