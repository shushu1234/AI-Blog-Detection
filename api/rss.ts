/**
 * RSS订阅API端点
 * GET /api/rss - 返回RSS Feed
 * GET /api/rss?format=atom - 返回Atom Feed
 * GET /api/rss?format=json - 返回JSON Feed
 * GET /api/rss?site=cursor-blog - 返回特定网站的Feed
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getArticles, getArticlesBySite } from '../src/lib/storage.js';
import { generateRSS, generateAtom, generateJSONFeed } from '../src/lib/rss-generator.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const format = (req.query.format as string) || 'rss';
    const limit = parseInt(req.query.limit as string) || 100;
    const siteId = req.query.site as string;
    
    // 获取文章记录
    const articles = siteId 
      ? await getArticlesBySite(siteId, limit)
      : await getArticles(limit);

    // 获取基础URL
    const baseUrl = `https://${req.headers.host}`;
    
    const options = {
      title: siteId 
        ? `AI-Blog-Detection - ${siteId}`
        : 'AI-Blog-Detection - AI博客变更检测',
      description: siteId
        ? `监控 ${siteId} 的最新文章`
        : '监控AI博客内容变更，及时获取更新通知',
      link: baseUrl,
    };

    let content: string;
    let contentType: string;

    switch (format.toLowerCase()) {
      case 'atom':
        content = generateAtom(articles, options);
        contentType = 'application/atom+xml; charset=utf-8';
        break;
      case 'json':
        content = generateJSONFeed(articles, options);
        contentType = 'application/json; charset=utf-8';
        break;
      case 'rss':
      default:
        content = generateRSS(articles, options);
        contentType = 'application/rss+xml; charset=utf-8';
        break;
    }

    // 设置缓存头（缓存10分钟）
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.setHeader('Content-Type', contentType);
    
    return res.status(200).send(content);
  } catch (error) {
    console.error('生成RSS失败:', error);
    return res.status(500).json({ 
      error: '生成RSS失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
