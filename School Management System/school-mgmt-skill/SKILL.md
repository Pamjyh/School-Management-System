---
name: school-mgmt
description: >
  Context skill สำหรับโปรเจกต์ระบบบริหารงานโรงเรียน (School Management System)
  ใช้ทุกครั้งที่ผู้ใช้ขอแก้ไข เพิ่มฟีเจอร์ หรือ debug ไฟล์ index.html ของโปรเจกต์นี้
  รวมถึงงานที่เกี่ยวกับ Supabase schema, procurement, projects, หรือ dashboard
---

# School Management System — Project Context

## โครงสร้างไฟล์
```
School Management System/
├── index.html        (1162 บรรทัด — ไฟล์หลัก single-file app)
├── 01_schema.sql     (131 บรรทัด — Supabase schema)
├── 02_seed.sql       (140 บรรทัด — seed data ปี 2569)
└── ตราโรงเรียน/      (assets)
```

## File Map: index.html

| ส่วน | บรรทัด | เนื้อหา |
|------|--------|---------|
| `<head>` + CSS | 1–257 | styles ทั้งหมด, Google Fonts, Supabase CDN |
| HTML: Loading/Setup | 261–292 | loadingOverlay, setupScreen |
| HTML: Nav | 294–317 | floating nav pill, tab buttons |
| HTML: Dashboard page | 318–356 | stat cards (5 cards), proj-table |
| HTML: Projects page | 357–385 | proj-grid, proj-detail |
| HTML: Procurement page | 386–447 | table + filter toolbar |
| HTML: Finance page | 448–461 | (coming soon placeholder) |
| HTML: Modals | 462–594 | procOverlay, projOverlay, yearOverlay, confirmOverlay |
| JS: Config/Supabase | 595–665 | getConfig, setConfig, sb() fetch wrapper |
| JS: Init/Load | 666–730 | init(), loadYears(), showError() |
| JS: loadAll + render | 731–838 | loadAll(), renderYearSel(), renderDashboard() |
| JS: Projects | 839–921 | renderProjGrid, openProjectDetail, forms |
| JS: Procurement | 922–1082 | getFilteredProc, renderProc, toggleStatus, forms |
| JS: Delete/Confirm | 1083–1097 | askDel, closeConfirm, confirmDel |
| JS: Utilities | 1098–1162 | goPage, fmt, numFmt, fmtDate, show, hide |

## Supabase

- **URL**: `https://itugxavlgxihmatxcjkn.supabase.co`
- **Auth**: hardcoded ใน `init()` (L.666)
- **วิธี call**: ใช้ `GET(table, query)` / `POST(table, body)` / `PATCH(table, query, body)` / `DEL(table, query)` — ไม่ใช้ supabase-js SDK แต่เป็น raw fetch

### Tables
| Table | Key Fields |
|-------|-----------|
| `years` | id, year_be (พ.ศ.), note |
| `projects` | id (UUID), year_id, name, teacher_name, budget_amount, sort_order |
| `procurement_items` | id (UUID), year_id, project_id, seq, type ('จัดซื้อ'\|'จัดจ้าง'), title, person, budget_source, report_date, amount, withdraw_status ('เบิกแล้ว'\|'ยังไม่เบิก'), withdraw_no |
| `finance_records` | id (UUID), year_id, project_id, procurement_id, record_type, document_no, amount, record_date |

### View
- `project_summary` — JOIN projects + procurement_items, มี total_spent, remaining, withdrawn_amount, pending_amount

## State Variables (JS globals)
```js
CY       // current year_id (integer)
CYbe     // current year_be (display เช่น 2569)  
YEARS    // array of year objects
PROJECTS // array of project objects (ปีปัจจุบัน)
PROC     // array of procurement_items (ปีปัจจุบัน)
PROC_TAB // 'all' | 'จัดซื้อ' | 'จัดจ้าง'
```

## CSS Conventions
- Color vars: `--ink` (dark), `--canvas` (bg), `--lifted` (card bg), `--signal` (red/error), `--up` (green)
- Border radius vars: `--r-btn` (20px), `--r-card` (24px), `--r-pill` (999px)
- Badge classes: `.b-buy` (จัดซื้อ), `.b-hire` (จัดจ้าง), `.b-done` (เบิกแล้ว), `.b-pend` (ยังไม่เบิก)
- Status toggle: `.st-btn.st-done` / `.st-btn.st-pend`

## วิธีแก้ไขอย่างกระชับ (ประหยัด Token)

**อ่านเฉพาะส่วนที่ต้องการ:**
```
Read index.html  offset=XXX  limit=YYY   ← ใช้ File Map ด้านบน
```

**แก้ CSS** → อ่าน L.1–257 เท่านั้น  
**แก้ HTML modal** → อ่าน L.462–594  
**แก้ logic** → อ่าน JS section ที่เกี่ยวข้อง (ดู File Map)  
**เพิ่มฟีเจอร์ใหม่** → อ่าน utilities (L.1098–1162) + section ที่เกี่ยวข้อง

## Pages / Tabs
| Tab | id | ฟังก์ชันหลัก |
|-----|----|------------|
| Dashboard | `page-dashboard` | `renderDashboard()` L.788 |
| โครงการ | `page-projects` | `renderProjGrid()` L.839 |
| จัดซื้อ-จัดจ้าง | `page-procurement` | `renderProc()` L.938 |
| การเงิน | `page-finance` | (ยังไม่พัฒนา) |

## Known Issues / History
- เพิ่ม `<script src="supabase-js@2">` ใน `<head>` (ก่อนหน้านี้หายไป)
- แก้ `loadYears()` ให้เป็น `async` (L.~612)
