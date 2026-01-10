/**
 * 站点文章列表页面
 * GET /api/site?id=xxx - 显示指定站点的已抓取文章列表
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sitesConfig } from '../src/config/sites.js';
import { getSiteState, getArticlesBySite } from '../src/lib/storage.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const baseUrl = `https://${req.headers.host}`;
  const siteId = req.query.id as string;

  if (!siteId) {
    return res.redirect(302, '/');
  }

  // 查找站点配置
  const siteConfig = sitesConfig.find(s => s.id === siteId);
  if (!siteConfig) {
    return res.status(404).send(generateErrorPage(baseUrl, '站点不存在', `未找到 ID 为 "${siteId}" 的站点配置`));
  }

  // 获取站点状态和文章列表
  const [siteState, articles] = await Promise.all([
    getSiteState(siteId),
    getArticlesBySite(siteId, 100),
  ]);

  const lastChecked = siteState?.lastChecked 
    ? new Date(siteState.lastChecked).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    : '从未抓取';
  
  const lastChanged = siteState?.lastChanged
    ? new Date(siteState.lastChanged).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    : '暂无更新';

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteConfig.name} - 文章列表 | AI-Blog-Detection</title>
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
      --purple: #a855f7;
      --purple-dim: rgba(168, 85, 247, 0.1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .breadcrumb a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .breadcrumb a:hover {
      color: var(--accent);
    }
    .breadcrumb span {
      color: var(--text-muted);
    }
    .breadcrumb .current {
      color: var(--text);
    }
    .site-header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .site-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .site-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .site-title h1 {
      font-size: 24px;
      font-weight: 600;
    }
    .site-badge {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 500;
      background: var(--accent-dim);
      color: var(--accent);
    }
    .visit-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: var(--blue-dim);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      color: var(--blue);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .visit-btn:hover {
      background: rgba(59, 130, 246, 0.15);
      transform: translateY(-1px);
    }
    .site-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .meta-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 14px;
      color: var(--text);
    }
    .meta-value.highlight {
      color: var(--accent);
      font-weight: 500;
    }
    .articles-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }
    .articles-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
    }
    .articles-header h2 {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .articles-count {
      font-size: 12px;
      color: var(--purple);
      background: var(--purple-dim);
      padding: 4px 10px;
      border-radius: 20px;
    }
    .articles-list {
      padding: 0;
    }
    .article-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;
    }
    .article-item:last-child {
      border-bottom: none;
    }
    .article-item:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .article-index {
      min-width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border);
      border-radius: 8px;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .article-content {
      flex: 1;
      min-width: 0;
    }
    .article-title {
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 6px;
    }
    .article-title a {
      color: var(--text);
      text-decoration: none;
      transition: color 0.2s;
    }
    .article-title a:hover {
      color: var(--blue);
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .article-time {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 24px;
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .empty-desc {
      font-size: 14px;
      color: var(--text-muted);
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 24px;
      padding: 12px 20px;
      background: var(--accent-dim);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 10px;
      color: var(--accent);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: rgba(34, 197, 94, 0.15);
      transform: translateY(-1px);
    }
    @media (max-width: 600px) {
      .site-title-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .site-meta {
        gap: 16px;
      }
      .meta-item {
        min-width: 45%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav class="breadcrumb">
      <a href="/">🏠 首页</a>
      <span>›</span>
      <span class="current">${siteConfig.name}</span>
    </nav>

    <div class="site-header">
      <div class="site-title-row">
        <div class="site-title">
          <h1>${siteConfig.name}</h1>
          <span class="site-badge">${siteConfig.enabled !== false ? '监控中' : '已禁用'}</span>
        </div>
        <a href="${siteConfig.url}" target="_blank" class="visit-btn">
          <span>🔗</span>
          访问官网
        </a>
      </div>
      <div class="site-meta">
        <div class="meta-item">
          <span class="meta-label">最近抓取</span>
          <span class="meta-value">${lastChecked}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">最近更新</span>
          <span class="meta-value highlight">${lastChanged}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">已收录文章</span>
          <span class="meta-value">${articles.length} 篇</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">源站域名</span>
          <span class="meta-value">${new URL(siteConfig.url).hostname}</span>
        </div>
      </div>
    </div>

    <div class="articles-card">
      <div class="articles-header">
        <h2>📰 已抓取文章</h2>
        <span class="articles-count">${articles.length} 篇</span>
      </div>
      ${articles.length > 0 ? `
        <div class="articles-list">
          ${articles.map((article, index) => `
            <div class="article-item">
              <div class="article-index">${index + 1}</div>
              <div class="article-content">
                <div class="article-title">
                  ${article.url 
                    ? `<a href="${article.url}" target="_blank">${escapeHtml(article.title)}</a>`
                    : escapeHtml(article.title)
                  }
                </div>
                <div class="article-meta">
                  <span class="article-time">
                    <span>🕐</span>
                    ${article.discoveredAt 
                      ? new Date(article.discoveredAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
                      : '未知时间'
                    }
                  </span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">暂无文章</div>
          <div class="empty-desc">该站点尚未抓取到任何文章，点击下方按钮立即抓取</div>
          <a href="/" class="back-btn">
            <span>⚡</span>
            返回首页抓取
          </a>
        </div>
      `}
    </div>

    ${articles.length > 0 ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="/" class="back-btn">
          <span>←</span>
          返回首页
        </a>
      </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateErrorPage(baseUrl: string, title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | AI-Blog-Detection</title>
  <style>
    :root {
      --bg: #0a0a0b;
      --card: #141416;
      --border: #27272a;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --red: #ef4444;
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
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      max-width: 400px;
    }
    .error-icon { font-size: 48px; margin-bottom: 16px; }
    .error-title { font-size: 20px; margin-bottom: 8px; color: var(--red); }
    .error-message { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 12px 20px;
      background: var(--accent-dim);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 10px;
      color: var(--accent);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="error-icon">❌</div>
    <div class="error-title">${title}</div>
    <div class="error-message">${message}</div>
    <a href="/" class="back-btn">← 返回首页</a>
  </div>
</body>
</html>
  `.trim();
}

