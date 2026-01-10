/**
 * 状态查询API端点
 * GET /api/status - 返回当前监控状态
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStorageData } from '../src/lib/storage.js';
import { sitesConfig } from '../src/config/sites.js';
import type { SiteConfig } from '../src/types/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await getStorageData();
    const configs = sitesConfig;

    const sites = configs.map(config => {
      const state = data.sites[config.id];
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
      lastUpdated: data.lastUpdated,
      totalSites: sites.length,
      enabledSites: sites.filter(s => s.enabled).length,
      recentChanges: data.changes.length,
      sites,
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    return res.status(500).json({
      error: '获取状态失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}

