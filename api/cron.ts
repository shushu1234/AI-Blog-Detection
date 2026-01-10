/**
 * Cron触发器API端点
 * 由Vercel Cron定时调用，执行网页变更检测
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { detectAllSites } from '../src/lib/detector.js';
import { sitesConfig } from '../src/config/sites.js';
import type { SiteConfig } from '../src/types/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 验证Cron请求（Vercel会自动添加这个header）
  const authHeader = req.headers.authorization;
  
  // 在生产环境中验证授权
  if (process.env.VERCEL && process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('开始执行网页变更检测...');
    console.log(`共有 ${sitesConfig.length} 个网站配置`);

    const startTime = Date.now();
    const { results, changes } = await detectAllSites(sitesConfig);
    const duration = Date.now() - startTime;

    // 统计结果
    const stats = {
      total: results.length,
      changed: changes.length,
      errors: results.filter(r => r.error).length,
      duration: `${duration}ms`,
    };

    console.log('检测完成:', stats);

    // 记录变更详情
    if (changes.length > 0) {
      console.log('发现以下变更:');
      changes.forEach(c => {
        console.log(`- ${c.siteName}: ${c.siteUrl}`);
      });
    }

    return res.status(200).json({
      success: true,
      message: '检测完成',
      stats,
      changes: changes.map(c => ({
        site: c.siteName,
        url: c.siteUrl,
        changedAt: c.changedAt,
      })),
      errors: results
        .filter(r => r.error)
        .map(r => ({
          siteId: r.siteId,
          error: r.error,
        })),
    });
  } catch (error) {
    console.error('检测失败:', error);
    return res.status(500).json({
      success: false,
      error: '检测失败',
      message: error instanceof Error ? error.message : '未知错误',
    });
  }
}

