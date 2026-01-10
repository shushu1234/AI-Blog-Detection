/**
 * 手动触发检测API端点
 * POST /api/trigger - 手动触发一次检测
 * POST /api/trigger?site=xxx - 检测特定网站
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { detectAllSites, detectSite } from '../src/lib/detector.js';
import { updateSiteState, filterNewArticles, addArticles } from '../src/lib/storage.js';
import { hashContent } from '../src/lib/extractor.js';
import { sitesConfig } from '../src/config/sites.js';

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
    const configs = sitesConfig;

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
        
        // 更新站点状态
        await updateSiteState({
          id: config.id,
          contentHash,
          content: result.currentContent,
          lastChecked: now,
          lastChanged: result.changed ? now : undefined,
          knownArticleUrls: result.articles?.map(a => a.url).filter(Boolean) as string[],
        });

        // 保存新文章到数据库
        if (result.newArticles && result.newArticles.length > 0) {
          const newRecords = result.newArticles.map(a => ({
            siteId: config.id,
            siteName: config.name,
            title: a.title,
            url: a.url || config.url,
            discoveredAt: now,
          }));
          await addArticles(newRecords);
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
          newArticles: result.newArticles || [],
          contentPreview: result.currentContent.substring(0, 500),
        },
      });
    } else {
      // 检测所有网站
      const { results, newArticles } = await detectAllSites(configs);

      // 构建详细的结果
      const detailedResults = results.map((r) => {
        const config = configs.find(c => c.id === r.siteId);
        return {
          siteId: r.siteId,
          siteName: config?.name || r.siteId,
          siteUrl: config?.url || '',
          changed: r.changed,
          error: r.error,
          articles: r.articles || [],
          newArticles: r.newArticles || [],
          articleCount: r.articles?.length || 0,
          newArticleCount: r.newArticles?.length || 0,
        };
      });

      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          total: results.length,
          changed: results.filter(r => r.changed).length,
          errors: results.filter(r => r.error).length,
          newArticles: newArticles.length,
        },
        results: detailedResults,
        newArticles: newArticles.map(a => ({
          site: a.siteName,
          title: a.title,
          url: a.url,
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
