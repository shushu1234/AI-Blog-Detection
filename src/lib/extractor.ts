/**
 * 内容提取模块 - 支持XPath和CSS选择器
 */
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import type { ArticleInfo, ExtractionResult, SiteConfig } from '../types/index.js';

/**
 * 使用XPath提取内容
 */
export function extractByXPath(html: string, xpath: string): string[] {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 使用document.evaluate进行XPath查询
    const result = document.evaluate(
      xpath,
      document,
      null,
      dom.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );

    const contents: string[] = [];
    let node = result.iterateNext();
    
    while (node) {
      // 检查是否是属性节点（如 @href）
      if (node.nodeType === dom.window.Node.ATTRIBUTE_NODE) {
        const attrValue = (node as Attr).value?.trim();
        if (attrValue) {
          contents.push(attrValue);
        }
      } else {
        const text = node.textContent?.trim();
        if (text) {
          contents.push(text);
        }
      }
      node = result.iterateNext();
    }

    return contents;
  } catch (error) {
    console.error('XPath提取失败:', error);
    return [];
  }
}

/**
 * 使用XPath提取属性值（如href）
 */
export function extractAttributesByXPath(html: string, xpath: string): string[] {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const result = document.evaluate(
      xpath,
      document,
      null,
      dom.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );

    const values: string[] = [];
    let node = result.iterateNext();
    
    while (node) {
      // 如果是属性节点
      if (node.nodeType === dom.window.Node.ATTRIBUTE_NODE) {
        const value = (node as Attr).value?.trim();
        if (value) {
          values.push(value);
        }
      } else if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        // 如果是元素节点，尝试获取href属性
        const href = (node as Element).getAttribute('href');
        if (href) {
          values.push(href.trim());
        }
      } else {
        // 文本节点
        const text = node.textContent?.trim();
        if (text) {
          values.push(text);
        }
      }
      node = result.iterateNext();
    }

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
