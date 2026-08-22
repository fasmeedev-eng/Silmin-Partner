/**
 * ตรวจการเชื่อมต่อ MongoDB จาก MONGO_URI ใน .env
 * ใช้: node scripts/check-db.mjs
 * อ่าน .env เองเพราะสคริปต์นี้รันนอก Next.js จึงไม่มีการโหลด env ให้อัตโนมัติ
 */
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

function readEnv(key) {
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

const uri = readEnv("MONGO_URI");
if (!uri) {
  console.error("ไม่พบ MONGO_URI ใน .env หรือ .env.local");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });

try {
  await client.connect();
  const db = client.db();
  console.log("เชื่อมต่อสำเร็จ");
  console.log("  ping        :", JSON.stringify(await db.admin().ping()));
  console.log("  database    :", db.databaseName);

  const cols = await db.listCollections().toArray();
  console.log(
    "  collections :",
    cols.length ? cols.map((c) => c.name).join(", ") : "(ยังไม่มี collection)",
  );

  if (cols.some((c) => c.name === "users")) {
    const users = db.collection("users");
    console.log("  users       :", await users.countDocuments(), "รายการ");
    const sample = await users
      .find({}, { projection: { email: 1, role: 1, active: 1 } })
      .limit(10)
      .toArray();
    for (const u of sample) {
      console.log(
        `    - ${u.email}  role=${u.role}  active=${u.active}  _id=${u._id}`,
      );
    }
  }
} catch (error) {
  console.error("เชื่อมต่อไม่สำเร็จ:", error.name);
  console.error(" ", String(error.message).split("\n")[0]);
  process.exitCode = 1;
} finally {
  await client.close();
}
