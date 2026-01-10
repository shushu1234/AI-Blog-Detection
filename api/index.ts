/**
 * 首页API端点
 * GET / - 返回项目信息和使用说明
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const baseUrl = `https://${req.headers.host}`;

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebDetect - 网页变更检测</title>
  <style>
    :root {
      --bg: #0a0a0b;
      --card: #141416;
      --border: #27272a;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #22c55e;
      --accent-dim: rgba(34, 197, 94, 0.1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
    }
    .container {
      max-width: 720px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 12px;
      background: linear-gradient(135deg, var(--text) 0%, var(--text-muted) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .card h2 {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .endpoint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .endpoint:last-child {
      border-bottom: none;
    }
    .endpoint-info {
      flex: 1;
    }
    .endpoint-method {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      margin-right: 12px;
    }
    .get { background: var(--accent-dim); color: var(--accent); }
    .post { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .endpoint-path {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 14px;
      color: var(--text);
    }
    .endpoint-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
      margin-left: 52px;
    }
    .endpoint-link {
      color: var(--accent);
      text-decoration: none;
      font-size: 13px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .endpoint-link:hover {
      opacity: 1;
    }
    .rss-buttons {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .rss-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      background: var(--accent-dim);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      color: var(--accent);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s;
    }
    .rss-btn:hover {
      background: rgba(34, 197, 94, 0.15);
      transform: translateY(-2px);
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: var(--text-muted);
      font-size: 13px;
    }
    .footer a {
      color: var(--accent);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">🔍</div>
      <h1>WebDetect</h1>
      <p class="subtitle">网页变更检测 · 自动生成 RSS 订阅</p>
    </header>

    <div class="card">
      <h2>📰 订阅 RSS</h2>
      <div class="rss-buttons">
        <a href="${baseUrl}/api/rss" class="rss-btn">
          <span>📡</span> RSS 2.0
        </a>
        <a href="${baseUrl}/api/rss?format=atom" class="rss-btn">
          <span>⚛️</span> Atom
        </a>
        <a href="${baseUrl}/api/rss?format=json" class="rss-btn">
          <span>📋</span> JSON
        </a>
      </div>
    </div>

    <div class="card">
      <h2>🔌 API 端点</h2>
      <div class="endpoint">
        <div class="endpoint-info">
          <span class="endpoint-method get">GET</span>
          <span class="endpoint-path">/api/rss</span>
          <p class="endpoint-desc">获取 RSS 订阅（支持 format 参数）</p>
        </div>
        <a href="${baseUrl}/api/rss" class="endpoint-link">访问 →</a>
      </div>
      <div class="endpoint">
        <div class="endpoint-info">
          <span class="endpoint-method get">GET</span>
          <span class="endpoint-path">/api/status</span>
          <p class="endpoint-desc">查看监控状态</p>
        </div>
        <a href="${baseUrl}/api/status" class="endpoint-link">访问 →</a>
      </div>
      <div class="endpoint">
        <div class="endpoint-info">
          <span class="endpoint-method post">POST</span>
          <span class="endpoint-path">/api/trigger</span>
          <p class="endpoint-desc">手动触发检测</p>
        </div>
      </div>
      <div class="endpoint">
        <div class="endpoint-info">
          <span class="endpoint-method get">GET</span>
          <span class="endpoint-path">/api/cron</span>
          <p class="endpoint-desc">Cron 触发器（自动调用）</p>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>Powered by <a href="https://vercel.com" target="_blank">Vercel</a> · 
         <a href="https://github.com" target="_blank">查看源码</a></p>
    </footer>
  </div>
</body>
</html>
  `.trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

