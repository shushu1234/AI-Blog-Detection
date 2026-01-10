import type { SiteConfig } from '../types/index.js';

/**
 * 网站配置列表
 * 在这里添加要监控的博客网站
 * 
 * 使用 cssSelector 直接指定 CSS 选择器（推荐）
 * 注意：articleUrlXPath 会被转换为 CSS 选择器
 */
export const sitesConfig: SiteConfig[] = [
  // === AI 编辑器 / IDE ===
  {
    id: 'cursor-blog',
    name: 'Cursor Blog',
    url: 'https://cursor.com/cn/blog',
    cssSelector: 'article a p:first-child',
    articleUrlXPath: '//article//a/@href',
    description: '监控 Cursor Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'windsurf-blog',
    name: 'Windsurf Blog',
    url: 'https://windsurf.com/blog',
    cssSelector: 'a[href*="/blog/"] h3',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Windsurf Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'cline-blog',
    name: 'Cline Blog',
    url: 'https://cline.bot/blog',
    cssSelector: 'a[href*="/blog/"] h2, a[href*="/blog/"] h3',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Cline Blog 的最新文章',
    enabled: true,
  },

  // === AI 研究 / 大厂 ===
  {
    id: 'anthropic-engineering',
    name: 'Anthropic Engineering',
    url: 'https://www.anthropic.com/engineering',
    cssSelector: 'article a[href*="/engineering/"] h2, article a[href*="/engineering/"] h3',
    articleUrlXPath: '//article//a[contains(@href, "/engineering/")]/@href',
    description: '监控 Anthropic Engineering 博客的技术文章',
    enabled: true,
  },
  {
    id: 'openai-developer-blog',
    name: 'OpenAI Developer Blog',
    url: 'https://developers.openai.com/blog',
    cssSelector: 'a[href*="/blog/"] .text-xl',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 OpenAI Developer Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'openai-research',
    name: 'OpenAI Research',
    url: 'https://openai.com/research/index/',
    cssSelector: 'a[href*="/index/"] .text-h5',
    articleUrlXPath: '//a[contains(@href, "/index/")]/@href',
    description: '监控 OpenAI Research 的最新研究文章',
    enabled: true,
  },
  {
    id: 'google-research-blog',
    name: 'Google Research Blog',
    url: 'https://research.google/blog/',
    cssSelector: 'main section ul li a[href*="/blog/"]',
    articleUrlXPath: '//main//section//ul//li//a[contains(@href, "/blog/")]/@href',
    description: '监控 Google Research Blog 的最新研究文章',
    enabled: true,
  },
  {
    id: 'microsoft-ai-news',
    name: 'Microsoft AI News',
    url: 'https://news.microsoft.com/source/topics/ai/',
    cssSelector: 'article h2 a, article h3 a',
    articleUrlXPath: '//article//h2//a/@href | //article//h3//a/@href',
    description: '监控 Microsoft AI 新闻',
    enabled: true,
  },

  // === LLM 框架 / Agent ===
  {
    id: 'langchain-blog',
    name: 'LangChain Blog',
    url: 'https://blog.langchain.com/',
    cssSelector: 'article h2',
    articleUrlXPath: '//article//a/@href',
    description: '监控 LangChain Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'llamaindex-blog',
    name: 'LlamaIndex Blog',
    url: 'https://www.llamaindex.ai/blog',
    // 标题在 p > a 中
    cssSelector: 'main p a[href*="/blog/"]',
    articleUrlXPath: '//main//p//a[contains(@href, "/blog/")]/@href',
    description: '监控 LlamaIndex Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'crewai-blog',
    name: 'CrewAI Blog',
    url: 'https://www.crewai.com/blog',
    // SPA 网站，使用通用标题选择器
    cssSelector: 'h1, h2, h3',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 CrewAI Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'mcp-blog',
    name: 'MCP Blog',
    url: 'https://blog.modelcontextprotocol.io/',
    cssSelector: 'article h2',
    articleUrlXPath: '//article//a/@href',
    description: '监控 Model Context Protocol Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'letta-blog',
    name: 'Letta Blog',
    url: 'https://www.letta.com/blog',
    // SPA 网站，使用通用标题选择器
    cssSelector: 'h2, h3',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Letta (MemGPT) Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'mem0-blog',
    name: 'Mem0 Blog',
    url: 'https://mem0.ai/blog',
    // 标题在链接内的 h4 中
    cssSelector: 'a[href*="/blog/"] h4',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Mem0 Blog 的最新文章',
    enabled: true,
  },

  // === AI 开发平台 / Low-Code ===
  {
    id: 'dify-blog',
    name: 'Dify Blog',
    url: 'https://dify.ai/blog',
    cssSelector: 'main h2, main h3, a[href*="/blog/"] h2',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Dify Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'n8n-blog',
    name: 'n8n Blog',
    url: 'https://blog.n8n.io/',
    cssSelector: 'article h2, main h2, .post-title',
    articleUrlXPath: '//article//a/@href',
    description: '监控 n8n Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'langfuse-blog',
    name: 'Langfuse Blog',
    url: 'https://langfuse.com/blog',
    cssSelector: 'main h2, main h3, a[href*="/blog/"] h2',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Langfuse Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'langflow-blog',
    name: 'Langflow Blog',
    url: 'https://www.langflow.org/blog',
    cssSelector: 'main h2, main h3',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Langflow Blog 的最新文章',
    enabled: true,
  },

  // === RAG / 向量数据库 ===
  {
    id: 'ragflow-blog',
    name: 'RAGFlow Blog',
    url: 'https://ragflow.io/blog',
    // Docusaurus 博客，标题在 article h1 中
    cssSelector: 'main article h1',
    articleUrlXPath: '//main//a[contains(@href, "/blog/")]/@href',
    description: '监控 RAGFlow Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'weaviate-blog',
    name: 'Weaviate Blog',
    url: 'https://weaviate.io/blog',
    cssSelector: 'article h2, a[href*="/blog/"] h2',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Weaviate Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'milvus-blog',
    name: 'Milvus Blog',
    url: 'https://milvus.io/blog',
    // 英文版博客，标题在链接内的 h2/h3 中
    cssSelector: 'main a[href*="/blog/"] h2, main a[href*="/blog/"] h3',
    articleUrlXPath: '//main//a[contains(@href, "/blog/")]/@href',
    description: '监控 Milvus Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'qdrant-blog',
    name: 'Qdrant Blog',
    url: 'https://qdrant.tech/blog/',
    // Qdrant 使用 h5, h6 作为文章标题
    cssSelector: 'article h5, article h6',
    articleUrlXPath: '//article//a/@href',
    description: '监控 Qdrant Blog 的最新文章',
    enabled: true,
  },

  // === 其他 AI 产品 ===
  {
    id: 'lovart-blog',
    name: 'Lovart Blog',
    url: 'https://www.lovart.ai/zh/blog',
    cssSelector: 'a[href*="/blog/"] article h2',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Lovart Blog 的最新文章',
    enabled: true,
  },
  {
    id: 'manus-blog',
    name: 'Manus Blog',
    url: 'https://manus.im/zh-cn/blog',
    cssSelector: 'a[href*="/blog/"] h2',
    articleUrlXPath: '//a[contains(@href, "/blog/")]/@href',
    description: '监控 Manus Blog 的最新文章',
    enabled: true,
  },
];

export default sitesConfig;
