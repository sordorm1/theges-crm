-- Allow the anon key to SELECT (read) directly from the browser (static
-- GitHub Pages frontend has no server of its own). All writes go through
-- Supabase Edge Functions using the service_role key, which bypasses RLS
-- entirely — so no insert/update/delete policies are granted here.
create policy "anon can read partners" on partners for select using (true);
create policy "anon can read subjects" on subjects for select using (true);
create policy "anon can read subject_levels" on subject_levels for select using (true);
create policy "anon can read exam_programs" on exam_programs for select using (true);
create policy "anon can read students" on students for select using (true);
create policy "anon can read exam_records" on exam_records for select using (true);
create policy "anon can read payment_comments" on payment_comments for select using (true);
