/**
 * 变更检测模块
 * 每篇文章独立保存到数据库
 */
import type { SiteConfig, SiteState, DetectionResult, ArticleInfo, ArticleRecord } from '../types/index.js';
import { fetchPage } from './fetcher.js';
import { extractArticles, hashContent } from './extractor.js';
import { getSiteState, updateSiteState, filterNewArticles, addArticles } from './storage.js';

/**
 * 检测单个网站
 */
export async function detectSite(config: SiteConfig): Promise<DetectionResult> {
  const result: DetectionResult = {
    siteId: config.id,
    changed: false,
    currentContent: '',
  };

  try {
    // 1. 抓取页面
    const html = await fetchPage(config.url);

    // 2. 提取内容和文章列表
    const extraction = extractArticles(html, config);
    result.currentContent = extraction.content;
    result.articles = extraction.articles;

    if (!extraction.content) {
      result.error = '未能提取到任何内容，请检查XPath或CSS选择器';
      return result;
    }

    // 3. 获取之前的状态
    const previousState = await getSiteState(config.id);
    
    if (previousState) {
      result.previousContent = previousState.content;
      
      // 4. 比较内容
      const currentHash = await hashContent(extraction.content);
      if (currentHash !== previousState.contentHash) {
        result.changed = true;
      }
    } else {
      // 首次检测，视为有变更
      result.changed = true;
    }

    // 5. 过滤出新文章（通过URL去重）
    const newArticleRecords = await filterNewArticles(
      extraction.articles,
      config.id,
      config.name
    );
    
    if (newArticleRecords.length > 0) {
      result.changed = true;
      result.newArticles = newArticleRecords.map(r => ({
        title: r.title,
        url: r.url,
      }));
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : '未知错误';
    return result;
  }
}

/**
 * 检测所有网站并保存新文章
 */
export async function detectAllSites(configs: SiteConfig[]): Promise<{
  results: DetectionResult[];
  newArticles: ArticleRecord[];
}> {
  const enabledConfigs = configs.filter(c => c.enabled !== false);
  const results: DetectionResult[] = [];
  const allNewArticles: ArticleRecord[] = [];

  // 并发检测所有网站
  const detectionPromises = enabledConfigs.map(config => detectSite(config));
  const detectionResults = await Promise.allSettled(detectionPromises);

  for (let i = 0; i < enabledConfigs.length; i++) {
    const config = enabledConfigs[i];
    const settledResult = detectionResults[i];

    if (settledResult.status === 'fulfilled') {
      const result = settledResult.value;
      results.push(result);

      if (!result.error) {
        const now = new Date().toISOString();
        const contentHash = await hashContent(result.currentContent);
        
        // 更新站点状态
        const state: SiteState = {
          id: config.id,
          contentHash,
          content: result.currentContent,
          lastChecked: now,
          lastChanged: result.changed ? now : undefined,
          knownArticleUrls: result.articles?.map(a => a.url).filter(Boolean) as string[],
        };
        await updateSiteState(state);

        // 收集新文章
        if (result.newArticles && result.newArticles.length > 0) {
          const newRecords = result.newArticles.map(a => ({
            siteId: config.id,
            siteName: config.name,
            title: a.title,
            url: a.url || config.url,
            discoveredAt: now,
          }));
          allNewArticles.push(...newRecords);
        }
      }
    } else {
      results.push({
        siteId: config.id,
        changed: false,
        currentContent: '',
        error: settledResult.reason?.message || '检测失败',
      });
    }
  }

  // 批量保存新文章到数据库
  if (allNewArticles.length > 0) {
    await addArticles(allNewArticles);
    console.log(`保存了 ${allNewArticles.length} 篇新文章到数据库`);
  }

  return { results, newArticles: allNewArticles };
}
