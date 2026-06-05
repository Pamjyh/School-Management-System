# School Management System — Handoff

อ่านไฟล์นี้ก่อนทำงานทุกครั้ง สรุปสถานะโปรเจกต์ล่าสุด

## 1. เป้าหมายโปรเจกต์

Static web app บริหารงานโรงเรียน เชื่อม Supabase เป็น backend
โฮสต์บน GitHub Pages: **https://pamjyh.github.io/School-Management-System/**

ระบบหลัก: Dashboard / งานโครงการ / งานพัสดุ / งานการเงิน / รายงาน+Export (อนาคต)

---

## 2. โครงสร้างไฟล์

```
Claude School Management System/
├── index.html              ← HTML structure + modal ทั้งหมด
├── css/
│   └── styles.css
├── js/
│   ├── config.js           ← Supabase config, GET/POST/PATCH/DEL helpers
│   ├── state.js            ← global variables ทั้งหมด
│   ├── helpers.js          ← fmt, numFmt, fmtDate, show, hide
│   ├── years.js            ← year CRUD, switchYear
│   ├── dashboard.js        ← renderDashboard
│   ├── projects.js         ← project CRUD
│   ├── procurement.js      ← procurement CRUD
│   ├── finance.js          ← finance CRUD (loadFinanceData, loadTransactions, form)
│   ├── delete.js           ← confirmDel (proc / project / finance_transaction)
│   ├── navigation.js       ← goPage
│   ├── init.js             ← init, connectSupabase, loadAll, loadYears
│   ├── events.js           ← event listeners ทั้งหมด
│   └── app.js              ← DOMContentLoaded entry
├── supabase/
│   ├── schema.sql          ← ✅ รันแล้ว
│   ├── seed.sql            ← ✅ รันแล้ว (16 หมวดเงิน)
│   └── policies.sql        ← ✅ รันแล้ว
├── assets/school-logo.jpg
├── .gitignore
├── README.md
└── CLAUDE_HANDOFF.md
```

**ลำดับ script ใน index.html (ห้ามสลับ):**
`config → state → helpers → years → dashboard → projects → procurement → finance → delete → navigation → init → events → app`

---

## 3. Supabase

- URL/key เก็บใน localStorage (`sb_config_v1`) — ไม่ hardcode
- ใช้ anon key เท่านั้น
- API wrapper: `GET(table, query)` / `POST(table, body)` / `PATCH(table, query, body)` / `DEL(table, query)`
- **PATCH ใช้ query string**: `PATCH('table', 'id=eq.'+id, payload)` ไม่ใช่ id ตรงๆ

### Tables

| Table | Key Fields |
|-------|-----------|
| `years` | id, year_be |
| `projects` | id, year_id, name, teacher_name, budget_amount |
| `procurement_items` | id, year_id, project_id, seq, type, title, person, amount, withdraw_status, withdraw_no |
| `fund_categories` | id, name, sort_order — seed แล้ว 16 หมวด |
| `finance_transactions` | id, year_id, transaction_date, transaction_type (รับ/จ่าย/ยอดยกมา), fund_category_id, holding_type (เงินสด/เงินฝากธนาคาร/เงินฝากส่วนราชการผู้เบิก), amount, doc_no, description, project_id, remark |

### Views

| View | ใช้ใน |
|------|------|
| `project_summary` | dashboard, project detail |
| `finance_fund_balances` | Finance tab เงินคงเหลือแยกหมวด |

---

## 4. State Variables (js/state.js)

```js
CY, CYbe             // year_id และ year_be ปัจจุบัน
YEARS, PROJECTS, PROC, PROC_TAB
PENDING_DEL          // {type, id} รอยืนยันลบ
FUND_CATEGORIES, FINANCE_BALANCES
FINANCE_TRANSACTIONS // array — โหลดเมื่อเปิด tab รายการรับ-จ่าย
FINANCE_LOADED       // false = ต้อง reload (reset เมื่อ switchYear)
FIN_TAB              // 'balance' | 'transactions'
```

