// =====================================================================
// IMPORT CSV — นำเข้าข้อมูลพัสดุ
// =====================================================================
// รองรับ CSV ที่ download จาก Google Drive (Google Sheets → File → Download → CSV)
// หรือ CSV ที่ export ออกจากระบบนี้โดยตรง
//
// คอลัมน์ที่คาดหวัง (ตาม export format):
// ลำดับ | ประเภท | รายการ | โครงการ | ผู้รับผิดชอบ | วันที่รายงาน | วงเงิน (บาท) | สถานะ | เลขใบเบิก | หมายเหตุ

var IMPORT_ROWS = []; // เก็บ rows ที่ parse แล้วรอ confirm

// ---------- เปิด/ปิด modal ----------
function openImportModal(){
  IMPORT_ROWS = [];
  document.getElementById('importFile').value = '';
  document.getElementById('importPreview').innerHTML = '<p style="color:var(--muted);font-size:13px">เลือกไฟล์ CSV เพื่อดูตัวอย่างข้อมูล</p>';
  document.getElementById('importConfirmBtn').style.display = 'none';
  document.getElementById('importStatus').textContent = '';
  document.getElementById('importOverlay').classList.add('open');
}
function closeImportModal(){
  document.getElementById('importOverlay').classList.remove('open');
}

