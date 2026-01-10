/**
 * 内容提取模块 - 使用 Cheerio 进行 DOM 操作
 * 支持简化的 XPath 语法和 CSS 选择器
 */
import * as cheerio from 'cheerio';
import type { ArticleInfo, ExtractionResult, SiteConfig } from '../types/index.js';

/**
 * 将 XPath 转换为 CSS 选择器
 * 支持的语法:
 * - //tag -> tag
 * - //tag[@attr='value'] -> tag[attr="value"]
 * - //tag[contains(@attr, 'value')] -> tag[attr*="value"]
 * - //tag[@attr] -> tag[attr]
 * - //tag//subtag -> tag subtag
 * - //a | //b -> a, b (或运算)
 * - //*[@id='value'] -> [id="value"]
 * - /@attr -> 提取属性
 */
function xpathToCssSelector(xpath: string): { selector: string; isAttr: boolean; attrName?: string } {
  // 处理多个选择器（XPath 的 | 运算符）
  if (xpath.includes(' | ')) {
    const parts = xpath.split(' | ').map(p => p.trim());
    const results = parts.map(p => xpathToCssSelector(p));
    
    // 如果任一部分是属性选择器，整体都当作属性选择器
    const isAttr = results.some(r => r.isAttr);
    const attrName = results.find(r => r.attrName)?.attrName;
    const selector = results.map(r => r.selector).join(', ');
    
    return { selector, isAttr, attrName };
  }
  
  // 检查是否是属性选择器（如 /@href）
  const attrMatch = xpath.match(/\/@(\w+)$/);
  if (attrMatch) {
    const attrName = attrMatch[1];
    const basePath = xpath.replace(/\/@\w+$/, '');
    const baseSelector = convertXPathPart(basePath);
    return { selector: baseSelector, isAttr: true, attrName };
  }
  
  return { selector: convertXPathPart(xpath), isAttr: false };
}

/**
 * 转换单个 XPath 路径部分为 CSS 选择器
 */