---

## 5. สิ่งที่ทำไปแล้ว ✅

- แยกไฟล์ทั้งหมดจาก single-file เดิม
- Supabase schema/seed/policies รันแล้วครบ
- Dashboard, Projects, Procurement: CRUD ครบ
- Finance Phase B: tabs + ฟอร์มรับ-จ่าย + CRUD transactions
- แก้ bug: switchYear() reset FINANCE_LOADED
- .gitignore ครบ, push GitHub Pages แล้ว
- **UI ปรับแล้ว** (`css/styles.css`): body 16px, page max-width 1400px padding 40px 48px, stat card ใหญ่ขึ้น (padding 28px 24px, ตัวเลข 38px), table cell padding 14px 18px, tab 13px 24px, page title 44px, page-header align-items:center (ทุกหน้า header ดู consistent กัน)
- **Phase D ✅**: เชื่อมพัสดุกับการเงิน — ฟอร์มจ่ายเงินมี dropdown เลือก procurement_item (กรองตามโครงการ, แยกกลุ่มรอ/เบิกแล้ว) บันทึกแล้ว auto-PATCH withdraw_status='เบิกแล้ว' + revert อันเก่าถ้าเปลี่ยน item (finance.js, events.js, index.html)

---

## 6. TODO ถัดไป (เรียงลำดับ)

### ✅ Phase D — เชื่อมพัสดุกับการเงิน (เสร็จแล้ว)

### 🟡 1. Phase E — รายงานเงินคงเหลือประจำวัน

- pivot table: หมวดเงิน × (เงินสด / ธนาคาร / ส่วนราชการ)

### 🟡 4. Phase F — Export CSV/Excel

### 🟡 5. นำเข้าข้อมูลพัสดุจาก Google Drive

### 🔵 6. Phase G — Auth/RLS (production)

---

## 7. Bug Patterns ที่เคยเจอ

| Bug | วิธีแก้ |
|-----|--------|
| switchYear ไม่ refresh Finance | เพิ่ม `FINANCE_LOADED=false; FINANCE_TRANSACTIONS=[];` ก่อน loadAll() |
| PATCH ไม่ทำงาน | ต้องส่ง query string: `'id=eq.'+id` ไม่ใช่ id ตรงๆ |
| git index.lock ค้าง | `rm -f .git/index.lock` ใน Mac Terminal |

---

## 8. วิธีทำงานร่วมกัน (สำคัญ — อ่านก่อนเริ่ม)

- **ทำเลย อย่าถามเยอะ** — ถ้าเข้าใจ task แล้ว ลงมือเลย ถามเฉพาะเมื่อ ambiguous จริงๆ
- **กระชับ** — ตอบสั้น ตรงประเด็น ไม่อธิบาย step ที่ user เห็นอยู่แล้ว
- **ตรวจสอบก่อน push ทุกครั้ง** — ใช้ skill `school-mgmt-verify` หรือรัน step ด้วยตัวเอง
- **อัป HANDOFF ก่อนปิด chat** — ทุกครั้งที่ทำอะไรเสร็จ update section 5 (ทำแล้ว) และ 6 (TODO)
- **แก้ทีละไฟล์** — ไม่แก้หลาย module พร้อมกัน ทำให้ debug ง่ายกว่า
- **ภาษาไทย** — คุยกันภาษาไทยตลอด code comment ภาษาไทยได้ถ้าเหมาะสม

## 9. ตรวจสอบก่อน Commit

ใช้ skill **school-mgmt-verify** (พิมพ์ "เช็คก่อน push")

---

## 10. GitHub

- Repo: https://github.com/Pamjyh/School-Management-System
- Pages: https://pamjyh.github.io/School-Management-System/
- Branch: main — push ด้วย Personal Access Token (classic, scope: repo)
