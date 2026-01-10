/**
 * 状态存储模块 - 使用Vercel KV
 */
import { kv } from '@vercel/kv';
import type { StorageData, SiteState, ChangeRecord } from '../types/index.js';

const STORAGE_KEY = 'ai-blog-detection:state';
const CHANGES_KEY = 'ai-blog-detection:changes';
const MAX_CHANGES = 100; // 最多保留100条变更记录

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
  try {
    const data = await kv.get<StorageData>(STORAGE_KEY);
    return data || getDefaultStorageData();
  } catch (error) {
    console.error('获取存储数据失败:', error);
    return getDefaultStorageData();
  }
}

/**
 * 保存存储数据
 */
export async function saveStorageData(data: StorageData): Promise<void> {
  try {
    data.lastUpdated = new Date().toISOString();
    await kv.set(STORAGE_KEY, data);
  } catch (error) {
    console.error('保存存储数据失败:', error);
    throw error;
  }
}

/**
 * 获取网站状态
 */
export async function getSiteState(siteId: string): Promise<SiteState | null> {
  const data = await getStorageData();
  return data.sites[siteId] || null;
}

/**
 * 更新网站状态
 */
export async function updateSiteState(state: SiteState): Promise<void> {
  const data = await getStorageData();
  data.sites[state.id] = state;
  await saveStorageData(data);
}

/**
 * 添加变更记录
 */
export async function addChangeRecord(record: ChangeRecord): Promise<void> {
  const data = await getStorageData();
  
  // 添加到开头
  data.changes.unshift(record);
  
  // 限制记录数量
  if (data.changes.length > MAX_CHANGES) {
    data.changes = data.changes.slice(0, MAX_CHANGES);
  }
  
  await saveStorageData(data);
}

/**
 * 获取变更记录
 */
export async function getChangeRecords(limit?: number): Promise<ChangeRecord[]> {
  const data = await getStorageData();
  if (limit) {
    return data.changes.slice(0, limit);
  }
  return data.changes;
}

/**
 * 批量更新状态和添加变更
 */
export async function batchUpdate(
  states: SiteState[],
  changes: ChangeRecord[]
): Promise<void> {
  const data = await getStorageData();
  
  // 更新状态
  for (const state of states) {
    data.sites[state.id] = state;
  }
  
  // 添加变更记录
  data.changes = [...changes, ...data.changes].slice(0, MAX_CHANGES);
  
  await saveStorageData(data);
}

