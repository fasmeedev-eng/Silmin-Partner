/**
 * ย้ายชื่อบทบาทเดิมมาเป็นชุดใหม่
 *   user  → customer  (ลูกค้า)
 *   sales → employee  (พนักงานร้าน)
 *   admin → admin     (แอดมิน — ไม่เปลี่ยน)
 *
 * ใช้: node scripts/migrate-roles.mjs [--apply]
 * ไม่ใส่ --apply จะแสดงว่าจะเปลี่ยนอะไรบ้างโดยไม่เขียนจริง
 *
 * รันซ้ำได้ไม่เสียหาย เพราะกรองเฉพาะเอกสารที่ยังใช้ชื่อเก่าอยู่
 * ต้องรันหลังเปลี่ยนโค้ด ไม่งั้นบัญชีที่ role ยังเป็น "user" จะไม่ตรงกับบทบาทใดเลย
 */
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

const MAPPING = { user: "customer", sales: "employee" };

function env(key) {
  for (const file of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    const line = fs
      .readFileSync(full, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).replace(/^["']|["']$/g, "");
  }
  return undefined;
}

const apply = process.argv.includes("--apply");
const client = new MongoClient(env("MONGO_URI"));
await client.connect();
const users = client.db().collection("users");

let total = 0;
for (const [from, to] of Object.entries(MAPPING)) {
  const affected = await users.countDocuments({ role: from });
  total += affected;
  if (affected === 0) {
    console.log(`${from.padEnd(6)} → ${to.padEnd(9)} ไม่มีเอกสารที่ต้องเปลี่ยน`);
    continue;
  }
  if (apply) {
    const result = await users.updateMany({ role: from }, { $set: { role: to } });
    console.log(`${from.padEnd(6)} → ${to.padEnd(9)} เปลี่ยนแล้ว ${result.modifiedCount} รายการ`);
  } else {
    console.log(`${from.padEnd(6)} → ${to.padEnd(9)} จะเปลี่ยน ${affected} รายการ`);
  }
}

if (!apply && total > 0) {
  console.log("\nยังไม่ได้เขียนจริง ใส่ --apply เพื่อยืนยัน");
}

console.log("\nสถานะปัจจุบัน:");
for (const u of await users
  .find({}, { projection: { email: 1, role: 1, active: 1 } })
  .toArray()) {
  console.log(`  ${u.email.padEnd(30)} role=${u.role} active=${u.active}`);
}

await client.close();
