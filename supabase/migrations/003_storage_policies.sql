
-- 003_storage_policies.sql — นโยบาย Supabase Storage สำหรับ bucket exam-files
-- เปิดให้ผู้ที่ล็อกอินอัปโหลดไฟล์ตรงจาก browser

-- อัปโหลด/แทนที่ไฟล์ (re-upload ใช้ upsert)
create policy "exam_files_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exam-files');

create policy "exam_files_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'exam-files');

-- ลบไฟล์ (ใช้ตอนยกเลิกการส่ง — จริงๆ ระบบลบผ่าน API service role)
create policy "exam_files_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exam-files');
