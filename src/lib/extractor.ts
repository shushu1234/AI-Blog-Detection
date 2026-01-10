/**
 * 内容提取模块 - 支持XPath和CSS选择器
 */
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

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
      const text = node.textContent?.trim();
      if (text) {
        contents.push(text);
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
 * 计算内容的哈希值（用于比较变更）
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
