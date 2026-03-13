-- ============================================================
-- Midnight Studio — Full Database Schema
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- Creates ALL tables from scratch for a fresh Supabase project
-- ============================================================

-- ─── 1. USERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'artist', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. ARTISTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  profile_image TEXT,
  specialties TEXT[] DEFAULT '{}',
  instagram_url TEXT,
  gcal_email TEXT,
  gcal_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. SERVICE CATEGORIES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ─── 4. SERVICES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES service_categories(id),
  artist_id UUID REFERENCES artists(id),
  base_price NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 60,
  image_url TEXT,
  image_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  marketing_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. SERVICE VARIANTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ─── 6. PRODUCTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  sku TEXT,
  stock_qty INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  marketing_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. PACKAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  artist_id UUID REFERENCES users(id),
  discount_percent NUMERIC DEFAULT 0,
  price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. PACKAGE_SERVICES (junction) ─────────────────────────
CREATE TABLE IF NOT EXISTS package_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  include_free BOOLEAN DEFAULT false,
  price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. PACKAGE_PRODUCTS (junction) ─────────────────────────
CREATE TABLE IF NOT EXISTS package_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  include_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. BOOKINGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  artist_id UUID REFERENCES artists(id),
  service_id UUID REFERENCES services(id),
  package_id UUID REFERENCES packages(id),
  variant_id UUID REFERENCES service_variants(id),
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  duration_minutes INTEGER,
  total_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  square_payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. BOOKING_PRODUCTS (junction) ────────────────────────
CREATE TABLE IF NOT EXISTS booking_products (
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (booking_id, product_id)
);

-- ─── 12. ARTIST AVAILABILITY ────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slots_json JSONB DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (artist_id, date)
);

-- ─── 13. ORDERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  order_date TIMESTAMPTZ DEFAULT now(),
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  items_json JSONB DEFAULT '[]'::jsonb,
  shipping_address JSONB,
  notes TEXT,
  coupon_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  square_payment_url TEXT,
  square_order_id TEXT,
  payment_id TEXT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 14. ORDER ITEMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC,
  line_total NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 15. MESSAGES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 16. COUPONS ────────────────────────────────────────────
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


-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public read on all tables (app uses service_role key for writes)
CREATE POLICY "public_read" ON users FOR SELECT USING (true);
CREATE POLICY "public_read" ON artists FOR SELECT USING (true);
CREATE POLICY "public_read" ON service_categories FOR SELECT USING (true);
CREATE POLICY "public_read" ON services FOR SELECT USING (true);
CREATE POLICY "public_read" ON service_variants FOR SELECT USING (true);
CREATE POLICY "public_read" ON products FOR SELECT USING (true);
CREATE POLICY "public_read" ON packages FOR SELECT USING (true);
CREATE POLICY "public_read" ON package_services FOR SELECT USING (true);
CREATE POLICY "public_read" ON package_products FOR SELECT USING (true);
CREATE POLICY "public_read" ON bookings FOR SELECT USING (true);
CREATE POLICY "public_read" ON booking_products FOR SELECT USING (true);
CREATE POLICY "public_read" ON artist_availability FOR SELECT USING (true);
CREATE POLICY "public_read" ON orders FOR SELECT USING (true);
CREATE POLICY "public_read" ON order_items FOR SELECT USING (true);
CREATE POLICY "public_read" ON messages FOR SELECT USING (true);
CREATE POLICY "public_read" ON coupons FOR SELECT USING (true);

-- Full access policies (service_role bypasses RLS, but anon/authenticated need these for inserts)
CREATE POLICY "full_access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON artists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON service_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON service_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON package_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON package_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON booking_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON artist_availability FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON coupons FOR ALL USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('marketing-posters', 'marketing-posters', true, 10485760),
  ('avatars', 'avatars', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Public read on storage
CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id IN ('marketing-posters', 'avatars'));
CREATE POLICY "public_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('marketing-posters', 'avatars'));


-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_artist_id ON services(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_artist_avail ON artist_availability(artist_id, date);
