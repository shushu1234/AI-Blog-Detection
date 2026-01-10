/**
 * 状态查询API端点
 * GET /api/status - 返回当前监控状态
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllSiteStates, getArticles } from '../src/lib/storage.js';
import { sitesConfig } from '../src/config/sites.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const states = await getAllSiteStates();
    const articles = await getArticles(50);
    const configs = sitesConfig;

    const sites = configs.map(config => {
      const state = states[config.id];
      return {
        id: config.id,
        name: config.name,
        url: config.url,
        enabled: config.enabled !== false,
        lastChecked: state?.lastChecked || null,
        lastChanged: state?.lastChanged || null,
        hasContent: !!state?.content,
      };
    });

    return res.status(200).json({
      lastUpdated: new Date().toISOString(),
      totalSites: sites.length,
      enabledSites: sites.filter(s => s.enabled).length,
      totalArticles: articles.length,
      sites,
      recentArticles: articles.slice(0, 10).map(a => ({
        site: a.siteName,
        title: a.title,
        url: a.url,
        discoveredAt: a.discoveredAt,
      })),
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    return res.status(500).json({
      error: '获取状态失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}
