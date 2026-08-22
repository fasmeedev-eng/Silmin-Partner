/**
 * เปลี่ยนบทบาทของผู้ใช้ใน MongoDB
 * ใช้: node scripts/set-role.mjs <email> <customer|employee|admin>
 *
 * ระบบไม่มีหน้า UI สำหรับแก้บทบาทโดยเจตนา — บทบาทเปลี่ยนที่ฐานข้อมูลเท่านั้น
 * สคริปต์นี้เป็นแค่ทางลัดที่ปลอดภัยกว่าการพิมพ์ query เอง (กันพิมพ์ค่าที่ไม่มีอยู่จริง)
 * การเปลี่ยนมีผลภายใน 30 วินาที ผู้ใช้ไม่ต้องออกจากระบบแล้วเข้าใหม่
 */
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

const ROLES = ["customer", "employee", "admin"];

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

const [email, role] = process.argv.slice(2);

if (!email || !role) {
  console.error("ใช้: node scripts/set-role.mjs <email> <customer|employee|admin>");
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error(`บทบาทต้องเป็นหนึ่งใน: ${ROLES.join(", ")}`);
  process.exit(1);
}

const client = new MongoClient(env("MONGO_URI"));
await client.connect();
const users = client.db().collection("users");

const before = await users.findOne({ email });
if (!before) {
  console.error(`ไม่พบผู้ใช้ ${email} — ต้องเข้าสู่ระบบด้วย Google อย่างน้อยหนึ่งครั้งก่อน`);
  await client.close();
  process.exit(1);
}

await users.updateOne({ email }, { $set: { role, updatedAt: new Date() } });

console.log(`${email}: ${before.role} → ${role}`);
console.log("มีผลภายใน 30 วินาที (แคชบทบาทในหน่วยความจำ) ไม่ต้องออกจากระบบ");

await client.close();
