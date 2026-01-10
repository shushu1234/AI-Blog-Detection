import type { SiteConfig } from '../types/index.js';

/**
 * 网站配置列表
 * 在这里添加要监控的博客网站
 */
export const sitesConfig: SiteConfig[] = [
  {
    id: 'cursor-blog',
    name: 'Cursor Blog',
    url: 'https://cursor.com/cn/blog',
    xpath: "//main[@id='main']//article",
    articleUrlXPath: "//main[@id='main']//article//a/@href",
    description: '监控Cursor Blog的最新文章',
    enabled: true,
  },
  {
    id: 'lovart-blog',
    name: 'Lovart Blog',
    url: 'https://www.lovart.ai/zh/blog',
    xpath: '//a[article]/article//h2',
    articleUrlXPath: '//a[article]/@href',
    description: '监控Lovart Blog的最新文章',
    enabled: true,
  },
];

export default sitesConfig;

