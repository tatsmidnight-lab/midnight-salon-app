-- ============================================================
-- Midnight Studio — Migration (missing tables/columns only)
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Add missing columns to existing tables
ALTER TABLE services ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_suggestions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- 2. Create packages table (MISSING)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  artist_id UUID REFERENCES users(id),
  discount_percent NUMERIC DEFAULT 0,
  price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create package_products table (MISSING)
CREATE TABLE IF NOT EXISTS package_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  include_free BOOLEAN DEFAULT false
);

-- 4. Create coupons table (MISSING)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_total NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'packages_public_read') THEN
    CREATE POLICY packages_public_read ON packages FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'packages' AND policyname = 'packages_service_write') THEN
    CREATE POLICY packages_service_write ON packages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_products' AND policyname = 'pkg_prod_public_read') THEN
    CREATE POLICY pkg_prod_public_read ON package_products FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_products' AND policyname = 'pkg_prod_service_write') THEN
    CREATE POLICY pkg_prod_service_write ON package_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_public_read') THEN
    CREATE POLICY coupons_public_read ON coupons FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_service_write') THEN
    CREATE POLICY coupons_service_write ON coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 7. Seed default coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_total, max_uses, expires_at)
VALUES
  ('WELCOME10', 'Welcome discount — 10% off first order', 'percentage', 10, 0, NULL, '2027-01-01'),
  ('MIDNIGHT20', '20% off any order over £30', 'percentage', 20, 30, 100, '2026-12-31'),
  ('FIVER', '£5 off any order', 'fixed', 5, 10, 200, '2026-12-31')
ON CONFLICT (code) DO NOTHING;
