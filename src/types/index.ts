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
  xpath: string;
  /** 可选：文章URL的XPath表达式 */
  articleUrlXPath?: string;
  /** 可选：CSS选择器（如果不使用XPath） */
  cssSelector?: string;
  /** 可选：自定义描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 文章信息
 */
export interface ArticleInfo {
  /** 文章标题 */
  title: string;
  /** 文章URL */
  url?: string;
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
  /** 文章列表 */
  articles?: ArticleInfo[];
}

/**
 * 变更记录
 */
export interface ChangeRecord {
  /** 网站ID */
  siteId: string;
  /** 网站名称 */
  siteName: string;
  /** 网站URL */
  siteUrl: string;
  /** 变更时间 */
  changedAt: string;
  /** 旧内容 */
  oldContent: string;
  /** 新内容 */
  newContent: string;
  /** 变更描述 */
  description?: string;
  /** 新增的文章列表 */
  newArticles?: ArticleInfo[];
  /** 旧的文章列表 */
  oldArticles?: ArticleInfo[];
}

/**
 * 存储的全部状态
 */
export interface StorageData {
  /** 各网站状态 */
  sites: Record<string, SiteState>;
  /** 变更历史 */
  changes: ChangeRecord[];
  /** 最后更新时间 */
  lastUpdated: string;
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
  /** 之前的文章列表 */
  previousArticles?: ArticleInfo[];
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
