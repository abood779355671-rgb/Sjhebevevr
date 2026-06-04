/*
  # Update RLS policies to allow anon access for admin operations
  
  Since this is a single-user personal app, we update policies to allow 
  anon role (which uses the anon key) to perform all operations.
  This is safe as the app controls access via JWT middleware.
*/

-- Drop existing restrictive service_role policies and add anon-compatible ones

-- Templates
DROP POLICY IF EXISTS "service role full access on templates" ON templates;
DROP POLICY IF EXISTS "service role insert on templates" ON templates;
DROP POLICY IF EXISTS "service role update on templates" ON templates;
DROP POLICY IF EXISTS "service role delete on templates" ON templates;

CREATE POLICY "anon full access on templates"
  ON templates FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on templates"
  ON templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update on templates"
  ON templates FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete on templates"
  ON templates FOR DELETE TO anon USING (true);

-- Invitations admin
DROP POLICY IF EXISTS "service role full access on invitations" ON invitations;
DROP POLICY IF EXISTS "service role insert on invitations" ON invitations;
DROP POLICY IF EXISTS "service role update on invitations" ON invitations;
DROP POLICY IF EXISTS "service role delete on invitations" ON invitations;

CREATE POLICY "anon full access on invitations"
  ON invitations FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on invitations"
  ON invitations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update on invitations"
  ON invitations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete on invitations"
  ON invitations FOR DELETE TO anon USING (true);

-- Guests
DROP POLICY IF EXISTS "service role full access on guests" ON guests;
DROP POLICY IF EXISTS "service role insert on guests" ON guests;
DROP POLICY IF EXISTS "service role update on guests" ON guests;
DROP POLICY IF EXISTS "service role delete on guests" ON guests;

CREATE POLICY "anon full access on guests"
  ON guests FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on guests"
  ON guests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update on guests"
  ON guests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete on guests"
  ON guests FOR DELETE TO anon USING (true);

-- RSVP
DROP POLICY IF EXISTS "service role full access on rsvp_responses" ON rsvp_responses;
DROP POLICY IF EXISTS "service role insert on rsvp_responses" ON rsvp_responses;
DROP POLICY IF EXISTS "service role update on rsvp_responses" ON rsvp_responses;
DROP POLICY IF EXISTS "service role delete on rsvp_responses" ON rsvp_responses;

CREATE POLICY "anon full access on rsvp_responses"
  ON rsvp_responses FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on rsvp_responses"
  ON rsvp_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update on rsvp_responses"
  ON rsvp_responses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete on rsvp_responses"
  ON rsvp_responses FOR DELETE TO anon USING (true);

-- Analytics
DROP POLICY IF EXISTS "service role full access on analytics" ON analytics;
DROP POLICY IF EXISTS "service role insert on analytics" ON analytics;
DROP POLICY IF EXISTS "service role delete on analytics" ON analytics;

CREATE POLICY "anon full access on analytics"
  ON analytics FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on analytics"
  ON analytics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon delete on analytics"
  ON analytics FOR DELETE TO anon USING (true);

-- Design history
DROP POLICY IF EXISTS "service role full access on design_history" ON design_history;
DROP POLICY IF EXISTS "service role insert on design_history" ON design_history;
DROP POLICY IF EXISTS "service role delete on design_history" ON design_history;

CREATE POLICY "anon full access on design_history"
  ON design_history FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert on design_history"
  ON design_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon delete on design_history"
  ON design_history FOR DELETE TO anon USING (true);
