/**
 * 网站配置
 */
export interface SiteConfig {
  /** 唯一标识符 */
  id: string;
  /** 网站名称 */
  name: string;
  /** 要检测的URL */
  url: string;
  /** XPath表达式，用于提取要监控的内容（文章标题） */
  xpath?: string;
  /** 可选：文章URL的XPath表达式 */
  articleUrlXPath?: string;
  /** CSS选择器（推荐使用，比XPath更可靠） */
  cssSelector?: string;
  /** 可选：自定义描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 文章信息（提取结果）
 */
export interface ArticleInfo {
  /** 文章标题 */
  title: string;
  /** 文章URL */
  url?: string;
}

/**
 * 数据库中的文章记录
 */
export interface ArticleRecord {
  /** 数据库ID */
  id?: number;
  /** 网站ID */
  siteId: string;
  /** 网站名称 */
  siteName: string;
  /** 文章标题 */
  title: string;
  /** 文章URL */
  url: string;
  /** 发现时间 */
  discoveredAt: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 存储的网站状态
 */
export interface SiteState {
  /** 网站ID */
  id: string;
  /** 上次检测的内容哈希 */
  contentHash: string;
  /** 上次检测的原始内容 */
  content: string;
  /** 上次检测时间 */
  lastChecked: string;
  /** 上次变更时间 */
  lastChanged?: string;
  /** 已知的文章URL列表（用于去重） */
  knownArticleUrls?: string[];
}

/**
 * 检测结果
 */
export interface DetectionResult {
  /** 网站ID */
  siteId: string;
  /** 是否发生变更 */
  changed: boolean;
  /** 当前内容 */
  currentContent: string;
  /** 之前内容 */
  previousContent?: string;
  /** 错误信息 */
  error?: string;
  /** 当前文章列表 */
  articles?: ArticleInfo[];
  /** 新发现的文章 */
  newArticles?: ArticleInfo[];
}

/**
 * 提取结果
 */
export interface ExtractionResult {
  /** 提取的内容（标题列表拼接） */
  content: string;
  /** 文章列表（包含标题和URL） */
  articles: ArticleInfo[];
}

// 保留旧的类型用于兼容
export interface ChangeRecord {
  siteId: string;
  siteName: string;
  siteUrl: string;
  changedAt: string;
  oldContent: string;
  newContent: string;
  description?: string;
  newArticles?: ArticleInfo[];
  oldArticles?: ArticleInfo[];
}

export interface StorageData {
  sites: Record<string, SiteState>;
  changes: ChangeRecord[];
  lastUpdated: string;
}
