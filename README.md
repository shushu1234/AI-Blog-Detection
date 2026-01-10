# AI-Blog-Detection 🔍

AI博客变更检测工具 - 自动监控AI相关博客内容变化并生成 RSS 订阅

## ✨ 功能特性

- 📡 **定时检测**：通过 Vercel Cron 每天自动检测博客变更
- 🎯 **精准提取**：支持 XPath 和 CSS 选择器精确提取监控内容
- 🔗 **文章链接**：支持提取文章URL和标题，RSS中包含直达链接
- 📰 **RSS 订阅**：自动生成 RSS/Atom/JSON Feed，支持各种 RSS 阅读器
- 💾 **状态持久化**：使用 Supabase PostgreSQL 存储历史状态
- 🔔 **变更记录**：保留最近 100 条变更历史

## 🚀 快速开始

### 1. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/AI-Blog-Detection)

### 2. 配置 Supabase 存储

1. 在 Vercel 控制台进入你的项目
2. 点击 **Storage** → **Create Database** → 选择 **Supabase**
3. 按照提示完成 Supabase 配置
4. Vercel 会自动设置所需的环境变量

### 3. 初始化数据库表

在 Supabase 控制台中：
1. 进入你的项目 → **SQL Editor**
2. 运行 `supabase/init.sql` 中的 SQL 脚本创建表

```sql
-- 创建站点状态表
CREATE TABLE IF NOT EXISTS site_states (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  last_checked TIMESTAMPTZ NOT NULL,
  last_changed TIMESTAMPTZ,
  articles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建变更记录表
CREATE TABLE IF NOT EXISTS change_records (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  old_content TEXT,
  new_content TEXT NOT NULL,
  description TEXT,
  new_articles JSONB,
  old_articles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_change_records_changed_at ON change_records(changed_at DESC);
```

### 4. 配置监控网站

编辑 `src/config/sites.ts` 文件，添加你要监控的网站：

```typescript
export const sitesConfig: SiteConfig[] = [
  {
    id: 'my-site',
    name: '我的博客',
    url: 'https://example.com/blog',
    xpath: '//article//h2',
    articleUrlXPath: '//article//a/@href',
    description: '监控示例博客的最新文章',
    enabled: true,
  },
];
```

### 5. 订阅 RSS

部署完成后，访问以下地址订阅：

- **RSS 2.0**: `https://your-domain.vercel.app/api/rss`
- **Atom**: `https://your-domain.vercel.app/api/rss?format=atom`
- **JSON Feed**: `https://your-domain.vercel.app/api/rss?format=json`

## 📝 配置说明

### 网站配置字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符 |
| `name` | string | ✅ | 网站名称（显示在RSS中） |
| `url` | string | ✅ | 要监控的网页URL |
| `xpath` | string | ⭕ | XPath表达式（提取标题内容） |
| `articleUrlXPath` | string | ❌ | 文章URL的XPath表达式 |
| `cssSelector` | string | ⭕ | CSS选择器（与xpath二选一） |
| `description` | string | ❌ | 描述信息 |
| `enabled` | boolean | ❌ | 是否启用（默认true） |

### XPath 示例

```javascript
// 提取所有h2标题
"//h2"

// 提取特定class的div内容
"//div[@class='news-list']//h2"

// 提取文章链接
"//article//a/@href"

// 提取id为content的元素
"//*[@id='content']"
```

## 🔌 API 端点

### GET /api/rss

获取 RSS 订阅

**参数**：
- `format`: 输出格式 (`rss` | `atom` | `json`)，默认 `rss`
- `limit`: 返回条目数量，默认 `50`

### GET /api/status

获取监控状态

### POST /api/trigger 或 GET /api/trigger

手动触发检测（也可在首页点击按钮触发）

### GET /api/cron

Cron 触发器端点（由 Vercel Cron 自动调用）

## ⚙️ 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Service Role Key |
| `CRON_SECRET` | ❌ | Cron 请求验证密钥 |
| `API_KEY` | ❌ | 手动触发API的访问密钥 |

> Vercel + Supabase 集成会自动设置这些环境变量

## 📅 Cron 调度

默认每天北京时间 16:00（UTC 08:00）执行一次检测。

修改 `vercel.json` 来调整调度时间：

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npx vercel dev

# 本地测试抓取
npm run test

# 测试特定网站
npm run test:site cursor-blog
```

## 📄 License

MIT License
