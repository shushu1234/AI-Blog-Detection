-- AI-Blog-Detection 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 站点状态表
CREATE TABLE IF NOT EXISTS site_states (
  id TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  last_checked TIMESTAMPTZ NOT NULL,
  last_changed TIMESTAMPTZ,
  known_article_urls TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 文章记录表（每篇文章一条记录）
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  discovered_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 为 articles 表创建索引
CREATE INDEX IF NOT EXISTS idx_articles_site_id ON articles(site_id);
CREATE INDEX IF NOT EXISTS idx_articles_discovered_at ON articles(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- 4. 为 site_states 表创建索引
CREATE INDEX IF NOT EXISTS idx_site_states_updated_at ON site_states(updated_at);

-- 5. 启用 Row Level Security (可选，根据需要)
-- ALTER TABLE site_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 6. 创建公开访问策略（如果不使用 service_role_key）
-- CREATE POLICY "Allow public read" ON site_states FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON site_states FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update" ON site_states FOR UPDATE USING (true);

-- CREATE POLICY "Allow public read" ON articles FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON articles FOR INSERT WITH CHECK (true);

-- 查看现有表
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