// ---------- parse CSV ----------
function parseCSVText(text){
  // ตัด BOM ถ้ามี
  if(text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  var rows = [];
  var lines = text.split(/\r?\n/);
  lines.forEach(function(line){
    if(!line.trim()) return;
    var cols = [];
    var cur = '';
    var inQ = false;
    for(var i=0; i<line.length; i++){
      var ch = line[i];
      if(ch==='"' && !inQ){ inQ=true; }
      else if(ch==='"' && inQ && line[i+1]==='"'){ cur+='"'; i++; }
      else if(ch==='"' && inQ){ inQ=false; }
      else if(ch===',' && !inQ){ cols.push(cur.trim()); cur=''; }
      else { cur+=ch; }
    }
    cols.push(cur.trim());
    rows.push(cols);
  });
  return rows;
}

// ---------- อ่านไฟล์และแสดง preview ----------
function onImportFileChange(input){
  var file = input.files[0];
  if(!file) return;

  var status = document.getElementById('importStatus');
  status.textContent = 'กำลังอ่านไฟล์...';

  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var rows = parseCSVText(e.target.result);
      if(rows.length < 2){
        status.textContent = '❌ ไฟล์ว่างหรือมีแค่ header';
        return;
      }

      var header = rows[0];
      var dataRows = rows.slice(1).filter(function(r){ return r.some(function(c){ return c; }); });

      if(!dataRows.length){
        status.textContent = '❌ ไม่พบข้อมูล (มีแค่ header)';
        return;
      }

      // map index จาก header
      var idx = {
        seq:    _colIdx(header, ['ลำดับ','seq','จ.']),
        type:   _colIdx(header, ['ประเภท','type']),
        title:  _colIdx(header, ['รายการ','title']),
        proj:   _colIdx(header, ['โครงการ','project']),
        person: _colIdx(header, ['ผู้รับผิดชอบ','person']),
        date:   _colIdx(header, ['วันที่รายงาน','report_date','วันที่']),
        amount: _colIdx(header, ['วงเงิน','amount','จำนวนเงิน']),
        status: _colIdx(header, ['สถานะ','withdraw_status']),
        wdNo:   _colIdx(header, ['เลขใบเบิก','withdraw_no']),
        remark: _colIdx(header, ['หมายเหตุ','remark'])
      };

      if(idx.title < 0){
        status.textContent = '❌ ไม่พบคอลัมน์ "รายการ" — ตรวจสอบ format CSV';
        return;
      }

      // parse เป็น objects
      IMPORT_ROWS = dataRows.map(function(r){
        var seqRaw = idx.seq>=0 ? r[idx.seq] : '';
        var seqNum = parseInt(String(seqRaw).replace(/[^\d]/g,'')) || 0;
        var typeVal = idx.type>=0 ? r[idx.type] : 'จัดซื้อ';
        if(typeVal !== 'จัดซื้อ' && typeVal !== 'จัดจ้าง') typeVal = 'จัดซื้อ';
        var statusVal = idx.status>=0 ? r[idx.status] : 'ยังไม่เบิก';
        if(statusVal !== 'เบิกแล้ว') statusVal = 'ยังไม่เบิก';
        var projName = idx.proj>=0 ? r[idx.proj] : '';
        var projId   = _findProjId(projName);
        return {
          seq:            seqNum,
          type:           typeVal,
          title:          idx.title>=0 ? r[idx.title] : '',
          project_name:   projName,
          project_id:     projId,
          person:         idx.person>=0 ? r[idx.person] : '',
          report_date:    _parseDate(idx.date>=0 ? r[idx.date] : ''),
          amount:         parseFloat(String(idx.amount>=0?r[idx.amount]:0).replace(/,/g,''))||0,
          withdraw_status:statusVal,
          withdraw_no:    idx.wdNo>=0 ? r[idx.wdNo] : '',
          remark:         idx.remark>=0 ? r[idx.remark] : ''
        };
      }).filter(function(r){ return r.title; }); // กรองแถวที่ไม่มีรายการ

      // แสดง preview
      _renderImportPreview(IMPORT_ROWS);
      status.textContent = 'พบ '+IMPORT_ROWS.length+' รายการ (จาก '+dataRows.length+' แถว)';
      document.getElementById('importConfirmBtn').style.display = 'inline-block';

    }catch(err){
      status.textContent = '❌ อ่านไฟล์ไม่ได้: '+err.message;
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function _colIdx(header, aliases){
  for(var i=0;i<header.length;i++){
    var h = header[i].toLowerCase();
    for(var j=0;j<aliases.length;j++){
      if(h.includes(aliases[j].toLowerCase())) return i;
    }
  }
  return -1;
}

function _findProjId(name){
  if(!name) return null;
  var p = PROJECTS.find(function(p){ return p.name === name; });
  return p ? p.id : null;
}

function _parseDate(raw){
  if(!raw) return null;
  // รองรับ DD/MM/YYYY, YYYY-MM-DD
  var parts = raw.split('/');
  if(parts.length===3){
    var y = parts[2].length===4 ? parts[2] : '25'+parts[2];
    // ถ้าเป็นปี พ.ศ. > 2500 แปลงเป็น ค.ศ.
    if(parseInt(y)>2400) y = String(parseInt(y)-543);
    return y+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0');
  }
  return raw || null;
}

function _renderImportPreview(rows){
  var preview = rows.slice(0,5);
  var html = '<div style="overflow-x:auto"><table style="font-size:12px;width:100%">'+
    '<thead><tr style="background:var(--canvas)">'+
    '<th style="padding:6px 10px;text-align:left">ลำดับ</th>'+
    '<th style="padding:6px 10px;text-align:left">ประเภท</th>'+
    '<th style="padding:6px 10px;text-align:left;min-width:160px">รายการ</th>'+
    '<th style="padding:6px 10px;text-align:left">โครงการ</th>'+
    '<th style="padding:6px 10px;text-align:right">วงเงิน</th>'+
    '<th style="padding:6px 10px;text-align:left">สถานะ</th>'+
    '</tr></thead><tbody>'+
    preview.map(function(r){
      var projOK = r.project_id ? '✅' : (r.project_name ? '⚠️ ไม่พบ' : '—');
      return '<tr style="border-top:1px solid rgba(0,0,0,.06)">'+
        '<td style="padding:5px 10px;font-family:var(--mono)">จ.'+r.seq+'</td>'+
        '<td style="padding:5px 10px">'+r.type+'</td>'+
        '<td style="padding:5px 10px">'+r.title+'</td>'+
        '<td style="padding:5px 10px;font-size:11px">'+projOK+' '+r.project_name+'</td>'+
        '<td style="padding:5px 10px;text-align:right;font-family:var(--mono)">'+fmt(r.amount)+'</td>'+
        '<td style="padding:5px 10px">'+r.withdraw_status+'</td>'+
        '</tr>';
    }).join('')+
    '</tbody></table></div>'+
    (rows.length>5?'<p style="font-size:11px;color:var(--muted);margin-top:6px">... และอีก '+(rows.length-5)+' รายการ</p>':'');
  document.getElementById('importPreview').innerHTML = html;
}

// ---------- ยืนยัน import ----------
async function confirmImport(){
  if(!IMPORT_ROWS.length){ alert('ไม่มีข้อมูลที่จะนำเข้า'); return; }

  var status = document.getElementById('importStatus');
  var btn    = document.getElementById('importConfirmBtn');
  btn.disabled = true;
  btn.textContent = 'กำลังนำเข้า...';
  show('loadingOverlay','flex');

  var ok = 0; var fail = 0;
  for(var i=0; i<IMPORT_ROWS.length; i++){
    var r = IMPORT_ROWS[i];
    if(!r.title) continue;
    var body = {
      year_id:         CY,
      seq:             r.seq || (i+1),
      type:            r.type,
      title:           r.title,
      project_id:      r.project_id || null,
      person:          r.person || null,
      report_date:     r.report_date || null,
      amount:          r.amount || 0,
      withdraw_status: r.withdraw_status,
      withdraw_no:     r.withdraw_no || null,
      remark:          r.remark || null
    };
    try{
      await POST('procurement_items', body);
      ok++;
    }catch(e){
      fail++;
    }
  }

  hide('loadingOverlay');
  btn.disabled = false;
  btn.textContent = 'นำเข้าข้อมูล';

  status.textContent = '✅ นำเข้าสำเร็จ '+ok+' รายการ'+(fail?' (ล้มเหลว '+fail+')':'');

  if(ok > 0){
    await loadAll();
    setTimeout(closeImportModal, 1500);
  }
}

// =====================================================================
// IMPORT EXCEL — นำเข้าข้อมูลการเงิน (ยอดยกมา) จากไฟล์ xlsx
// =====================================================================
// อ่าน sheet "เงินคงเหลือประจำวัน":
//   header: ประเภท | เงินสด | เงินฝากธนาคาร | เงินฝากส่วนราชการผู้เบิก | รวม
//   สร้าง finance_transactions ประเภท "ยอดยกมา" แยกตาม fund × holding_type

var IMPORT_EXCEL_ROWS = [];

// ---------- เปิด/ปิด ----------
function openImportExcelModal(){
  IMPORT_EXCEL_ROWS = [];
  document.getElementById('importExcelFile').value = '';
  document.getElementById('importExcelDate').value = _defaultYodYokDate();
  document.getElementById('importExcelPreview').innerHTML = '<p style="color:var(--muted);font-size:13px">เลือกไฟล์ Excel เพื่อดูตัวอย่าง</p>';
  document.getElementById('importExcelConfirmBtn').style.display = 'none';
  document.getElementById('importExcelStatus').textContent = '';
  document.getElementById('importExcelOverlay').classList.add('open');
}
function closeImportExcelModal(){
  document.getElementById('importExcelOverlay').classList.remove('open');
}

// วันเริ่มต้นปีงบ = 1 ต.ค. ของปี ค.ศ. (CYbe - 543)
function _defaultYodYokDate(){
  var be = CYbe || 2569;
  var ce = be - 543 - 1; // ปีงบ 2569 เริ่ม ต.ค. 2025
  return ce + '-10-01';
}

// ---------- keyword match fund name → fund_category_id ----------
var _FUND_KEY_MAP = [
  {keys:['บริจาค','กรุงไทย'],           code:'donation-ktb'},
  {keys:['บริจาค','ธกส','ธ.ก.ส'],       code:'donation-baac'},
  {keys:['โครงการลูกเสือ','ลูกเสือสำรอง'], code:'scout-project'},
  {keys:['ลูกเสือ','บำรุงลูกเสือ'],      code:'scout'},
  {keys:['รายหัว','จัดการเรียน'],        code:'per-head'},
  {keys:['หนังสือเรียน'],               code:'textbook'},
  {keys:['อุปกรณ์การเรียน'],            code:'supplies'},
  {keys:['เครื่องแบบ'],                 code:'uniform'},
  {keys:['กิจกรรมพัฒนา'],              code:'activity'},
  {keys:['กสศ','ยากจนพิเศษ'],          code:'eef'},
  {keys:['ปัจจัยพื้นฐาน','ยากจน'],     code:'poor-student'},
  {keys:['อาหารกลางวัน'],              code:'lunch'},
  {keys:['ประกันสัญญา'],               code:'guarantee'},
  {keys:['ภาษีหัก','ภาษี หัก'],        code:'withholding-tax'},
  {keys:['หลักประกันสุขภาพ','อบต'],    code:'health-local'},
  {keys:['รายได้แผ่นดิน'],             code:'state-revenue'},
];

function _matchFund(excelName){
  if(!excelName) return null;
  var n = excelName.toLowerCase().replace(/\s+/g,' ').trim();
  // ลอง exact match ก่อน
  var exact = FUND_CATEGORIES.find(function(f){ return f.name.toLowerCase()===n; });
  if(exact) return exact.id;
  // keyword match
  for(var i=0;i<_FUND_KEY_MAP.length;i++){
    var rule = _FUND_KEY_MAP[i];
    var hit  = rule.keys.every(function(k){ return n.includes(k.toLowerCase()); });
    if(hit){
      var cat = FUND_CATEGORIES.find(function(f){ return f.code===rule.code; });
      if(cat) return cat.id;
    }
  }
  return null;
}

// ---------- อ่านไฟล์ ----------
function onExcelFileChange(input){
  if(!window.XLSX){ alert('ยังโหลด SheetJS ไม่สำเร็จ กรุณารีเฟรชหน้า'); return; }
  var file = input.files[0];
  if(!file) return;
  var status = document.getElementById('importExcelStatus');
  status.textContent = 'กำลังอ่านไฟล์...';

  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var wb = XLSX.read(e.target.result, {type:'array'});

      // หา sheet เงินคงเหลือประจำวัน
      var sheetName = wb.SheetNames.find(function(n){ return n.includes('เงินคงเหลือ'); });
      if(!sheetName) sheetName = wb.SheetNames[0];

      var ws   = wb.Sheets[sheetName];
      var data = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});

      // row 0 = header: ประเภท | เงินสด | เงินฝากธนาคาร | เงินฝากส่วนราชการผู้เบิก | รวม
      var COLS = ['เงินสด','เงินฝากธนาคาร','เงินฝากส่วนราชการผู้เบิก'];
      var rows = [];

      for(var r=1; r<data.length; r++){
        var row  = data[r];
        var name = row[0] ? String(row[0]).trim() : '';
        if(!name || name==='-') continue;

        // skip header/group rows (ไม่มีตัวเลขเลย)
        var hasVal = [row[1],row[2],row[3]].some(function(v){ return v!==null && v!=='-' && v!=='' && !isNaN(Number(v)); });
        if(!hasVal) continue;

        var fundId = _matchFund(name);
        [row[1],row[2],row[3]].forEach(function(val, ci){
          if(val===null || val==='-' || val==='' || isNaN(Number(val))) return;
          var amt = Number(val);
          if(amt===0) return;
          rows.push({
            fund_name:    name,
            fund_id:      fundId,
            holding_type: COLS[ci],
            amount:       amt,
            matched:      !!fundId
          });
        });
      }

      if(!rows.length){
        status.textContent = '❌ ไม่พบข้อมูลใน sheet "'+sheetName+'"';
        return;
      }

      IMPORT_EXCEL_ROWS = rows;
      _renderExcelPreview(rows, sheetName);
      var unmatched = rows.filter(function(r){ return !r.matched; }).length;
      status.textContent = 'พบ '+rows.length+' รายการ'+(unmatched?' (⚠️ ไม่จับคู่หมวด '+unmatched+' รายการ)':'');
      document.getElementById('importExcelConfirmBtn').style.display = 'inline-block';
    }catch(err){
      status.textContent = '❌ อ่านไฟล์ไม่ได้: '+err.message;
    }
  };
  reader.readAsArrayBuffer(file);
}

