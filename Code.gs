/**
 * ค่ายเยาวชน...รักษ์พงไพร ไฮเทค — Backend (Google Apps Script)
 * ---------------------------------------------------------
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheets ใหม่ 1 ไฟล์ ตั้งชื่อว่าอะไรก็ได้
 * 2. สร้างแท็บ (sheet tab) 2 แท็บ ชื่อ "Groups" และ "Scores" (ตัวพิมพ์เล็ก-ใหญ่ต้องตรง)
 * 3. ไปที่เมนู Extensions > Apps Script วางโค้ดไฟล์นี้ทับของเดิมทั้งหมด
 * 4. กด Deploy > New deployment > เลือกประเภท "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. คัดลอก URL ที่ได้ (ลงท้ายด้วย /exec) ไปใส่ในไฟล์ config.js ของฝั่งเว็บ
 * 6. ทุกครั้งที่แก้โค้ดนี้ ต้องกด Deploy > Manage deployments > แก้ไข (ไอคอนดินสอ) > Version: New > Deploy ใหม่
 *    (แก้โค้ดอย่างเดียวโดยไม่ deploy ใหม่ เว็บจะยังเรียกใช้โค้ดเวอร์ชันเก่าอยู่)
 */

const SHEET_GROUPS = 'Groups';
const SHEET_SCORES = 'Scores';

// รายชื่อฐานทั้ง 5 ฐาน (ใช้ตรวจสอบว่ากลุ่มไหนผ่านครบทุกฐานแล้ว)
const BASES = [
  { id: 'base1', name: 'กู้ภัยพงไพร', icon: '⛰️' },
  { id: 'base2', name: 'รวมพลังพิทักษ์ป่า', icon: '🛡️' },
  { id: 'base3', name: 'ส่องสัตว์คู่ป่า', icon: '🐯' },
  { id: 'base4', name: 'ลุยป่า ฝ่าดงระเบิด', icon: '🤝❤️' },
  { id: 'base5', name: 'แยกขยะ สรรค์สร้างโลก', icon: '🌍✨' },
];

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getGroups') {
      return jsonOut({ ok: true, groups: getAllGroups() });
    }
    if (action === 'getScores') {
      return jsonOut({ ok: true, scores: getAllScores() });
    }
    if (action === 'getGroup') {
      const groupId = e.parameter.groupId;
      const group = getAllGroups().find(g => g.groupId === groupId);
      if (!group) return jsonOut({ ok: false, error: 'ไม่พบกลุ่มนี้ กรุณาตรวจสอบ QR Code อีกครั้ง' });
      const scores = getAllScores().filter(s => s.groupId === groupId);
      return jsonOut({ ok: true, group, scores, bases: BASES });
    }
    if (action === 'getDashboard') {
      return jsonOut({ ok: true, groups: getAllGroups(), scores: getAllScores(), bases: BASES });
    }
    return jsonOut({ ok: false, error: 'ไม่รู้จัก action นี้' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'addGroup') {
      return jsonOut(addGroup(body.groupName, body.members));
    }
    if (action === 'addScore') {
      return jsonOut(addOrUpdateScore(body.groupId, body.baseId, body.stars, body.comment, body.teacher));
    }
    if (action === 'deleteGroup') {
      return jsonOut(deleteGroup(body.groupId));
    }
    return jsonOut({ ok: false, error: 'ไม่รู้จัก action นี้' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// ---------- Groups ----------

function getGroupsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_GROUPS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_GROUPS);
    sheet.appendRow(['GroupID', 'GroupName', 'Members', 'CreatedAt']);
  }
  return sheet;
}

function getScoresSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SCORES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SCORES);
    sheet.appendRow(['Timestamp', 'GroupID', 'BaseID', 'Stars', 'Comment', 'Teacher']);
  }
  return sheet;
}

function getAllGroups() {
  const sheet = getGroupsSheet();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  return rows
    .filter(r => r[0])
    .map(r => ({
      groupId: String(r[0]),
      groupName: String(r[1]),
      members: String(r[2] || '').split(',').map(m => m.trim()).filter(Boolean),
      createdAt: r[3],
    }));
}

function addGroup(groupName, members) {
  if (!groupName) return { ok: false, error: 'กรุณาระบุชื่อกลุ่ม' };
  const sheet = getGroupsSheet();
  const groupId = 'G' + Utilities.formatDate(new Date(), 'GMT+7', 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
  const membersStr = Array.isArray(members) ? members.join(', ') : String(members || '');
  sheet.appendRow([groupId, groupName, membersStr, new Date()]);
  return { ok: true, groupId, groupName, members: membersStr.split(',').map(m => m.trim()).filter(Boolean) };
}

function deleteGroup(groupId) {
  const sheet = getGroupsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === groupId) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบกลุ่มนี้' };
}

// ---------- Scores ----------

function getAllScores() {
  const sheet = getScoresSheet();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  return rows
    .filter(r => r[1])
    .map(r => ({
      timestamp: r[0],
      groupId: String(r[1]),
      baseId: String(r[2]),
      stars: Number(r[3]) || 0,
      comment: String(r[4] || ''),
      teacher: String(r[5] || ''),
    }));
}

// บันทึกคะแนน — ถ้ากลุ่มนี้เคยได้คะแนนฐานนี้แล้ว จะ "อัปเดตทับ" แถวเดิมแทนการเพิ่มแถวใหม่
// ป้องกันการสแกนซ้ำแล้วนับคะแนนซ้ำ
function addOrUpdateScore(groupId, baseId, stars, comment, teacher) {
  if (!groupId || !baseId) return { ok: false, error: 'ข้อมูลไม่ครบ กรุณาสแกน QR ใหม่อีกครั้ง' };
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getScoresSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === groupId && String(data[i][2]) === baseId) {
        sheet.getRange(i + 1, 1, 1, 6).setValues([[new Date(), groupId, baseId, stars, comment, teacher]]);
        return { ok: true, updated: true };
      }
    }
    sheet.appendRow([new Date(), groupId, baseId, stars, comment, teacher]);
    return { ok: true, updated: false };
  } finally {
    lock.releaseLock();
  }
}

// ---------- Utility ----------

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
