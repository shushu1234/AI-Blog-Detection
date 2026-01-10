/**
 * RSS生成模块
 */
import { Feed } from 'feed';
import type { ChangeRecord } from '../types/index.js';

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
  title: 'WebDetect - 网页变更检测',
  description: '监控网页内容变更，及时获取更新通知',
  link: 'https://webdetect.vercel.app',
  author: 'WebDetect',
  language: 'zh-CN',
};

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
    generator: 'WebDetect RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  // 添加变更条目
  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent);
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: change.siteUrl,
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
    generator: 'WebDetect RSS Generator',
    author: opts.author ? { name: opts.author } : undefined,
  });

  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent);
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: change.siteUrl,
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
    generator: 'WebDetect RSS Generator',
  });

  for (const change of changes) {
    const contentDiff = generateContentDiff(change.oldContent, change.newContent);
    
    feed.addItem({
      title: `[更新] ${change.siteName}`,
      id: `${change.siteId}-${change.changedAt}`,
      link: change.siteUrl,
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
function generateContentDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let html = '<div style="font-family: monospace; font-size: 14px;">';
  
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

