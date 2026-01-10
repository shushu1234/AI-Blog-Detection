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

-- 如果表已存在，添加缺失的列
ALTER TABLE site_states ADD COLUMN IF NOT EXISTS known_article_urls TEXT[];

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
