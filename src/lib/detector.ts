/**
 * 变更检测模块
 */
import type { SiteConfig, SiteState, ChangeRecord, DetectionResult, ArticleInfo } from '../types/index.js';
import { fetchPage } from './fetcher.js';
import { extractArticles, hashContent } from './extractor.js';
import { getSiteState, batchUpdate } from './storage.js';

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
      result.previousArticles = previousState.articles;
      
      // 4. 比较内容
      const currentHash = await hashContent(extraction.content);
      if (currentHash !== previousState.contentHash) {
        result.changed = true;
      }
    } else {
      // 首次检测，视为有变更
      result.changed = true;
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : '未知错误';
    return result;
  }
}

/**
 * 找出新增的文章
 */
function findNewArticles(
  currentArticles: ArticleInfo[],
  previousArticles?: ArticleInfo[]
): ArticleInfo[] {
  if (!previousArticles || previousArticles.length === 0) {
    return currentArticles;
  }
  
  const previousTitles = new Set(previousArticles.map(a => a.title));
  return currentArticles.filter(a => !previousTitles.has(a.title));
}

/**
 * 检测所有网站
 */
export async function detectAllSites(configs: SiteConfig[]): Promise<{
  results: DetectionResult[];
  changes: ChangeRecord[];
}> {
  const enabledConfigs = configs.filter(c => c.enabled !== false);
  const results: DetectionResult[] = [];
  const changes: ChangeRecord[] = [];
  const statesToUpdate: SiteState[] = [];

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
        
        // 更新状态
        const state: SiteState = {
          id: config.id,
          contentHash,
          content: result.currentContent,
          lastChecked: now,
          lastChanged: result.changed ? now : undefined,
          articles: result.articles,
        };
        statesToUpdate.push(state);

        // 记录变更
        if (result.changed && result.previousContent !== undefined) {
          const newArticles = findNewArticles(
            result.articles || [],
            result.previousArticles
          );
          
          changes.push({
            siteId: config.id,
            siteName: config.name,
            siteUrl: config.url,
            changedAt: now,
            oldContent: result.previousContent,
            newContent: result.currentContent,
            description: config.description,
            newArticles: newArticles.length > 0 ? newArticles : undefined,
            oldArticles: result.previousArticles,
          });
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

  // 批量更新存储
  if (statesToUpdate.length > 0) {
    await batchUpdate(statesToUpdate, changes);
  }

  return { results, changes };
}
