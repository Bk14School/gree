// ⚠️ ตั้งค่าจุดเดียว: วาง URL ของ Google Apps Script Web App ที่ตรงนี้
// วิธีหา URL: เปิด Apps Script > Deploy > Manage deployments > คัดลอกลิงก์ที่ลงท้ายด้วย /exec
const API_URL = 'https://script.google.com/macros/s/AKfycbwFuUTgf1S-sNSL9_2w3HoAYa5s2XyVOBfYJL93ynoPuetN7iGiLf5Ltxmrvds8bpU/exec';

// เรียก GET ไปยัง Apps Script
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

// เรียก POST ไปยัง Apps Script
// หมายเหตุ: ใช้ Content-Type: text/plain เพื่อเลี่ยงการทำ CORS preflight (OPTIONS)
// ซึ่ง Google Apps Script Web App ไม่รองรับ
async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// รายชื่อฐาน — ต้องตรงกับลำดับและ id ใน apps-script/Code.gs (BASES)
// แต่ละฐานมี "รหัสประจำฐาน" (station code) คงที่ 1 รหัส ใช้ยืนยันว่าครูกำลังให้คะแนนฐานไหน
// ถ้าจะแก้ชื่อฐาน/ไอคอน/รหัส ต้องแก้ทั้ง 2 ที่ให้ตรงกัน (ที่นี่ และใน apps-script/Code.gs)
const BASES_CLIENT = [
  { id: 'base1', num: 1, name: 'กู้ภัยพงไพร', icon: '⛰️', code: '1401' },
  { id: 'base2', num: 2, name: 'รวมพลังพิทักษ์ป่า', icon: '🛡️', code: '1402' },
  { id: 'base3', num: 3, name: 'ส่องสัตว์คู่ป่า', icon: '🐯', code: '1403' },
  { id: 'base4', num: 4, name: 'ลุยป่า ฝ่าดงระเบิด', icon: '🤝❤️', code: '1404' },
  { id: 'base5', num: 5, name: 'แยกขยะ สรรค์สร้างโลก', icon: '🌍✨', code: '1405' },
];

// ถอดรหัสฐาน (4 หลัก) กลับเป็นข้อมูลฐาน หรือ null ถ้าไม่พบ
function parseBaseCode(code) {
  const c = String(code).trim();
  return BASES_CLIENT.find(b => b.code === c) || null;
}

function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}
