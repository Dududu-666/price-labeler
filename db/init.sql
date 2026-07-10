-- ============================================================
-- 商品价格标注器 — Supabase 数据库初始化脚本
-- 请在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================================

-- 1. 启用模糊搜索扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 2. 建表
-- ============================================================

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 商品主表
CREATE TABLE IF NOT EXISTS products (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  barcode       TEXT NOT NULL UNIQUE,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  category      TEXT NOT NULL DEFAULT '',
  spec          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- 价格变更日志表
CREATE TABLE IF NOT EXISTS price_changelog (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_selling_price  DECIMAL(10,2),
  new_selling_price  DECIMAL(10,2),
  old_cost_price     DECIMAL(10,2),
  new_cost_price     DECIMAL(10,2),
  changed_by      TEXT NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changelog_product ON price_changelog (product_id);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- products 表: 更新时自动刷新 updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- categories 表: 更新时自动刷新 updated_at
DROP TRIGGER IF EXISTS set_categories_updated_at ON categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. Row Level Security 策略
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_changelog ENABLE ROW LEVEL SECURITY;

-- categories: 已认证用户可 CRUD
CREATE POLICY "Authenticated can read categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert categories"
  ON categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update categories"
  ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete categories"
  ON categories FOR DELETE TO authenticated USING (true);

-- products: 已认证用户可 CRUD
CREATE POLICY "Authenticated can read products"
  ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert products"
  ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update products"
  ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete products"
  ON products FOR DELETE TO authenticated USING (true);

-- price_changelog: 只读 + 只写（不可修改/删除）
CREATE POLICY "Authenticated can read changelog"
  ON price_changelog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert changelog"
  ON price_changelog FOR INSERT TO authenticated WITH CHECK (true);
