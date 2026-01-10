/**
 * 状态存储模块 - 使用 Supabase PostgreSQL
 * 每篇文章独立存储一条记录
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SiteState, ArticleRecord, ArticleInfo } from '../types/index.js';

const MAX_ARTICLES = 500;

// Supabase 客户端（懒加载）
let supabaseClient: SupabaseClient | null = null;

// 内存缓存
let memorySiteStates: Record<string, SiteState> = {};
let memoryArticles: ArticleRecord[] = [];

/**
 * 获取 Supabase 客户端
 */
function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.log('Supabase 未配置');
    return null;
  }
  
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

/**
 * 获取网站状态
 */
export async function getSiteState(siteId: string): Promise<SiteState | null> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return memorySiteStates[siteId] || null;
  }
  
  try {
    const { data, error } = await supabase
      .from('site_states')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error || !data) {
      return memorySiteStates[siteId] || null;
    }
    
    return {
      id: data.id,
      contentHash: data.content_hash,
      content: data.content,
      lastChecked: data.last_checked,
      lastChanged: data.last_changed,
      knownArticleUrls: data.known_article_urls,
    };
  } catch (error) {
    console.error('获取站点状态失败:', error);
    return memorySiteStates[siteId] || null;
  }
}

/**
 * 更新网站状态
 */
export async function updateSiteState(state: SiteState): Promise<void> {
  memorySiteStates[state.id] = state;
  
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('site_states')
      .upsert({
        id: state.id,
        content_hash: state.contentHash,
        content: state.content,
        last_checked: state.lastChecked,
        last_changed: state.lastChanged,
        known_article_urls: state.knownArticleUrls,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('更新站点状态失败:', error);
    }
  } catch (error) {
    console.error('更新站点状态失败:', error);
  }
}

/**
 * 添加单篇文章记录
 */
export async function addArticle(article: ArticleRecord): Promise<void> {
  memoryArticles.unshift(article);
  if (memoryArticles.length > MAX_ARTICLES) {
    memoryArticles = memoryArticles.slice(0, MAX_ARTICLES);
  }
  
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('articles')
      .insert({
        site_id: article.siteId,
        site_name: article.siteName,
        title: article.title,
        url: article.url,
        discovered_at: article.discoveredAt,
      });
    
    if (error) {
      console.error('添加文章记录失败:', error);
    }
  } catch (error) {
    console.error('添加文章记录失败:', error);
  }
}

/**
 * 批量添加文章记录
 */
export async function addArticles(articles: ArticleRecord[]): Promise<void> {
  if (articles.length === 0) return;
  
  memoryArticles = [...articles, ...memoryArticles].slice(0, MAX_ARTICLES);
  
  const supabase = getSupabase();
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('articles')
      .insert(articles.map(a => ({
        site_id: a.siteId,
        site_name: a.siteName,
        title: a.title,
        url: a.url,
        discovered_at: a.discoveredAt,
      })));
    
    if (error) {
      console.error('批量添加文章记录失败:', error);
    }
  } catch (error) {
    console.error('批量添加文章记录失败:', error);
  }
}

/**
 * 获取所有文章记录（用于生成RSS）
 */
export async function getArticles(limit?: number): Promise<ArticleRecord[]> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return limit ? memoryArticles.slice(0, limit) : memoryArticles;
  }
  
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('discovered_at', { ascending: false })
      .limit(limit || MAX_ARTICLES);
    
    if (error || !data) {
      return limit ? memoryArticles.slice(0, limit) : memoryArticles;
    }
    
    return data.map(a => ({
      id: a.id,
      siteId: a.site_id,
      siteName: a.site_name,
      title: a.title,
      url: a.url,
      discoveredAt: a.discovered_at,
      createdAt: a.created_at,
    }));
  } catch (error) {
    console.error('获取文章记录失败:', error);
    return limit ? memoryArticles.slice(0, limit) : memoryArticles;
  }
}

