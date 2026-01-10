-- AI-Blog-Detection 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本

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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_change_records_changed_at ON change_records(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_records_site_id ON change_records(site_id);

-- 启用 Row Level Security (可选，但推荐)
ALTER TABLE site_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_records ENABLE ROW LEVEL SECURITY;

-- 创建策略允许服务角色完全访问
CREATE POLICY "Allow service role full access to site_states" ON site_states
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to change_records" ON change_records
  FOR ALL USING (true) WITH CHECK (true);

