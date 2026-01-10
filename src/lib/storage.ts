/**
 * 状态存储模块 - 使用 Supabase PostgreSQL
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StorageData, SiteState, ChangeRecord } from '../types/index.js';

const MAX_CHANGES = 100;

// Supabase 客户端（懒加载）
let supabaseClient: SupabaseClient | null = null;

// 内存缓存（作为后备）
let memoryStorage: StorageData | null = null;

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
 * 获取默认存储数据
 */
function getDefaultStorageData(): StorageData {
  return {
    sites: {},
    changes: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 获取存储数据
 */
export async function getStorageData(): Promise<StorageData> {
  const supabase = getSupabase();
  
  if (!supabase) {
    console.log('Supabase 未配置，使用内存存储');
    return memoryStorage || getDefaultStorageData();
  }
  
  try {
    // 获取所有站点状态
    const { data: siteStates, error: siteError } = await supabase
      .from('site_states')
      .select('*');
    
    // 获取变更记录
    const { data: changes, error: changeError } = await supabase
      .from('change_records')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(MAX_CHANGES);
    
    if (siteError || changeError) {
      console.error('获取数据失败:', siteError || changeError);
      return memoryStorage || getDefaultStorageData();
    }
    
    // 转换为 StorageData 格式
    const sites: Record<string, SiteState> = {};
    for (const state of siteStates || []) {
      sites[state.id] = {
        id: state.id,
        contentHash: state.content_hash,
        content: state.content,
        lastChecked: state.last_checked,
        lastChanged: state.last_changed,
        articles: state.articles,
      };
    }
    
    const changeRecords: ChangeRecord[] = (changes || []).map(c => ({
      siteId: c.site_id,
      siteName: c.site_name,
      siteUrl: c.site_url,
      changedAt: c.changed_at,
      oldContent: c.old_content || '',
      newContent: c.new_content,
      description: c.description,
      newArticles: c.new_articles,
      oldArticles: c.old_articles,
    }));
    
    const data: StorageData = {
      sites,
      changes: changeRecords,
      lastUpdated: new Date().toISOString(),
    };
    
    memoryStorage = data;
    return data;
  } catch (error) {
    console.error('获取存储数据失败:', error);
    return memoryStorage || getDefaultStorageData();
  }
}

/**
 * 保存存储数据
 */
export async function saveStorageData(data: StorageData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  memoryStorage = data;
  
  // Supabase 保存由其他函数单独处理
}

/**
 * 获取网站状态
 */
export async function getSiteState(siteId: string): Promise<SiteState | null> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const data = memoryStorage || getDefaultStorageData();
    return data.sites[siteId] || null;
  }
  
  try {
    const { data, error } = await supabase
      .from('site_states')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      contentHash: data.content_hash,
      content: data.content,
      lastChecked: data.last_checked,
      lastChanged: data.last_changed,
      articles: data.articles,
    };
  } catch (error) {
    console.error('获取站点状态失败:', error);
    return null;
  }
}

/**
 * 更新网站状态
 */
export async function updateSiteState(state: SiteState): Promise<void> {
  const supabase = getSupabase();
  
  // 更新内存缓存
  if (!memoryStorage) {
    memoryStorage = getDefaultStorageData();
  }
  memoryStorage.sites[state.id] = state;
  
  if (!supabase) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('site_states')
      .upsert({
        id: state.id,
        content_hash: state.contentHash,
        content: state.content,
        last_checked: state.lastChecked,
        last_changed: state.lastChanged,
        articles: state.articles,
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
 * 添加变更记录
 */
export async function addChangeRecord(record: ChangeRecord): Promise<void> {
  const supabase = getSupabase();
  
  // 更新内存缓存
  if (!memoryStorage) {
    memoryStorage = getDefaultStorageData();
  }
  memoryStorage.changes.unshift(record);
  if (memoryStorage.changes.length > MAX_CHANGES) {
    memoryStorage.changes = memoryStorage.changes.slice(0, MAX_CHANGES);
  }
  
  if (!supabase) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('change_records')
      .insert({
        site_id: record.siteId,
        site_name: record.siteName,
        site_url: record.siteUrl,
        changed_at: record.changedAt,
        old_content: record.oldContent,
        new_content: record.newContent,
        description: record.description,
        new_articles: record.newArticles,
        old_articles: record.oldArticles,
      });
    
    if (error) {
      console.error('添加变更记录失败:', error);
    }
  } catch (error) {
    console.error('添加变更记录失败:', error);
  }
}

/**
 * 获取变更记录
 */
export async function getChangeRecords(limit?: number): Promise<ChangeRecord[]> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const data = memoryStorage || getDefaultStorageData();
    return limit ? data.changes.slice(0, limit) : data.changes;
  }
  
  try {
    const { data, error } = await supabase
      .from('change_records')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit || MAX_CHANGES);
    
    if (error || !data) {
      const memData = memoryStorage || getDefaultStorageData();
      return limit ? memData.changes.slice(0, limit) : memData.changes;
    }
    
    return data.map(c => ({
      siteId: c.site_id,
      siteName: c.site_name,
      siteUrl: c.site_url,
      changedAt: c.changed_at,
      oldContent: c.old_content || '',
      newContent: c.new_content,
      description: c.description,
      newArticles: c.new_articles,
      oldArticles: c.old_articles,
    }));
  } catch (error) {
    console.error('获取变更记录失败:', error);
    const data = memoryStorage || getDefaultStorageData();
    return limit ? data.changes.slice(0, limit) : data.changes;
  }
}

/**
 * 批量更新状态和添加变更
 */
export async function batchUpdate(
  states: SiteState[],
  changes: ChangeRecord[]
): Promise<void> {
  // 更新内存缓存
  if (!memoryStorage) {
    memoryStorage = getDefaultStorageData();
  }
  
  for (const state of states) {
    memoryStorage.sites[state.id] = state;
  }
  
  memoryStorage.changes = [...changes, ...memoryStorage.changes].slice(0, MAX_CHANGES);
  memoryStorage.lastUpdated = new Date().toISOString();
  
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }
  
  try {
    // 批量更新站点状态
    if (states.length > 0) {
      const { error: stateError } = await supabase
        .from('site_states')
        .upsert(states.map(s => ({
          id: s.id,
          content_hash: s.contentHash,
          content: s.content,
          last_checked: s.lastChecked,
          last_changed: s.lastChanged,
          articles: s.articles,
          updated_at: new Date().toISOString(),
        })));
      
      if (stateError) {
        console.error('批量更新站点状态失败:', stateError);
      }
    }
    
    // 批量插入变更记录
    if (changes.length > 0) {
      const { error: changeError } = await supabase
        .from('change_records')
        .insert(changes.map(c => ({
          site_id: c.siteId,
          site_name: c.siteName,
          site_url: c.siteUrl,
          changed_at: c.changedAt,
          old_content: c.oldContent,
          new_content: c.newContent,
          description: c.description,
          new_articles: c.newArticles,
          old_articles: c.oldArticles,
        })));
      
      if (changeError) {
        console.error('批量插入变更记录失败:', changeError);
      }
    }
  } catch (error) {
    console.error('批量更新失败:', error);
  }
}

/**
 * 检查存储是否可用
 */
export function isStorageAvailable(): boolean {
  return !!getSupabase();
}
