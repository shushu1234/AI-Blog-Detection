/**
 * 状态存储模块 - 使用 Vercel Edge Config
 * 
 * 需要配置的环境变量：
 * - EDGE_CONFIG: Edge Config 连接字符串（Vercel 自动设置）
 * - EDGE_CONFIG_ID: Edge Config 的 ID
 * - VERCEL_API_TOKEN: Vercel API Token（用于写入）
 */
import { get } from '@vercel/edge-config';
import type { StorageData, SiteState, ChangeRecord } from '../types/index.js';

const STORAGE_KEY = 'ai_blog_detection_state';
const MAX_CHANGES = 100;

// 内存缓存
let memoryStorage: StorageData | null = null;

/**
 * 检查 Edge Config 是否可用
 */
function isEdgeConfigAvailable(): boolean {
  return !!process.env.EDGE_CONFIG;
}

/**
 * 检查写入功能是否可用
 */
function isWriteAvailable(): boolean {
  return !!(process.env.EDGE_CONFIG_ID && process.env.VERCEL_API_TOKEN);
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
 * 通过 REST API 写入 Edge Config
 */
async function writeToEdgeConfig(key: string, value: unknown): Promise<boolean> {
  if (!isWriteAvailable()) {
    console.log('Edge Config 写入未配置，跳过保存');
    return false;
  }

  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const apiToken = process.env.VERCEL_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: key,
              value: value,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Edge Config 写入失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Edge Config 写入错误:', error);
    return false;
  }
}

/**
 * 获取存储数据
 */
export async function getStorageData(): Promise<StorageData> {
  // 如果 Edge Config 不可用，使用内存存储
  if (!isEdgeConfigAvailable()) {
    console.log('Edge Config 未配置，使用内存存储');
    return memoryStorage || getDefaultStorageData();
  }

  try {
    const data = await get<StorageData>(STORAGE_KEY);
    if (data) {
      memoryStorage = data; // 同步到内存缓存
      return data;
    }
    return memoryStorage || getDefaultStorageData();
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
  
  // 总是更新内存缓存
  memoryStorage = data;

  // 尝试写入 Edge Config
  await writeToEdgeConfig(STORAGE_KEY, data);
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

/**
 * 检查存储是否可用
 */
export function isStorageAvailable(): boolean {
  return isEdgeConfigAvailable();
}

/**
 * 检查写入是否可用
 */
export function isStorageWriteAvailable(): boolean {
  return isWriteAvailable();
}
