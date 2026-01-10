# AI-Blog-Detection 🔍

AI博客变更检测工具 - 自动监控AI相关博客内容变化并生成 RSS 订阅

## ✨ 功能特性

- 📡 **定时检测**：通过 Vercel Cron 每天自动检测博客变更
- 🎯 **精准提取**：支持 XPath 和 CSS 选择器精确提取监控内容
- 🔗 **文章链接**：支持提取文章URL和标题，RSS中包含直达链接
- 📰 **RSS 订阅**：自动生成 RSS/Atom/JSON Feed，支持各种 RSS 阅读器
- 💾 **状态持久化**：使用 Vercel Edge Config 存储历史状态（超低延迟）
- 🔔 **变更记录**：保留最近 100 条变更历史

## 🚀 快速开始

### 1. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/AI-Blog-Detection)

### 2. 配置 Vercel Edge Config

1. 在 Vercel 控制台进入你的项目
2. 点击 **Storage** → **Create Database** → 选择 **Edge Config**
3. 创建后，点击 **Connect to Project** 连接到你的项目
4. Vercel 会自动设置 `EDGE_CONFIG` 环境变量

**配置写入功能**（可选，用于持久化存储）：

5. 进入 Edge Config 详情页，复制 **Edge Config ID**
6. 在 **Settings** → **Environment Variables** 中添加：
   - `EDGE_CONFIG_ID`: 你的 Edge Config ID
   - `VERCEL_API_TOKEN`: 从 [Vercel Settings](https://vercel.com/account/tokens) 创建的 API Token

### 3. 配置监控网站

编辑 `src/config/sites.json` 文件，添加你要监控的网站：

```json
[
  {
    "id": "my-site",
    "name": "我的博客",
    "url": "https://example.com/blog",
    "xpath": "//article//h2",
    "articleUrlXPath": "//article//a/@href",
    "description": "监控示例博客的最新文章",
    "enabled": true
  }
]
```

### 4. 订阅 RSS

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

// 提取所有链接文本
"//a/text()"
```

### CSS 选择器示例

```javascript
// 提取所有h2标题
"h2"

// 提取特定class的元素
".news-list h2"

// 提取id为content的元素
"#content"
```

## 🔌 API 端点

### GET /api/rss

获取 RSS 订阅

**参数**：
- `format`: 输出格式 (`rss` | `atom` | `json`)，默认 `rss`
- `limit`: 返回条目数量，默认 `50`

### GET /api/status

获取监控状态

**返回**：
```json
{
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "totalSites": 5,
  "enabledSites": 4,
  "recentChanges": 10,
  "sites": [...]
}
```

### POST /api/trigger

手动触发检测

**参数**：
- `site`: 指定网站ID（可选，不填则检测全部）
- `key`: API密钥（如果设置了`API_KEY`环境变量）

### GET /api/cron

Cron 触发器端点（由 Vercel Cron 自动调用）

## ⚙️ 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `EDGE_CONFIG` | ✅ | Edge Config 连接字符串（自动设置） |
| `EDGE_CONFIG_ID` | ❌ | Edge Config ID（用于写入，需手动设置） |
| `VERCEL_API_TOKEN` | ❌ | Vercel API Token（用于写入，需手动设置） |
| `CRON_SECRET` | ❌ | Cron 请求验证密钥 |
| `API_KEY` | ❌ | 手动触发API的访问密钥 |

> **注意**：如果不配置 `EDGE_CONFIG_ID` 和 `VERCEL_API_TOKEN`，检测功能仍然可用，但数据只会保存在内存中，重启后会丢失。

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

常用 Cron 表达式：
- `0 8 * * *` - 每天 UTC 08:00
- `0 */6 * * *` - 每6小时
- `0 0 * * 1` - 每周一 UTC 00:00

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 拉取环境变量（需要先 vercel login）
vercel env pull

# 启动开发服务器
npx vercel dev

# 本地测试抓取
npm run test

# 测试特定网站
npm run test:site cursor-blog
```

## 📄 License

MIT License