function _renderExcelPreview(rows, sheetName){
  var html = '<p style="font-size:11px;color:var(--muted);margin-bottom:8px">Sheet: <strong>'+sheetName+'</strong> — แสดง '+Math.min(rows.length,8)+'/'+rows.length+' รายการ</p>'+
    '<div style="overflow-x:auto"><table style="font-size:12px;width:100%">'+
    '<thead><tr style="background:var(--canvas)">'+
    '<th style="padding:5px 10px;text-align:left">หมวดเงิน (Excel)</th>'+
    '<th style="padding:5px 10px;text-align:left">จับคู่กับ</th>'+
    '<th style="padding:5px 10px;text-align:left">ที่เก็บเงิน</th>'+
    '<th style="padding:5px 10px;text-align:right">ยอดยกมา (บาท)</th>'+
    '</tr></thead><tbody>'+
    rows.slice(0,8).map(function(r){
      var cat    = r.fund_id ? FUND_CATEGORIES.find(function(f){ return f.id===r.fund_id; }) : null;
      var catTxt = cat ? '<span style="color:var(--up)">✅ '+cat.name+'</span>' : '<span style="color:var(--signal)">⚠️ ไม่พบ</span>';
      return '<tr style="border-top:1px solid rgba(0,0,0,.06)">'+
        '<td style="padding:5px 10px;font-size:11px">'+r.fund_name+'</td>'+
        '<td style="padding:5px 10px">'+catTxt+'</td>'+
        '<td style="padding:5px 10px">'+r.holding_type+'</td>'+
        '<td style="padding:5px 10px;text-align:right;font-family:var(--mono)">'+fmt(r.amount)+'</td>'+
        '</tr>';
    }).join('')+
    '</tbody></table></div>'+
    (rows.length>8?'<p style="font-size:11px;color:var(--muted);margin-top:6px">... และอีก '+(rows.length-8)+' รายการ</p>':'');
  document.getElementById('importExcelPreview').innerHTML = html;
}

