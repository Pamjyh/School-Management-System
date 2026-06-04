-- ============================================================
-- ระบบบริหารงานโรงเรียน — Supabase Schema
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วางทั้งหมด → Run
-- ============================================================

-- ปีงบประมาณ
CREATE TABLE IF NOT EXISTS years (
  id         SERIAL PRIMARY KEY,
  year_be    INTEGER UNIQUE NOT NULL,   -- พ.ศ. เช่น 2569
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- โครงการ
CREATE TABLE IF NOT EXISTS projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id        INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT,                  -- 'จัดซื้อ' | 'จัดจ้าง' | 'ทั้งคู่'
  teacher_name   TEXT,
  budget_amount  DECIMAL(12,2) DEFAULT 0,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- รายการจัดซื้อ-จัดจ้าง
CREATE TABLE IF NOT EXISTS procurement_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id         INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  seq             INTEGER NOT NULL,     -- เลข จ.X (กรอกเอง)
  type            TEXT NOT NULL CHECK (type IN ('จัดซื้อ', 'จัดจ้าง')),
  title           TEXT NOT NULL,
  person          TEXT,                 -- ผู้รับผิดชอบ
  budget_source   TEXT,                 -- แหล่งงบประมาณ
  report_date     DATE,                 -- วันที่รายงานขอซื้อ/จ้าง
  amount          DECIMAL(10,2) DEFAULT 0,
  withdraw_status TEXT NOT NULL DEFAULT 'ยังไม่เบิก'
                  CHECK (withdraw_status IN ('เบิกแล้ว', 'ยังไม่เบิก')),
  withdraw_no     TEXT,                 -- เลขที่ใบเบิก
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- งานฝ่ายการเงิน (skeleton — จะเพิ่ม field เมื่อทราบรายละเอียด)
CREATE TABLE IF NOT EXISTS finance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id         INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  procurement_id  UUID REFERENCES procurement_items(id) ON DELETE SET NULL,
  record_type     TEXT,                 -- ประเภท (TBD)
  document_no     TEXT,                 -- เลขที่เอกสาร
  amount          DECIMAL(10,2) DEFAULT 0,
  record_date     DATE,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes — เพิ่มความเร็วในการ query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year_id);
CREATE INDEX IF NOT EXISTS idx_procurement_year ON procurement_items(year_id);
CREATE INDEX IF NOT EXISTS idx_procurement_project ON procurement_items(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement_items(withdraw_status);
CREATE INDEX IF NOT EXISTS idx_finance_year ON finance_records(year_id);
CREATE INDEX IF NOT EXISTS idx_finance_project ON finance_records(project_id);
CREATE INDEX IF NOT EXISTS idx_finance_procurement ON finance_records(procurement_id);

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_procurement_updated
  BEFORE UPDATE ON procurement_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_finance_updated
  BEFORE UPDATE ON finance_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- อ่าน-เขียนได้โดยทุกคนที่มี anon key (ปรับได้ทีหลังถ้าต้องการ login)
-- ============================================================
ALTER TABLE years             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records   ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตทุก operation จาก anon key
CREATE POLICY "allow_all_years"             ON years             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects"          ON projects          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_procurement"       ON procurement_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_finance"           ON finance_records   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- View: สรุปยอดต่อโครงการ (ใช้ใน dashboard Module 1)
-- ============================================================
CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.id,
  p.year_id,
  p.name,
  p.type,
  p.teacher_name,
  p.budget_amount,
  COALESCE(SUM(pr.amount), 0)                                           AS total_spent,
  p.budget_amount - COALESCE(SUM(pr.amount), 0)                        AS remaining,
  COUNT(pr.id)                                                          AS item_count,
  COUNT(pr.id) FILTER (WHERE pr.withdraw_status = 'เบิกแล้ว')          AS withdrawn_count,
  COUNT(pr.id) FILTER (WHERE pr.withdraw_status = 'ยังไม่เบิก')        AS pending_count,
  COALESCE(SUM(pr.amount) FILTER (WHERE pr.withdraw_status = 'เบิกแล้ว'), 0)   AS withdrawn_amount,
  COALESCE(SUM(pr.amount) FILTER (WHERE pr.withdraw_status = 'ยังไม่เบิก'), 0) AS pending_amount
FROM projects p
LEFT JOIN procurement_items pr ON pr.project_id = p.id
GROUP BY p.id;
