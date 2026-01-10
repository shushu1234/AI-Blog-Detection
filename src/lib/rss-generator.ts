/**
 * RSS生成模块
 * 从数据库读取文章，每篇文章生成一个 RSS item
 */
import { Feed } from 'feed';
import type { ArticleRecord } from '../types/index.js';

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
 * 生成RSS Feed - 从文章记录列表生成
 */
export function generateRSS(
  articles: ArticleRecord[],
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
    updated: articles.length > 0 ? new Date(articles[0].discoveredAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  // 为每篇文章添加一个条目
  for (const article of articles) {
    feed.addItem({
      title: article.title,
      id: `${article.url}-${article.discoveredAt}`,
      link: article.url,
      description: `来自 ${article.siteName}`,
      content: `<p>来源: <a href="${escapeHtml(article.url)}">${escapeHtml(article.siteName)}</a></p>`,
      date: new Date(article.discoveredAt),
      author: [{ name: article.siteName }],
    });
  }

  return feed.rss2();
}

/**
 * 生成Atom Feed
 */
export function generateAtom(
  articles: ArticleRecord[],
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
    updated: articles.length > 0 ? new Date(articles[0].discoveredAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  for (const article of articles) {
    feed.addItem({
      title: article.title,
      id: `${article.url}-${article.discoveredAt}`,
      link: article.url,
      description: `来自 ${article.siteName}`,
      content: `<p>来源: <a href="${escapeHtml(article.url)}">${escapeHtml(article.siteName)}</a></p>`,
      date: new Date(article.discoveredAt),
    });
  }

  return feed.atom1();
}

/**
 * 生成JSON Feed
 */
export function generateJSONFeed(
  articles: ArticleRecord[],
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
    updated: articles.length > 0 ? new Date(articles[0].discoveredAt) : new Date(),
    generator: 'AI-Blog-Detection RSS Generator',
  });

  for (const article of articles) {
    feed.addItem({
      title: article.title,
      id: `${article.url}-${article.discoveredAt}`,
      link: article.url,
      description: `来自 ${article.siteName}`,
      content: `<p>来源: <a href="${escapeHtml(article.url)}">${escapeHtml(article.siteName)}</a></p>`,
      date: new Date(article.discoveredAt),
    });
  }

  return feed.json1();
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