// ---------- ยืนยัน import ----------
async function confirmExcelImport(){
  var matched = IMPORT_EXCEL_ROWS.filter(function(r){ return r.fund_id; });
  if(!matched.length){ alert('ไม่มีรายการที่จับคู่หมวดเงินได้'); return; }

  var date    = document.getElementById('importExcelDate').value;
  if(!date){ alert('กรุณาระบุวันที่ยอดยกมา'); return; }

  var btn    = document.getElementById('importExcelConfirmBtn');
  var status = document.getElementById('importExcelStatus');
  btn.disabled = true; btn.textContent = 'กำลังนำเข้า...';
  show('loadingOverlay','flex');

  var ok=0; var fail=0;
  for(var i=0; i<matched.length; i++){
    var r = matched[i];
    try{
      await POST('finance_transactions',{
        year_id:          CY,
        transaction_date: date,
        transaction_type: 'ยอดยกมา',
        fund_category_id: r.fund_id,
        holding_type:     r.holding_type,
        amount:           r.amount,
        description:      'ยอดยกมา (นำเข้าจาก Excel)',
        doc_no:           null,
        project_id:       null,
        remark:           'import: '+r.fund_name
      });
      ok++;
    }catch(e){ fail++; }
  }

  hide('loadingOverlay');
  btn.disabled=false; btn.textContent='นำเข้าข้อมูล';
  status.textContent = '✅ นำเข้าสำเร็จ '+ok+' รายการ'+(fail?' (ล้มเหลว '+fail+')':'');

  if(ok>0){
    FINANCE_LOADED = false;
    await loadFinanceData();
    setTimeout(closeImportExcelModal, 1500);
  }
}
