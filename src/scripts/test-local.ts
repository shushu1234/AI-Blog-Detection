/**
 * 本地测试脚本 - 测试网页抓取和内容提取功能
 * 运行: npx ts-node --esm src/scripts/test-local.ts
 */
import { fetchPage } from '../lib/fetcher.js';
import { extractArticles, hashContent } from '../lib/extractor.js';
import { sitesConfig } from '../config/sites.js';
import type { SiteConfig, ArticleInfo } from '../types/index.js';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
};

function log(color: keyof typeof COLORS, message: string) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function formatArticle(article: ArticleInfo, index: number): string {
  const title = article.title.length > 60 
    ? article.title.substring(0, 60) + '...' 
    : article.title;
  
  if (article.url) {
    return `   ${index + 1}. ${title}\n      🔗 ${article.url}`;
  }
  return `   ${index + 1}. ${title}`;
}

async function testSite(config: SiteConfig) {
  console.log('\n' + '='.repeat(70));
  log('cyan', `🔍 测试: ${config.name}`);
  log('dim', `   URL: ${config.url}`);
  log('dim', `   XPath (标题): ${config.xpath}`);
  if (config.articleUrlXPath) {
    log('dim', `   XPath (链接): ${config.articleUrlXPath}`);
  }
  console.log('='.repeat(70));

  try {
    // 1. 抓取页面
    log('yellow', '\n📡 正在抓取页面...');
    const startTime = Date.now();
    const html = await fetchPage(config.url);
    const fetchTime = Date.now() - startTime;
    log('green', `✓ 页面抓取成功 (${fetchTime}ms, ${(html.length / 1024).toFixed(1)}KB)`);

    // 2. 提取文章内容
    log('yellow', '\n🎯 正在提取内容...');
    const extraction = extractArticles(html, config);
    
    if (!extraction.content) {
      log('red', '✗ 未能提取到任何内容，请检查 XPath 表达式');
      
      // 尝试一些常见的 XPath 来帮助调试
      log('yellow', '\n🔧 尝试其他常见选择器...');
      const testXPaths = [
        '//h1',
        '//h2',
        '//article//h2',
        '//main//h2',
        '//title',
      ];
      
      for (const xpath of testXPaths) {
        const testExtraction = extractArticles(html, { ...config, xpath, articleUrlXPath: undefined });
        if (testExtraction.content) {
          log('dim', `   ${xpath} → 找到内容`);
        }
      }
      return;
    }

    // 3. 显示提取结果
    const articles = extraction.articles;
    log('green', `✓ 成功提取到 ${articles.length} 篇文章:\n`);
    
    // 显示前10篇文章
    const displayCount = Math.min(10, articles.length);
    for (let i = 0; i < displayCount; i++) {
      console.log(formatArticle(articles[i], i));
    }
    
    if (articles.length > 10) {
      log('dim', `\n   ... 还有 ${articles.length - 10} 篇文章`);
    }

    // 4. 统计URL提取情况
    const articlesWithUrl = articles.filter(a => a.url);
    if (config.articleUrlXPath) {
      if (articlesWithUrl.length > 0) {
        log('blue', `\n📊 链接提取: ${articlesWithUrl.length}/${articles.length} 篇文章有URL`);
      } else {
        log('yellow', '\n⚠️  未能提取到文章链接，请检查 articleUrlXPath 配置');
      }
    }

    // 5. 计算哈希
    const hash = await hashContent(extraction.content);
    log('dim', `\n   内容哈希: ${hash.substring(0, 16)}...`);

  } catch (error) {
    log('red', `\n✗ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

async function main() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════════════╗');
  log('cyan', '║             AI-Blog-Detection 本地测试工具                         ║');
  log('cyan', '╚════════════════════════════════════════════════════════════════════╝');

  const configs = sitesConfig;
  const enabledConfigs = configs.filter(c => c.enabled !== false);

  log('dim', `\n共 ${configs.length} 个配置，${enabledConfigs.length} 个已启用\n`);

  // 获取命令行参数，可以指定测试特定网站
  const targetId = process.argv[2];
  
  if (targetId) {
    const config = configs.find(c => c.id === targetId);
    if (config) {
      await testSite(config);
    } else {
      log('red', `未找到 ID 为 "${targetId}" 的配置`);
      log('dim', `可用的 ID: ${configs.map(c => c.id).join(', ')}`);
    }
  } else {
    // 测试所有启用的网站
    for (const config of enabledConfigs) {
      await testSite(config);
    }
  }

  console.log('\n');
  log('green', '✓ 测试完成\n');
}

main().catch(console.error);
