/**
 * 手动触发检测API端点
 * POST /api/trigger - 手动触发一次检测
 * POST /api/trigger?site=xxx - 检测特定网站
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { detectAllSites, detectSite } from '../src/lib/detector.js';
import { updateSiteState, addChangeRecord } from '../src/lib/storage.js';
import { hashContent } from '../src/lib/extractor.js';
import sitesConfig from '../src/config/sites.json';
import type { SiteConfig } from '../src/types/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 允许 POST 和 GET 请求（GET 用于页面触发）
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 简单的API密钥验证（可选）
  const apiKey = req.headers['x-api-key'] || req.query.key;
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  try {
    const siteId = req.query.site as string;
    const configs = sitesConfig as SiteConfig[];

    if (siteId) {
      // 检测特定网站
      const config = configs.find(c => c.id === siteId);
      if (!config) {
        return res.status(404).json({ error: '网站配置不存在' });
      }

      const result = await detectSite(config);
      
      if (!result.error) {
        const now = new Date().toISOString();
        const contentHash = await hashContent(result.currentContent);
        
        await updateSiteState({
          id: config.id,
          contentHash,
          content: result.currentContent,
          lastChecked: now,
          lastChanged: result.changed ? now : undefined,
          articles: result.articles,
        });

        if (result.changed && result.previousContent !== undefined) {
          await addChangeRecord({
            siteId: config.id,
            siteName: config.name,
            siteUrl: config.url,
            changedAt: now,
            oldContent: result.previousContent,
            newContent: result.currentContent,
            description: config.description,
            newArticles: result.articles,
            oldArticles: result.previousArticles,
          });
        }
      }

      return res.status(200).json({
        success: true,
        result: {
          siteId: result.siteId,
          siteName: config.name,
          siteUrl: config.url,
          changed: result.changed,
          error: result.error,
          articles: result.articles || [],
          contentPreview: result.currentContent.substring(0, 500),
        },
      });
    } else {
      // 检测所有网站
      const { results, changes } = await detectAllSites(configs);

      // 构建详细的结果
      const detailedResults = results.map((r, i) => {
        const config = configs.find(c => c.id === r.siteId);
        return {
          siteId: r.siteId,
          siteName: config?.name || r.siteId,
          siteUrl: config?.url || '',
          changed: r.changed,
          error: r.error,
          articles: r.articles || [],
          articleCount: r.articles?.length || 0,
        };
      });

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          total: results.length,
          changed: changes.length,
          errors: results.filter(r => r.error).length,
        },
        results: detailedResults,
        changes: changes.map(c => ({
          site: c.siteName,
          url: c.siteUrl,
          newArticles: c.newArticles,
        })),
      });
    }
  } catch (error) {
    console.error('触发检测失败:', error);
    return res.status(500).json({
      success: false,
      error: '触发检测失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}
