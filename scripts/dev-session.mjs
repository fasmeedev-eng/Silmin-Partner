/**
 * ออกคุกกี้ session สำหรับทดสอบบนเครื่องตัวเองเท่านั้น
 * ใช้: node scripts/dev-session.mjs <email>
 *
 * มีไว้เพื่อทดสอบหน้าที่ต้องล็อกอินโดยไม่ต้องวิ่งผ่าน Google ทุกครั้ง
 * อ่าน _id จริงจาก MongoDB แล้วเซ็นด้วย AUTH_SECRET ของโปรเจกต์
 * ห้ามใช้กับเซิร์ฟเวอร์จริง และห้ามส่งค่าที่ได้ให้ใคร — มันคือ session ที่ใช้เข้าระบบได้จริง
 */
import { encode } from "@auth/core/jwt";
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

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

const email = process.argv[2];
if (!email) {
  console.error("ใช้: node scripts/dev-session.mjs <email>");
  process.exit(1);
}

const client = new MongoClient(env("MONGO_URI"));
await client.connect();
const user = await client.db().collection("users").findOne({ email });
await client.close();

if (!user) {
  console.error(`ไม่พบผู้ใช้ ${email} ใน MongoDB — ต้องเข้าสู่ระบบด้วย Google อย่างน้อยหนึ่งครั้งก่อน`);
  process.exit(1);
}

const cookieName = "authjs.session-token";
const token = await encode({
  salt: cookieName,
  secret: env("AUTH_SECRET"),
  token: {
    uid: user._id.toString(),
    sub: user.googleId,
    name: user.name ?? "",
    email: user.email,
    picture: user.image ?? "",
  },
  maxAge: 60 * 60,
});

console.log(`ผู้ใช้ : ${user.email}  role=${user.role}`);
console.log(`คุกกี้ : ${cookieName}`);
console.log(token);