/**
 * 获取指定网站的文章记录
 */
export async function getArticlesBySite(siteId: string, limit?: number): Promise<ArticleRecord[]> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const filtered = memoryArticles.filter(a => a.siteId === siteId);
    return limit ? filtered.slice(0, limit) : filtered;
  }
  
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('site_id', siteId)
      .order('discovered_at', { ascending: false })
      .limit(limit || 100);
    
    if (error || !data) {
      const filtered = memoryArticles.filter(a => a.siteId === siteId);
      return limit ? filtered.slice(0, limit) : filtered;
    }
    
    return data.map(a => ({
      id: a.id,
      siteId: a.site_id,
      siteName: a.site_name,
      title: a.title,
      url: a.url,
      discoveredAt: a.discovered_at,
      createdAt: a.created_at,
    }));
  } catch (error) {
    console.error('获取文章记录失败:', error);
    const filtered = memoryArticles.filter(a => a.siteId === siteId);
    return limit ? filtered.slice(0, limit) : filtered;
  }
}

/**
 * 检查文章是否已存在（通过URL去重）
 */
export async function isArticleExists(url: string): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return memoryArticles.some(a => a.url === url);
  }
  
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .eq('url', url)
      .limit(1);
    
    if (error) {
      return memoryArticles.some(a => a.url === url);
    }
    
    return data && data.length > 0;
  } catch (error) {
    return memoryArticles.some(a => a.url === url);
  }
}

/**
 * 批量检查文章是否存在
 */
export async function filterNewArticles(articles: ArticleInfo[], siteId: string, siteName: string): Promise<ArticleRecord[]> {
  const now = new Date().toISOString();
  const newArticles: ArticleRecord[] = [];
  
  const supabase = getSupabase();
  
  if (!supabase) {
    // 内存模式：检查 URL 是否已存在
    const existingUrls = new Set(memoryArticles.map(a => a.url));
    for (const article of articles) {
      const url = article.url || '';
      if (url && !existingUrls.has(url)) {
        newArticles.push({
          siteId,
          siteName,
          title: article.title,
          url,
          discoveredAt: now,
        });
        existingUrls.add(url);
      }
    }
    return newArticles;
  }
  
  // Supabase 模式：批量查询已存在的 URL
  const urls = articles.filter(a => a.url).map(a => a.url as string);
  if (urls.length === 0) return [];
  
  try {
    const { data: existingData, error } = await supabase
      .from('articles')
      .select('url')
      .in('url', urls);
    
    if (error) {
      console.error('查询已存在文章失败:', error);
      return [];
    }
    
    const existingUrls = new Set((existingData || []).map(d => d.url));
    
    for (const article of articles) {
      const url = article.url || '';
      if (url && !existingUrls.has(url)) {
        newArticles.push({
          siteId,
          siteName,
          title: article.title,
          url,
          discoveredAt: now,
        });
      }
    }
    
    return newArticles;
  } catch (error) {
    console.error('过滤新文章失败:', error);
    return [];
  }
}

/**
 * 获取所有站点状态
 */
export async function getAllSiteStates(): Promise<Record<string, SiteState>> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return memorySiteStates;
  }
  
  try {
    const { data, error } = await supabase
      .from('site_states')
      .select('*');
    
    if (error || !data) {
      return memorySiteStates;
    }
    
    const states: Record<string, SiteState> = {};
    for (const s of data) {
      states[s.id] = {
        id: s.id,
        contentHash: s.content_hash,
        content: s.content,
        lastChecked: s.last_checked,
        lastChanged: s.last_changed,
        knownArticleUrls: s.known_article_urls,
      };
    }
    return states;
  } catch (error) {
    console.error('获取所有站点状态失败:', error);
    return memorySiteStates;
  }
}

/**
 * 检查存储是否可用
 */
export function isStorageAvailable(): boolean {
  return !!getSupabase();
}
