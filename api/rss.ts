/**
 * RSS订阅API端点
 * GET /api/rss - 返回RSS Feed
 * GET /api/rss?format=atom - 返回Atom Feed
 * GET /api/rss?format=json - 返回JSON Feed
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getChangeRecords } from '../src/lib/storage.js';
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
    const limit = parseInt(req.query.limit as string) || 50;
    
    // 获取变更记录
    const changes = await getChangeRecords(limit);

    // 获取基础URL
    const baseUrl = `https://${req.headers.host}`;
    
    const options = {
      title: 'AI-Blog-Detection - AI博客变更检测',
      description: '监控AI博客内容变更，及时获取更新通知',
      link: baseUrl,
    };

    let content: string;
    let contentType: string;

    switch (format.toLowerCase()) {
      case 'atom':
        content = generateAtom(changes, options);
        contentType = 'application/atom+xml; charset=utf-8';
        break;
      case 'json':
        content = generateJSONFeed(changes, options);
        contentType = 'application/json; charset=utf-8';
        break;
      case 'rss':
      default:
        content = generateRSS(changes, options);
        contentType = 'application/rss+xml; charset=utf-8';
        break;
    }

    // 设置缓存头（缓存1小时）
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
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

