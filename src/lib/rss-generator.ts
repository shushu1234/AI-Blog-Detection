/**
 * RSS生成模块
 */
import { Feed } from 'feed';
import type { ChangeRecord, ArticleInfo } from '../types/index.js';

export interface RSSOptions {
  /** 订阅标题 */
  title: string;
  /** 订阅描述 */
  description: string;
  /** 订阅链接 */
  link: string;
  /** 作者 */
  author?: string;
  /** 语言 */
  language?: string;
}

const DEFAULT_OPTIONS: RSSOptions = {
  title: 'AI-Blog-Detection - AI博客变更检测',
  description: '监控AI博客内容变更，及时获取更新通知',
  link: 'https://ai-blog-detection.vercel.app',
  author: 'AI-Blog-Detection',
  language: 'zh-CN',
};

/**
 * 生成文章列表HTML
 */
function generateArticleListHtml(articles: ArticleInfo[]): string {
  if (!articles || articles.length === 0) {
    return '';
  }
  
  let html = '<h4 style="color: #3b82f6; margin: 10px 0 5px;">📝 新文章列表:</h4>';
  html += '<ul style="margin: 0; padding-left: 20px;">';
  
  for (const article of articles) {
    if (article.url) {
      html += `<li style="margin: 5px 0;"><a href="${escapeHtml(article.url)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(article.title)}</a></li>`;
    } else {
      html += `<li style="margin: 5px 0;">${escapeHtml(article.title)}</li>`;
    }
  }
  
  html += '</ul>';
  return html;
}

/**
 * 生成RSS Feed
 */
export function generateRSS(
  changes: ChangeRecord[],
  options: Partial<RSSOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const feed = new Feed({
    title: opts.title,
    description: opts.description,
    id: opts.link,
    link: opts.link,
    language: opts.language,
    copyright: `Copyright ${new Date().getFullYear()}`,
    updated: changes.length > 0 ? new Date(changes[0].changedAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  // 添加变更条目
  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent, change.newArticles);
    
    // 如果有新文章且新文章有URL，使用第一篇新文章的URL作为链接
    const itemLink = change.newArticles?.[0]?.url || change.siteUrl;
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: itemLink,
      description: change.description || `检测到 ${change.siteName} 发生了变更`,
      content: contentDiff,
      date: new Date(change.changedAt),
      author: [{ name: change.siteName }],
    });
  }

  return feed.rss2();
}

/**
 * 生成Atom Feed
 */
export function generateAtom(
  changes: ChangeRecord[],
  options: Partial<RSSOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const feed = new Feed({
    title: opts.title,
    description: opts.description,
    id: opts.link,
    link: opts.link,
    language: opts.language,
    copyright: `Copyright ${new Date().getFullYear()}`,
    updated: changes.length > 0 ? new Date(changes[0].changedAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent, change.newArticles);
    const itemLink = change.newArticles?.[0]?.url || change.siteUrl;
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: itemLink,
      description: change.description || `检测到 ${change.siteName} 发生了变更`,
      content: contentDiff,
      date: new Date(change.changedAt),
    });
  }

  return feed.atom1();
}

/**
 * 生成JSON Feed
 */
export function generateJSONFeed(
  changes: ChangeRecord[],
  options: Partial<RSSOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const feed = new Feed({
    title: opts.title,
    description: opts.description,
    id: opts.link,
    link: opts.link,
    language: opts.language,
    copyright: `Copyright ${new Date().getFullYear()}`,
    updated: changes.length > 0 ? new Date(changes[0].changedAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
  });

  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent, change.newArticles);
    const itemLink = change.newArticles?.[0]?.url || change.siteUrl;
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: itemLink,
      description: change.description || `检测到 ${change.siteName} 发生了变更`,
      content: contentDiff,
      date: new Date(change.changedAt),
    });
  }

  return feed.json1();
}

/**
 * 生成内容差异的HTML展示
 */
function generateContentDiff(
  oldContent: string, 
  newContent: string, 
  newArticles?: ArticleInfo[]
): string {
  let html = '<div style="font-family: monospace; font-size: 14px;">';
  
  // 显示新文章列表（如果有）
  if (newArticles && newArticles.length > 0) {
    html += generateArticleListHtml(newArticles);
  }
  
  // 显示旧内容
  if (oldContent) {
    html += '<h4 style="color: #d73a49; margin: 10px 0 5px;">旧内容:</h4>';
    html += '<div style="background: #ffeef0; padding: 10px; border-radius: 4px; white-space: pre-wrap;">';
    html += escapeHtml(oldContent);
    html += '</div>';
  }

  // 显示新内容
  html += '<h4 style="color: #22863a; margin: 10px 0 5px;">新内容:</h4>';
  html += '<div style="background: #e6ffed; padding: 10px; border-radius: 4px; white-space: pre-wrap;">';
  html += escapeHtml(newContent);
  html += '</div>';

  html += '</div>';
  
  return html;
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
