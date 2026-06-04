# School Management System

ระบบบริหารงานโรงเรียนแบบ static web app สำหรับงานโครงการ งานพัสดุ และงานการเงิน โดยเชื่อมต่อ Supabase ผ่าน REST API จาก browser

## Project Structure

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── assets/
│   └── school-logo.jpg
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── policies.sql
└── ระบบงานโรงเรียน.html
```

`ระบบงานโรงเรียน.html` คือไฟล์ต้นฉบับเดิมที่ยังเก็บไว้ชั่วคราว ส่วนไฟล์ที่ควรพัฒนาต่อคือ `index.html`, `css/styles.css`, และ `js/app.js`

## JavaScript Modules

```text
js/
├── config.js
├── state.js
├── helpers.js
├── years.js
├── dashboard.js
├── projects.js
├── procurement.js
├── finance.js
├── delete.js
├── navigation.js
├── init.js
├── events.js
└── app.js
```

## Current Modules

- Dashboard: สรุปโครงการ พัสดุ และยอดเบิกจ่าย
- Projects: เพิ่ม แก้ไข ลบ และดูรายละเอียดโครงการ
- Procurement: บันทึกรายการจัดซื้อจัดจ้างและสถานะการเบิก
- Finance: กำลังเตรียมทำจากโครงข้อมูลใน `supabase/schema.sql`

## Development Notes

- ใช้ Supabase `anon public key` เท่านั้นใน browser
- ห้าม commit `service_role key`
- ไฟล์ Excel การเงินมีข้อมูลส่วนบุคคล/ข้อมูลการเงิน จึงถูกกันออกด้วย `.gitignore`

## Supabase Setup Order

รันไฟล์ SQL ใน Supabase SQL editor ตามลำดับนี้:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/policies.sql`

`policies.sql` เป็น policy สำหรับช่วงพัฒนา static app เท่านั้น ก่อนใช้งานจริงควรเปลี่ยนเป็น Supabase Auth + role-based policies
