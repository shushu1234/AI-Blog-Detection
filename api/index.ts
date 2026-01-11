/**
 * 首页API端点
 * GET / - 返回项目信息和使用说明
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sitesConfig } from '../src/config/sites.js';
import { getLastCrawlTime } from '../src/lib/storage.js';

// 网站分类
const siteCategories = [
  {
    name: 'AI 编辑器 / IDE',
    icon: '💻',
    sites: ['cursor-blog', 'windsurf-blog', 'cline-blog'],
  },
  {
    name: 'AI 研究 / 大厂',
    icon: '🔬',
    sites: ['anthropic-engineering', 'openai-developer-blog', 'openai-research', 'google-research-blog', 'microsoft-ai-news'],
  },
  {
    name: 'LLM 框架 / Agent',
    icon: '🤖',
    sites: ['langchain-blog', 'llamaindex-blog', 'crewai-blog', 'mcp-blog', 'letta-blog', 'mem0-blog'],
  },
  {
    name: 'AI 开发平台',
    icon: '🛠️',
    sites: ['dify-blog', 'n8n-blog', 'langfuse-blog', 'langflow-blog'],
  },
  {
    name: 'RAG / 向量数据库',
    icon: '🗄️',
    sites: ['ragflow-blog', 'weaviate-blog', 'milvus-blog', 'qdrant-blog'],
  },
  {
    name: '其他 AI 产品',
    icon: '✨',
    sites: ['lovart-blog', 'manus-blog'],
  },
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const baseUrl = `https://${req.headers.host}`;

  // 获取最近爬取时间
  const lastCrawlTime = await getLastCrawlTime();
  const lastCrawlTimeStr = lastCrawlTime 
    ? new Date(lastCrawlTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    : '从未爬取';

  // 构建网站配置映射
  const sitesMap = new Map(sitesConfig.map(s => [s.id, s]));

  // 生成网站列表HTML
  const sitesListHtml = siteCategories.map(cat => {
    const categorySites = cat.sites
      .map(id => sitesMap.get(id))
      .filter(Boolean);
    
    if (categorySites.length === 0) return '';

    return `
      <div class="category">
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-name">${cat.name}</span>
          <span class="category-count">${categorySites.length}</span>
        </div>
        <div class="sites-grid">
          ${categorySites.map(site => `
            <a href="${baseUrl}/api/site?id=${site!.id}" class="site-card">
              <div class="site-card-name">${site!.name}</div>
              <div class="site-card-url">${new URL(site!.url).hostname}</div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

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
      --purple: #a855f7;
      --purple-dim: rgba(168, 85, 247, 0.1);
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
      max-width: 900px;
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
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 24px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent) 0%, var(--blue) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat-label {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .last-crawl-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      padding: 12px 20px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 14px;
      color: var(--text-muted);
    }
    .last-crawl-info strong {
      color: var(--accent);
    }
    .last-crawl-icon {
      font-size: 16px;
    }
    .cron-hint {
      font-size: 12px;
      opacity: 0.7;
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
    .stat-value-sm {
      font-weight: 600;
      color: var(--text);
    }
    .stat.success .stat-value-sm { color: var(--accent); }
    .stat.changed .stat-value-sm { color: var(--orange); }
    .stat.error .stat-value-sm { color: var(--red); }
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
    /* 网站列表样式 */
    .category {
      margin-bottom: 24px;
    }
    .category:last-child {
      margin-bottom: 0;
    }
    .category-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .category-icon {
      font-size: 18px;
    }
    .category-name {
      font-weight: 600;
      font-size: 14px;
    }
    .category-count {
      font-size: 11px;
      background: var(--purple-dim);
      color: var(--purple);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .sites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
    }
    .site-card {
      display: block;
      padding: 12px 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .site-card:hover {
      background: rgba(255,255,255,0.05);
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .site-card-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 4px;
    }
    .site-card-url {
      font-size: 11px;
      color: var(--text-muted);
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
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${sitesConfig.filter(s => s.enabled !== false).length}</div>
          <div class="stat-label">监控站点</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${siteCategories.length}</div>
          <div class="stat-label">分类</div>
        </div>
      </div>
      <div class="last-crawl-info">
        <span class="last-crawl-icon">🕐</span>
        <span>最近爬取：<strong>${lastCrawlTimeStr}</strong></span>
        <span class="cron-hint">（每天 00:00 北京时间自动爬取）</span>
      </div>
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
      <h2>📋 监控网站列表</h2>
      ${sitesListHtml}
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
          <p class="endpoint-desc">获取 RSS 订阅（支持 format、site 参数）</p>
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
          <span class="endpoint-method get">GET</span>
          <span class="endpoint-path">/api/trigger</span>
          <p class="endpoint-desc">手动触发检测</p>
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
      
      btn.disabled = true;
      btnText.innerHTML = '<div class="spinner"></div> 正在检测中...';
      
      try {
        const response = await fetch(baseUrl + '/api/trigger');
        const data = await response.json();
        
        if (data.success) {
          results.classList.add('show');
          
          stats.innerHTML = \`
            <div class="stat success">
              <span>✓</span>
              <span class="stat-value-sm">\${data.stats.total}</span>
              <span>个站点</span>
            </div>
            <div class="stat changed">
              <span>🔄</span>
              <span class="stat-value-sm">\${data.stats.changed}</span>
              <span>有更新</span>
            </div>
            \${data.stats.newArticles > 0 ? \`
            <div class="stat" style="color: var(--purple);">
              <span>📝</span>
              <span class="stat-value-sm" style="color: var(--purple);">\${data.stats.newArticles}</span>
              <span>篇新文章</span>
            </div>
            \` : ''}
            \${data.stats.errors > 0 ? \`
            <div class="stat error">
              <span>⚠️</span>
              <span class="stat-value-sm">\${data.stats.errors}</span>
              <span>个错误</span>
            </div>
            \` : ''}
          \`;
          
          timestamp.textContent = '检测时间: ' + new Date(data.timestamp).toLocaleString('zh-CN');
          
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
