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
  <title>AI-Blog-Detection - AI博客变更检测</title>
  <style>
    :root {
      --bg: #0a0a0b;
      --card: #141416;
      --border: #27272a;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #22c55e;
      --accent-dim: rgba(34, 197, 94, 0.1);
      --blue: #3b82f6;
      --blue-dim: rgba(59, 130, 246, 0.1);
      --orange: #f97316;
      --orange-dim: rgba(249, 115, 22, 0.1);
      --red: #ef4444;
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
      max-width: 800px;
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
    .post { background: var(--blue-dim); color: var(--blue); }
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
      cursor: pointer;
    }
    .rss-btn:hover {
      background: rgba(34, 197, 94, 0.15);
      transform: translateY(-2px);
    }
    .trigger-btn {
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, var(--blue) 0%, #6366f1 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .trigger-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
    }
    .trigger-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .trigger-btn .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .results {
      margin-top: 20px;
      display: none;
    }
    .results.show {
      display: block;
    }
    .results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .results-stats {
      display: flex;
      gap: 16px;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-muted);
    }
    .stat-value {
      font-weight: 600;
      color: var(--text);
    }
    .stat.success .stat-value { color: var(--accent); }
    .stat.changed .stat-value { color: var(--orange); }
    .stat.error .stat-value { color: var(--red); }
    .site-result {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .site-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .site-name {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .site-name a {
      color: var(--text);
      text-decoration: none;
    }
    .site-name a:hover {
      color: var(--accent);
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 20px;
      font-weight: 500;
    }
    .badge.changed {
      background: var(--orange-dim);
      color: var(--orange);
    }
    .badge.unchanged {
      background: var(--accent-dim);
      color: var(--accent);
    }
    .badge.error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--red);
    }
    .article-count {
      font-size: 12px;
      color: var(--text-muted);
    }
    .articles-list {
      max-height: 300px;
      overflow-y: auto;
    }
    .article-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .article-item:last-child {
      border-bottom: none;
    }
    .article-index {
      color: var(--text-muted);
      font-size: 12px;
      min-width: 24px;
    }
    .article-content {
      flex: 1;
    }
    .article-title {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .article-title a {
      color: var(--text);
      text-decoration: none;
    }
    .article-title a:hover {
      color: var(--blue);
    }
    .article-url {
      font-size: 12px;
      color: var(--text-muted);
      word-break: break-all;
    }
    .error-message {
      color: var(--red);
      font-size: 13px;
      padding: 10px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 8px;
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
    .timestamp {
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">🔍</div>
      <h1>AI-Blog-Detection</h1>
      <p class="subtitle">AI博客变更检测 · 自动生成 RSS 订阅</p>
    </header>

    <div class="card">
      <h2>🚀 立即爬取</h2>
      <button class="trigger-btn" id="triggerBtn" onclick="triggerDetection()">
        <span>⚡</span>
        <span id="btnText">立即检测所有博客</span>
      </button>
      <div class="results" id="results">
        <div class="results-header">
          <div class="results-stats" id="stats"></div>
          <span class="timestamp" id="timestamp"></span>
        </div>
        <div id="siteResults"></div>
      </div>
    </div>

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

  <script>
    const baseUrl = '${baseUrl}';
    
    async function triggerDetection() {
      const btn = document.getElementById('triggerBtn');
      const btnText = document.getElementById('btnText');
      const results = document.getElementById('results');
      const stats = document.getElementById('stats');
      const siteResults = document.getElementById('siteResults');
      const timestamp = document.getElementById('timestamp');
      
      // 禁用按钮，显示加载状态
      btn.disabled = true;
      btnText.innerHTML = '<div class="spinner"></div> 正在检测中...';
      
      try {
        const response = await fetch(baseUrl + '/api/trigger');
        const data = await response.json();
        
        if (data.success) {
          // 显示结果区域
          results.classList.add('show');
          
          // 更新统计
          stats.innerHTML = \`
            <div class="stat success">
              <span>✓</span>
              <span class="stat-value">\${data.stats.total}</span>
              <span>个站点</span>
            </div>
            <div class="stat changed">
              <span>🔄</span>
              <span class="stat-value">\${data.stats.changed}</span>
              <span>有更新</span>
            </div>
            \${data.stats.errors > 0 ? \`
            <div class="stat error">
              <span>⚠️</span>
              <span class="stat-value">\${data.stats.errors}</span>
              <span>个错误</span>
            </div>
            \` : ''}
          \`;
          
          // 更新时间戳
          timestamp.textContent = '检测时间: ' + new Date(data.timestamp).toLocaleString('zh-CN');
          
          // 显示每个站点的结果
          siteResults.innerHTML = data.results.map(result => \`
            <div class="site-result">
              <div class="site-header">
                <div class="site-name">
                  <a href="\${result.siteUrl}" target="_blank">\${result.siteName}</a>
                  <span class="badge \${result.error ? 'error' : (result.changed ? 'changed' : 'unchanged')}">
                    \${result.error ? '错误' : (result.changed ? '有更新' : '无变化')}
                  </span>
                </div>
                <span class="article-count">\${result.articleCount} 篇文章</span>
              </div>
              \${result.error ? \`
                <div class="error-message">\${result.error}</div>
              \` : \`
                <div class="articles-list">
                  \${result.articles.slice(0, 10).map((article, i) => \`
                    <div class="article-item">
                      <span class="article-index">\${i + 1}.</span>
                      <div class="article-content">
                        <div class="article-title">
                          \${article.url ? \`<a href="\${article.url}" target="_blank">\${article.title}</a>\` : article.title}
                        </div>
                        \${article.url ? \`<div class="article-url">\${article.url}</div>\` : ''}
                      </div>
                    </div>
                  \`).join('')}
                  \${result.articles.length > 10 ? \`
                    <div style="text-align: center; padding: 10px; color: var(--text-muted); font-size: 13px;">
                      ... 还有 \${result.articles.length - 10} 篇文章
                    </div>
                  \` : ''}
                </div>
              \`}
            </div>
          \`).join('');
          
        } else {
          results.classList.add('show');
          siteResults.innerHTML = \`
            <div class="error-message">
              检测失败: \${data.message || data.error || '未知错误'}
            </div>
          \`;
        }
      } catch (error) {
        results.classList.add('show');
        siteResults.innerHTML = \`
          <div class="error-message">
            请求失败: \${error.message}
          </div>
        \`;
      } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btnText.innerHTML = '⚡ 再次检测';
      }
    }
  </script>
</body>
</html>
  `.trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