function convertXPathPart(xpath: string): string {
  let css = xpath;
  
  // 移除开头的 //
  css = css.replace(/^\/\//, '');
  
  // 处理 //* 
  css = css.replace(/^\*/, '*');
  
  // 先用占位符保护属性值中的特殊字符
  const attrValues: string[] = [];
  css = css.replace(/\[contains\(\s*@(\w+)\s*,\s*['"]([^'"]+)['"]\s*\)\]/g, (_, attr, value) => {
    attrValues.push(value);
    return `[${attr}*="__ATTR_${attrValues.length - 1}__"]`;
  });
  css = css.replace(/\[\s*@(\w+)\s*=\s*['"]([^'"]+)['"]\s*\]/g, (_, attr, value) => {
    attrValues.push(value);
    return `[${attr}="__ATTR_${attrValues.length - 1}__"]`;
  });
  
  // 处理复合条件 [contains(@a, 'v') and contains(@b, 'w')]
  // 已经在上面处理了，跳过
  
  // 处理 // 为后代选择器
  css = css.replace(/\/\//g, ' ');
  
  // 处理 / 为子选择器（但不影响属性值）
  css = css.replace(/\//g, ' > ');
  
  // 处理 [@attr]
  css = css.replace(/\[\s*@(\w+)\s*\]/g, '[$1]');
  
  // 处理谓词 [tag] -> :has(tag)
  css = css.replace(/\[([a-z][a-z0-9]*)\]/gi, ':has($1)');
  
  // 处理 text()
  css = css.replace(/ > text\(\)$/, '');
  
  // 恢复属性值
  attrValues.forEach((value, index) => {
    css = css.replace(`__ATTR_${index}__`, value);
  });
  
  return css.trim();
}

/**
 * 使用 Cheerio 提取内容
 */
export function extractByXPath(html: string, xpath: string): string[] {
  try {
    const $ = cheerio.load(html);
    const { selector, isAttr, attrName } = xpathToCssSelector(xpath);
    
    const contents: string[] = [];
    
    $(selector).each((_, element) => {
      if (isAttr && attrName) {
        const value = $(element).attr(attrName);
        if (value?.trim()) {
          contents.push(value.trim());
        }
      } else {
        const text = $(element).text().trim();
        if (text) {
          contents.push(text);
        }
      }
    });
    
    return contents;
  } catch (error) {
    console.error('XPath提取失败:', error);
    return [];
  }
}

/**
 * 使用 Cheerio 提取属性值
 */
export function extractAttributesByXPath(html: string, xpath: string): string[] {
  try {
    const $ = cheerio.load(html);
    const { selector, isAttr, attrName } = xpathToCssSelector(xpath);
    
    // Debug: 打印转换后的选择器
    // console.log(`XPath: ${xpath} -> CSS: ${selector}, isAttr: ${isAttr}, attrName: ${attrName}`);
    
    const values: string[] = [];
    
    $(selector).each((_, element) => {
      if (isAttr && attrName) {
        const value = $(element).attr(attrName);
        if (value?.trim()) {
          values.push(value.trim());
        }
      } else {
        // 尝试获取 href 属性
        const href = $(element).attr('href');
        if (href?.trim()) {
          values.push(href.trim());
        }
      }
    });
    
    return values;
  } catch (error) {
    // 如果转换后的选择器失败，尝试直接作为 CSS 选择器并提取 href
    try {
      const $ = cheerio.load(html);
      // 尝试从 XPath 中提取基本的选择器模式
      const simpleSelector = xpath
        .replace(/^\/\//, '')
        .replace(/\/\//g, ' ')
        .replace(/\/@\w+$/, '')
        .replace(/\[contains\(\s*@(\w+)\s*,\s*['"]([^'"]+)['"]\s*\)\]/g, '[$1*="$2"]');
      
      const values: string[] = [];
      $(simpleSelector).each((_, element) => {
        const href = $(element).attr('href');
        if (href?.trim()) {
          values.push(href.trim());
        }
      });
      if (values.length > 0) return values;
    } catch {
      // 忽略
    }
    
    console.error('XPath属性提取失败:', error);
    return [];
  }
}

/**
 * 使用CSS选择器提取内容
 */
export function extractByCssSelector(html: string, selector: string): string[] {
  try {
    const $ = cheerio.load(html);
    const contents: string[] = [];

    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        contents.push(text);
      }
    });

    return contents;
  } catch (error) {
    console.error('CSS选择器提取失败:', error);
    return [];
  }
}

/**
 * 通用提取函数
 */
export function extractContent(
  html: string,
  xpath?: string,
  cssSelector?: string
): string {
  let contents: string[] = [];

  if (xpath) {
    contents = extractByXPath(html, xpath);
  } else if (cssSelector) {
    contents = extractByCssSelector(html, cssSelector);
  }

  // 合并所有提取的内容
  return contents.join('\n').trim();
}

/**
 * 规范化URL（处理相对路径）
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  // 已经是绝对URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    
    // 协议相对URL
    if (url.startsWith('//')) {
      return `${base.protocol}${url}`;
    }
    
    // 绝对路径
    if (url.startsWith('/')) {
      return `${base.origin}${url}`;
    }
    
    // 相对路径
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * 提取文章信息（标题和URL）
 */
export function extractArticles(
  html: string,
  config: SiteConfig
): ExtractionResult {
  const titles: string[] = [];
  const urls: string[] = [];
  
  // 提取标题
  if (config.xpath) {
    const extracted = extractByXPath(html, config.xpath);
    titles.push(...extracted);
  } else if (config.cssSelector) {
    const extracted = extractByCssSelector(html, config.cssSelector);
    titles.push(...extracted);
  }
  
  // 提取文章URL
  if (config.articleUrlXPath) {
    const extractedUrls = extractAttributesByXPath(html, config.articleUrlXPath);
    urls.push(...extractedUrls.map(url => normalizeUrl(url, config.url)));
  }
  
  // 组合成文章列表
  const articles: ArticleInfo[] = titles.map((title, index) => ({
    title: title.trim(),
    url: urls[index] ? urls[index] : undefined,
  }));
  
  // 生成内容字符串（用于哈希比较）
  const content = titles.join('\n').trim();
  
  return {
    content,
    articles,
  };
}

/**
 * 计算内容的哈希值（用于比较变更）
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
