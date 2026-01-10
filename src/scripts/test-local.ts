/**
 * 本地测试脚本 - 测试网页抓取和内容提取功能
 * 运行: npx ts-node --esm src/scripts/test-local.ts
 */
import { fetchPage } from '../lib/fetcher.js';
import { extractContent, extractByXPath, hashContent } from '../lib/extractor.js';
import sitesConfig from '../config/sites.json' with { type: 'json' };
import type { SiteConfig } from '../types/index.js';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(color: keyof typeof COLORS, message: string) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testSite(config: SiteConfig) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `🔍 测试: ${config.name}`);
  log('dim', `   URL: ${config.url}`);
  log('dim', `   XPath: ${config.xpath}`);
  console.log('='.repeat(60));

  try {
    // 1. 抓取页面
    log('yellow', '\n📡 正在抓取页面...');
    const startTime = Date.now();
    const html = await fetchPage(config.url);
    const fetchTime = Date.now() - startTime;
    log('green', `✓ 页面抓取成功 (${fetchTime}ms, ${(html.length / 1024).toFixed(1)}KB)`);

    // 2. 提取内容
    log('yellow', '\n🎯 正在提取内容...');
    const content = extractContent(html, config.xpath, config.cssSelector);
    
    if (!content) {
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
        const testContent = extractContent(html, xpath);
        if (testContent) {
          log('dim', `   ${xpath} → 找到内容`);
        }
      }
      return;
    }

    // 3. 显示提取结果
    const lines = content.split('\n').filter(l => l.trim());
    log('green', `✓ 成功提取到 ${lines.length} 项内容:\n`);
    
    lines.slice(0, 10).forEach((line, i) => {
      const truncated = line.length > 80 ? line.substring(0, 80) + '...' : line;
      console.log(`   ${i + 1}. ${truncated}`);
    });
    
    if (lines.length > 10) {
      log('dim', `   ... 还有 ${lines.length - 10} 项`);
    }

    // 4. 计算哈希
    const hash = await hashContent(content);
    log('dim', `\n   内容哈希: ${hash.substring(0, 16)}...`);

  } catch (error) {
    log('red', `\n✗ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

async function main() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════╗');
  log('cyan', '║           WebDetect 本地测试工具                           ║');
  log('cyan', '╚════════════════════════════════════════════════════════════╝');

  const configs = sitesConfig as SiteConfig[];
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

