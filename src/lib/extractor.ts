/**
 * 内容提取模块 - 使用 Cheerio 进行 DOM 操作
 * 支持简化的 XPath 语法和 CSS 选择器
 */
import * as cheerio from 'cheerio';
import type { CheerioAPI, Cheerio, Element } from 'cheerio';
import type { ArticleInfo, ExtractionResult, SiteConfig } from '../types/index.js';

/**
 * 将简单的 XPath 转换为 CSS 选择器
 * 支持的 XPath 语法：
 * - //tag -> tag
 * - //tag[@attr='value'] -> tag[attr='value']
 * - //tag[@attr] -> tag[attr]
 * - //tag//subtag -> tag subtag
 * - //*[@id='value'] -> [id='value']
 */
function xpathToCssSelector(xpath: string): { selector: string; isAttr: boolean; attrName?: string } {
  // 检查是否是属性选择器（如 @href）
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
 * 转换 XPath 路径部分为 CSS 选择器
 */
function convertXPathPart(xpath: string): string {
  let css = xpath
    // 移除开头的 //
    .replace(/^\/\//, '')
    // 处理 //* 
    .replace(/^\*/, '*')
    // 处理 // 为后代选择器
    .replace(/\/\//g, ' ')
    // 处理 / 为子选择器
    .replace(/\//g, ' > ')
    // 处理 [@attr='value']
    .replace(/\[@(\w+)='([^']+)'\]/g, '[$1="$2"]')
    .replace(/\[@(\w+)="([^"]+)"\]/g, '[$1="$2"]')
    // 处理 [@attr]
    .replace(/\[@(\w+)\]/g, '[$1]')
    // 处理谓词 [tag] -> :has(tag)
    .replace(/\[(\w+)\]/g, ':has($1)')
    // 处理 text()
    .replace(/\/text\(\)$/, '');
  
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
