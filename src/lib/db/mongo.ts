import { MongoClient, type Db } from "mongodb";

/**
 * ตัวเชื่อม MongoDB ตัวเดียวของทั้งแอป
 *
 * ตอน dev ไฟล์โมดูลถูกโหลดใหม่ทุกครั้งที่แก้โค้ด (HMR) ถ้าสร้าง MongoClient ใหม่ทุกรอบ
 * จำนวน connection จะพุ่งจนเซิร์ฟเวอร์ปฏิเสธ จึงเก็บ promise ไว้บน globalThis
 */
declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI ไม่ได้ตั้งค่าไว้ใน .env");
  }
  return new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 }).connect();
}

function clientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "production") {
    return (globalThis.__mongoClientPromise ??= connect());
  }
  globalThis.__mongoClientPromise ??= connect();
  return globalThis.__mongoClientPromise;
}

/** ฐานข้อมูลตามที่ระบุไว้ใน MONGO_URI */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db();
}
