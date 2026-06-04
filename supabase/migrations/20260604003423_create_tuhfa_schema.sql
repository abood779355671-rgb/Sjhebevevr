/*
  # تحفة - مخطط قاعدة البيانات

  ## الجداول الجديدة

  ### 1. templates (القوالب)
  - id: معرف فريد
  - name: اسم القالب
  - description: وصف
  - design_key: مفتاح التصميم (1-10)
  - color_scheme: مجموعة الألوان
  - font_family: الخط المستخدم
  - thumbnail_url: صورة مصغرة
  - elements: عناصر القالب (JSON)
  - canvas_width/height: أبعاد الكانفاس
  - is_custom: هل هو قالب مخصص
  - created_at / updated_at

  ### 2. invitations (الدعوات)
  - id: معرف فريد
  - slug: رابط فريد
  - title: عنوان الدعوة
  - bride_name / groom_name: اسمي العروسين
  - event_date: تاريخ الحفل
  - event_time: وقت الحفل
  - venue_name: مكان الحفل
  - venue_address: عنوان المكان
  - venue_lat / venue_lng: إحداثيات الخريطة
  - template_id: القالب المستخدم
  - elements: عناصر التصميم (JSON)
  - canvas_width / canvas_height: أبعاد الكانفاس
  - password: كلمة مرور اختيارية
  - expires_at: تاريخ انتهاء
  - is_active: هل الدعوة نشطة
  - views_count: عدد المشاهدات
  - music_url: رابط الموسيقى
  - created_at / updated_at

  ### 3. guests (الضيوف)
  - id, invitation_id, name, phone, email
  - group_name, notes, created_at

  ### 4. rsvp_responses (ردود الحضور)
  - id, invitation_id, guest_name, phone
  - attendance_status (attending/not_attending/maybe)
  - companions_count, notes, created_at

  ### 5. analytics (التحليلات)
  - id, invitation_id, event_type, ip_address, user_agent, created_at

  ### 6. design_history (تاريخ التصاميم)
  - id, invitation_id, elements (JSON snapshot), created_at

  ## الأمان
  - RLS مفعّل على جميع الجداول
  - الوصول فقط من server-side (service role key)
*/

-- جدول القوالب
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  design_key integer NOT NULL DEFAULT 1,
  color_scheme text NOT NULL DEFAULT 'gold-white',
  font_family text NOT NULL DEFAULT 'Amiri',
  thumbnail_url text DEFAULT '',
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  canvas_width integer NOT NULL DEFAULT 800,
  canvas_height integer NOT NULL DEFAULT 1200,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on templates"
  ON templates
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on templates"
  ON templates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role update on templates"
  ON templates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role delete on templates"
  ON templates
  FOR DELETE
  TO service_role
  USING (true);

-- جدول الدعوات
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  bride_name text NOT NULL DEFAULT '',
  groom_name text NOT NULL DEFAULT '',
  event_date date,
  event_time text DEFAULT '',
  venue_name text DEFAULT '',
  venue_address text DEFAULT '',
  venue_lat numeric(10,7),
  venue_lng numeric(10,7),
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  canvas_width integer NOT NULL DEFAULT 800,
  canvas_height integer NOT NULL DEFAULT 1200,
  background_color text DEFAULT '#FFFFFF',
  password text DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  views_count integer NOT NULL DEFAULT 0,
  music_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on invitations"
  ON invitations
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on invitations"
  ON invitations
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role update on invitations"
  ON invitations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role delete on invitations"
  ON invitations
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "public can read active invitations"
  ON invitations
  FOR SELECT
  TO anon
  USING (is_active = true);

-- جدول الضيوف
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  group_name text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on guests"
  ON guests
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on guests"
  ON guests
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role update on guests"
  ON guests
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role delete on guests"
  ON guests
  FOR DELETE
  TO service_role
  USING (true);

-- جدول ردود الحضور
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  attendance_status text NOT NULL DEFAULT 'attending' CHECK (attendance_status IN ('attending', 'not_attending', 'maybe')),
  companions_count integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on rsvp_responses"
  ON rsvp_responses
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on rsvp_responses"
  ON rsvp_responses
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role update on rsvp_responses"
  ON rsvp_responses
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service role delete on rsvp_responses"
  ON rsvp_responses
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "public can insert rsvp"
  ON rsvp_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- جدول التحليلات
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'view' CHECK (event_type IN ('view', 'rsvp', 'share', 'map_click', 'qr_scan')),
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on analytics"
  ON analytics
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on analytics"
  ON analytics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role delete on analytics"
  ON analytics
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "public can insert analytics"
  ON analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- جدول تاريخ التصاميم
CREATE TABLE IF NOT EXISTS design_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE design_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access on design_history"
  ON design_history
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service role insert on design_history"
  ON design_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service role delete on design_history"
  ON design_history
  FOR DELETE
  TO service_role
  USING (true);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);
CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_invitation ON rsvp_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_invitation ON analytics(invitation_id);
CREATE INDEX IF NOT EXISTS idx_design_history_invitation ON design_history(invitation_id);

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
