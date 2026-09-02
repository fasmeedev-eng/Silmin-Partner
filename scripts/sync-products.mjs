/**
 * ตั้งชื่อและราคาสินค้าให้ตรงกับรายการจริงที่ผู้ใช้ส่งมา ทีละประเภท
 * ใช้: node scripts/sync-products.mjs [ipad|iphone] [--dry]     (ไม่ระบุ = ทุกประเภทในไฟล์นี้)
 *
 * ชื่อใน rows คัดลอกมาตามตัวอักษรจากรายการจริง รวมช่องว่างซ้อน ตัวพิมพ์ใหญ่ที่ผิดที่ ("IPhone")
 * และตัวสะกดที่ดูเหมือนพิมพ์พลาด (gan/gen, m5/m 5, Air7/Air8, 15pm/  15pm)
 * **ห้ามจัดระเบียบให้สวย** — รายการนี้คือแหล่งความจริง ไม่ใช่ร่างที่รอขัดเกลา
 * ที่ผ่านมาชื่อถูกดัดแปลงตอนกรอกเข้าระบบ ("IPhone 15pm" → "iPhone 15 Pro Max")
 * ซึ่งคือสิ่งที่สคริปต์นี้แก้กลับ ผู้ใช้สั่งไว้ชัดว่าต้องตรง 100%
 *
 * จับคู่ด้วย _id ไม่ใช่ชื่อ — จับด้วยชื่อไม่ได้เพราะชื่อคือสิ่งที่กำลังจะเปลี่ยน
 * และหลายคู่ต่างกันแค่ความจุ รันซ้ำได้ไม่มีผลข้างเคียง (เขียนทับด้วยค่าเดิม)
 *
 * ความจุไม่ถูกแตะ ระบบเก็บเป็น "128GB"/"1TB" ทั้งฐานข้อมูล ส่วนรายการจริงเขียน "128"/"1tb."
 * ซึ่งเป็นค่าเดียวกัน — แก้เฉพาะบางประเภทจะทำให้คอลัมน์ความจุมีสองรูปแบบปนกันในตารางเดียว
 */
import { MongoClient, ObjectId } from "mongodb";
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

/**
 * rows: [_id, ชื่อตามรายการจริง, ราคาจัด, มี OVER กำกับในรายการจริงหรือไม่]
 * deactivate: แถวซ้ำที่ต้องปิดใช้งาน
 *
 * ช่อง OVER เป็นตัว "ตรวจ" ไม่ใช่ตัว "แก้" — สคริปต์นี้เขียนแค่ชื่อกับราคาตามที่ผู้ใช้สั่ง
 * ถ้าสถานะบวกเพิ่มในฐานข้อมูลไม่ตรงกับรายการจริง จะเตือนขึ้นมาให้เห็น แล้วให้คนตัดสินใจ
 * การแก้กฎบวกเพิ่มต้องเขียนสองคอลเลกชันใน transaction (ดู updateProduct ใน lib/db/pricing.ts)
 * ซึ่งเกินขอบเขตของสคริปต์ที่แตะ products อย่างเดียว และควรทำผ่านฟอร์มหลังบ้าน
 */
const GROUPS = {
  ipad: {
    label: "iPad มือ1 เครื่องไทย",
    rows: [
      ["6a968850f5f6e79945fd590c", "iPad mini 7 Wi-Fi th", 18500],
      ["6a96a26cf5f6e79945fd5948", "iPad gan 11 Wi-Fi th", 15900],
      ["6a96a26df5f6e79945fd594a", "iPad gan 11 Wi-Fi th", 18900],
      ["6a96a26ef5f6e79945fd594c", "iPad gen 11 sim th", 21900],
      ["6a96a26ff5f6e79945fd594e", "iPad gen 11 sim th", 25900],
      ["6a96a26ff5f6e79945fd5950", "Air 5 Wi-Fi", 9500],
      ["6a96a270f5f6e79945fd5952", "Air 5 Wi-Fi", 12500],
      ["6a96a271f5f6e79945fd5954", "Air 6 m2 13 Wi-Fi", 23000],
      ["6a96a272f5f6e79945fd5956", "new Air7  M3 11 Wi-Fi th", 0],
      ["6a96a273f5f6e79945fd5958", "new Air7  M3", 24900],
      ["6a96a274f5f6e79945fd595a", "new Air7 M3 11 sim  th", 26500],
      ["6a96a274f5f6e79945fd595c", "new Air7 M3 13 Wi-Fi th", 26000],
      ["6a96a275f5f6e79945fd595e", "iPad pro 11 m4 WiFi th", 33000],
      ["6a96a276f5f6e79945fd5960", "iPad pro m5 11 Wi-Fi", 36000],
      ["6a96a276f5f6e79945fd5962", "iPad pro m5 11 Wi-Fi", 44000],
      ["6a96a277f5f6e79945fd5964", "iPad pro m 5 11 sim", 45000],
      ["6a96a278f5f6e79945fd5966", "Air8 m4 wifi", 25900],
      ["6a96a278f5f6e79945fd5968", "Air8 m4 wifi", 29900],
      ["6a96a279f5f6e79945fd596a", "Air8 m4 wifi", 0],
      ["6a96a27af5f6e79945fd596c", "Air8 m4 wifi", 0],
      ["6a96a27bf5f6e79945fd596e", 'Air8 m4 13" wifi', 34900],
      ["6a96a27bf5f6e79945fd5970", 'Air8 m4 13" wifi', 38900],
      ["6a96a27cf5f6e79945fd5972", "11-inch iPad Air M4 Wi-Fi + Cellular", 33900],
      ["6a96a27cf5f6e79945fd5974", "11-inch iPad Air M4 Wi-Fi + Cellular", 37900],
      ["6a96a27df5f6e79945fd5976", "13-inch iPad Air M4 Wi-Fi + Cellular", 40900],
      ["6a96a27ef5f6e79945fd5978", "13-inch iPad Air M4 Wi-Fi + Cellular", 44900],
    ],
    // เคยปิดใช้งาน 6a9794b3a6e72b47c33a6cb8 (iPad mini 7 Wi-Fi th / 128 / 18500) เพราะซ้ำกับแถวแรก
    // ทุกช่อง แล้วผู้ใช้เปิดคืนเองจากหลังบ้าน จึงถอดออกจากรายการนี้ — สคริปต์ที่รันซ้ำแล้วไปกลับ
    // การตัดสินใจที่คนเพิ่งทำด้วยมือ อันตรายกว่าแถวซ้ำหนึ่งแถว
    deactivate: [],
  },

  iphone: {
    label: "iPhone มือ1 เครื่องไทย",
    rows: [
      ["6a965a76f5f6e79945fd58f8", "IPhone 13", 16900],
      ["6a968812f5f6e79945fd590a", "IPhone 14", 18500],
      ["6a969e88f5f6e79945fd5916", "IPhone 15", 23500],
      ["6a969e89f5f6e79945fd5918", "IPhone  15plus", 28500],
      ["6a969e89f5f6e79945fd591a", "IPhone 15pro", 31000],
      ["6a969e8af5f6e79945fd591c", "IPhone 15pro", 32000],
      ["6a969e8bf5f6e79945fd591e", "IPhone 15pm", 39000],
      ["6a969e8cf5f6e79945fd5920", "IPhone 15pm", 40500],
      ["6a969e8cf5f6e79945fd5922", "IPhone  15pm", 44000],
      ["6a969e8df5f6e79945fd5924", "IPhone 16", 26900],
      ["6a969e8df5f6e79945fd5926", "IPhone 16", 31000],
      ["6a969e8ef5f6e79945fd5928", "IPhone 16e", 21000],
      ["6a969e8ef5f6e79945fd592a", "IPhone 16plus", 30000],
      ["6a969e8ff5f6e79945fd592c", "IPhone 16plus", 34500],
      ["6a969e8ff5f6e79945fd592e", "IPhone 16pro", 33000],
      ["6a969e90f5f6e79945fd5930", "IPhone 16pro", 36000],
      ["6a969e91f5f6e79945fd5932", "IPhone  16pm", 41000],
      ["6a969e91f5f6e79945fd5934", "IPhone 16pm", 44500],
      ["6a969e92f5f6e79945fd5936", "IPhone 17", 29900],
      ["6a969e92f5f6e79945fd5938", "IPhone 17", 35900],
      ["6a969e93f5f6e79945fd593a", "IPhone 17 air", 30900],
      ["6a969e93f5f6e79945fd593c", "IPhone 17 pro", 41900],
      ["6a969e94f5f6e79945fd593e", "IPhone 17 pm", 46900],
      ["6a969e94f5f6e79945fd5940", "IPhone 17 pm", 53500],
      ["6a969e95f5f6e79945fd5942", "IPhone 17pm", 61500],
      ["6a969e95f5f6e79945fd5944", "IPhone 17pm", 71500],
    ],
    deactivate: [],
  },

  iphone2: {
    label: "iPhone มือ2 เครื่องไทย",
    rows: [
      ["6a9688aef5f6e79945fd590e", "iPhone12", 7000, true],
      ["6a96a39bf5f6e79945fd597a", "iPhone 12", 7500, true],
      ["6a96a39bf5f6e79945fd597c", "Iphonr 12", 8000, true],
      ["6a96a39cf5f6e79945fd597e", "iPhone 12pro", 11000, true],
      ["6a96a39cf5f6e79945fd5980", "iPhone 12pro", 12000, true],
      ["6a96a39df5f6e79945fd5982", "iPhone 12pm", 13000, true],
      ["6a96a39df5f6e79945fd5984", "iPhone 12pm", 14000, true],
      ["6a96a39ef5f6e79945fd5986", "Iphone 12pm", 15000, true],
      ["6a96a39ef5f6e79945fd5988", "iPhone 13", 11000],
      ["6a96a39ff5f6e79945fd598a", "Iphone 13", 12000],
      ["6a96a39ff5f6e79945fd598c", "Iphone 13", 13000],
      ["6a96a3a0f5f6e79945fd598e", "iPhone 13pro", 15000],
      ["6a96a3a0f5f6e79945fd5990", "Iphone 13pro", 16000],
      ["6a96a3a1f5f6e79945fd5992", "Iphone 13pro", 17000],
      ["6a96a3a1f5f6e79945fd5994", "Iphone 13pro", 18000],
      ["6a96a3a2f5f6e79945fd5996", "iPhone 13pm", 17000],
      ["6a96a3a2f5f6e79945fd5998", "iPhone 13pm", 19000],
      ["6a96a3a3f5f6e79945fd599a", "Iphone 13pm", 21000],
      ["6a96a3a3f5f6e79945fd599c", "Iphone 13pm", 23000],
      ["6a96a3a4f5f6e79945fd599e", "iPhone14", 14000],
      ["6a96a3a4f5f6e79945fd59a0", "Iphone14", 16000],
      ["6a96a3a5f5f6e79945fd59a2", "Iphone14", 18000],
      ["6a96a3a5f5f6e79945fd59a4", "iPhone14plus", 17000],
      ["6a96a3a6f5f6e79945fd59a6", "Iphone14plus", 19000],
      ["6a96a3a7f5f6e79945fd59a8", "Iphone 14plus", 21000],
      ["6a96a3a7f5f6e79945fd59aa", "iPhone14pro", 18000],
      ["6a96a3a8f5f6e79945fd59ac", "Iphone14pro", 20000],
      ["6a96a3a9f5f6e79945fd59ae", "Iphone14pro", 22000],
      ["6a96a3a9f5f6e79945fd59b0", "Iphone14pro", 24000],
      ["6a96a3aaf5f6e79945fd59b2", "iPhone14pm", 21000],
      ["6a96a3aaf5f6e79945fd59b4", "iPhone 14pm", 23000],
      ["6a96a3abf5f6e79945fd59b6", "Iphone 14pm", 25000],
      ["6a96a3abf5f6e79945fd59b8", "Iphone 14pm", 27000],
      ["6a96a3acf5f6e79945fd59ba", "iPhone15", 17000],
      ["6a96a3acf5f6e79945fd59bc", "iPhone 15", 20000],
      ["6a96a3adf5f6e79945fd59be", "Iphone 15", 23000],
      ["6a96a3adf5f6e79945fd59c0", "iPhone15plus", 19000],
      ["6a96a3aef5f6e79945fd59c2", "Iphone15plus", 22000],
      ["6a96a3aef5f6e79945fd59c4", "Iphone15plus", 25000],
      ["6a96a3aff5f6e79945fd59c6", "iPhone 15pro", 23000],
      ["6a96a3aff5f6e79945fd59c8", "iPhone 15pro", 26000],
      ["6a96a3b0f5f6e79945fd59ca", "Iphone 15pro", 29000],
      ["6a96a3b0f5f6e79945fd59cc", "Iphone 15pro", 32000],
      ["6a96a3b1f5f6e79945fd59ce", "iPhone 15pm", 28000],
      ["6a96a3b2f5f6e79945fd59d0", "iPhone 15pm", 31000],
      ["6a96a3b2f5f6e79945fd59d2", "Iphone 15pm", 34000],
      ["6a96a3b3f5f6e79945fd59d4", "iPhone 16", 22000],
      ["6a96a3b4f5f6e79945fd59d6", "Iphone 16", 24000],
      ["6a96a3b4f5f6e79945fd59d8", "Iphone 16e", 16000],
      ["6a96a3b5f5f6e79945fd59da", "iPhone 16plus", 24000],
      ["6a96a3b6f5f6e79945fd59dc", "Iphone 16plus", 27000],
      ["6a96a3b6f5f6e79945fd59de", "iPhone 16pro", 27000],
      ["6a96a3b7f5f6e79945fd59e0", "Iphone 16pro", 30000],
      ["6a96a3b7f5f6e79945fd59e2", "Iphone16pm", 35000],
      ["6a96a3b8f5f6e79945fd59e4", "Iphone16pm", 38000],
      ["6a96a3b8f5f6e79945fd59e6", "Iphone 17", 26000],
      ["6a96a3b9f5f6e79945fd59e8", "Iphone 17 air", 26000],
      ["6a96a3baf5f6e79945fd59ea", "Iphone 17 pro", 37000],
      ["6a96a3baf5f6e79945fd59ec", "Iphone 17 pm", 41500],
      ["6a96a3bbf5f6e79945fd59ee", "Iphone 17 pm", 46500],
      ["6a96a3bbf5f6e79945fd59f0", "Iphone 17pm", 57000],
      ["6a96a3bcf5f6e79945fd59f2", "Iphone 17pm", 71000],
    ],
    deactivate: [],
  },

  ipad2: {
    label: "Ipad มือ2 เครื่องไทย",
    // รายการจริงชุดนี้เรียงไม่ตรงกับลำดับในฐานข้อมูล (เรียงความจุแบบสตริง: 1TB, 256GB, 2TB, 512GB)
    // จึงจับคู่ทีละแถวด้วยรุ่น+ความจุตอนสร้างรายการนี้ ไม่ใช่จับตามลำดับบรรทัด
    rows: [
      ["6a96a56bf5f6e79945fd59f4", "Ipad gen11 128wifi", 10000],
      ["6a96a56bf5f6e79945fd59f6", "ipad air4 wifi", 8000],
      ["6a96a56df5f6e79945fd59fe", "Ipad air 5th gen 2022 wifi+cellular", 13900],
      ["6a96a56df5f6e79945fd59fc", "Ipad air 5th gen 2022 wifi+cellular", 12900],
      ["6a96a56cf5f6e79945fd59fa", "Ipad air 5th gen 2022 wifi", 12900],
      ["6a96a56cf5f6e79945fd59f8", "Ipad air 5th gen 2022 wifi", 10500],
      ["6a96a570f5f6e79945fd5a06", "Ipad air 11 m2 4th gen2024 wifi+cellular", 17900],
      ["6a96a573f5f6e79945fd5a0c", "Ipad air 11 m2 4th gen2024 wifi+cellular", 21400],
      ["6a96a571f5f6e79945fd5a08", "Ipad air 11 m2 4th gen2024 wifi+cellular", 18900],
      ["6a96a572f5f6e79945fd5a0a", "Ipad air 11 m2 4th gen2024 wifi+cellular", 20400],
      ["6a96a56ef5f6e79945fd5a00", "Ipad air 11 m2 4th gen2024 wifi", 14900],
      ["6a96a56ff5f6e79945fd5a02", "Ipad air 11 m2 4th gen2024 wifi", 15900],
      ["6a96a570f5f6e79945fd5a04", "Ipad air 11 m2 4th gen2024 wifi", 16900],
      ["6a96a575f5f6e79945fd5a14", "Ipad air 11 m3 4th  wifi+cellular", 19000],
      ["6a96a575f5f6e79945fd5a16", "Ipad air 11 m3 4th  wifi+cellular", 21000],
      ["6a96a576f5f6e79945fd5a18", "Ipad air 11 m3 4th  wifi+cellular", 24000],
      ["6a96a573f5f6e79945fd5a0e", "Ipad air 11 m3 4th  wifi", 16000],
      ["6a96a574f5f6e79945fd5a10", "Ipad air 11 m3 4th  wifi", 18000],
      ["6a96a574f5f6e79945fd5a12", "Ipad air 11 m3 4th  wifi", 21000],
      ["6a96a579f5f6e79945fd5a20", "iPad Air 11-inch (M4) Wi-Fi+cellular", 22000],
      ["6a96a579f5f6e79945fd5a22", "iPad Air 11-inch (M4) Wi-Fi+cellular", 26000],
      ["6a96a57af5f6e79945fd5a24", "iPad Air 11-inch (M4) Wi-Fi+cellular", 32000],
      ["6a96a576f5f6e79945fd5a1a", "iPad Air 11-inch (M4) Wi-Fi", 19000],
      ["6a96a577f5f6e79945fd5a1c", "iPad Air 11-inch (M4) Wi-Fi", 23000],
      ["6a96a578f5f6e79945fd5a1e", "iPad Air 11-inch (M4) Wi-Fi", 29000],
      ["6a96a57ef5f6e79945fd5a2e", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi + Cellular", 22900],
      ["6a96a580f5f6e79945fd5a34", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi + Cellular", 28900],
      ["6a96a57ff5f6e79945fd5a30", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi + Cellular", 23900],
      ["6a96a57ff5f6e79945fd5a32", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi + Cellular", 25900],
      ["6a96a57bf5f6e79945fd5a26", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi", 21900],
      ["6a96a57df5f6e79945fd5a2c", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi", 26900],
      ["6a96a57cf5f6e79945fd5a28", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi", 22900],
      ["6a96a57df5f6e79945fd5a2a", "IPAD Air 13 M2 1st GEN (2024) Wi-Fi", 23900],
      ["6a96a582f5f6e79945fd5a3c", "Ipad air 13 m3  wifi+cellular", 25000],
      ["6a96a583f5f6e79945fd5a3e", "Ipad air 13 m3  wifi+cellular", 27000],
      ["6a96a584f5f6e79945fd5a40", "Ipad air 13 m3  wifi+cellular", 29000],
      ["6a96a580f5f6e79945fd5a36", "Ipad air 13 m3   wifi", 22000],
      ["6a96a581f5f6e79945fd5a38", "Ipad air 13 m3   wifi", 24000],
      ["6a96a582f5f6e79945fd5a3a", "Ipad air 13 m3  wifi", 26000],
      ["6a96a587f5f6e79945fd5a48", "Ipad air 13 m4  wifi+cellular", 31000],
      ["6a96a588f5f6e79945fd5a4a", "Ipad air 13 m4  wifi+cellular", 35000],
      ["6a96a589f5f6e79945fd5a4c", "Ipad air 13 m4  wifi+cellular", 41000],
      ["6a96a585f5f6e79945fd5a42", "Ipad air 13 m4   wifi", 26000],
      ["6a96a585f5f6e79945fd5a44", "Ipad air 13 m4   wifi", 30000],
      ["6a96a586f5f6e79945fd5a46", "Ipad air 13 m4  wifi", 36000],
      ["6a96a58bf5f6e79945fd5a54", "IPAD MINI 7 (2024) Wi-Fi + Cellular", 15900],
      ["6a96a58cf5f6e79945fd5a56", "IPAD MINI 7 (2024) Wi-Fi + Cellular", 17300],
      ["6a96a58df5f6e79945fd5a58", "IPAD MINI 7 (2024) Wi-Fi + Cellular", 18700],
      ["6a96a589f5f6e79945fd5a4e", "IPAD MINI 7 (2024) Wi-Fi", 12900],
      ["6a96a58af5f6e79945fd5a50", "IPAD MINI 7 (2024) Wi-Fi", 13900],
      ["6a96a58bf5f6e79945fd5a52", "IPAD MINI 7 (2024) Wi-Fi", 14900],
      ["6a96a590f5f6e79945fd5a66", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi + Cellular", 32800],
      ["6a96a58ff5f6e79945fd5a62", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi + Cellular", 30000],
      ["6a96a591f5f6e79945fd5a68", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi + Cellular", 35600],
      ["6a96a590f5f6e79945fd5a64", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi + Cellular", 31400],
      ["6a96a58ef5f6e79945fd5a5e", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi", 32000],
      ["6a96a58df5f6e79945fd5a5a", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi", 27500],
      ["6a96a58ff5f6e79945fd5a60", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi", 35000],
      ["6a96a58ef5f6e79945fd5a5c", "IPAD PRO 11 M4 5th GEN (2024) Wi-Fi", 29000],
      ["6a96a595f5f6e79945fd5a76", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi + Cellular", 22900],
      ["6a96a597f5f6e79945fd5a7c", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi + Cellular", 27900],
      ["6a96a596f5f6e79945fd5a78", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi + Cellular", 24900],
      ["6a96a597f5f6e79945fd5a7e", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi + Cellular", 29900],
      ["6a96a596f5f6e79945fd5a7a", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi + Cellular", 25900],
      ["6a96a592f5f6e79945fd5a6c", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi", 18900],
      ["6a96a594f5f6e79945fd5a72", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi", 24900],
      ["6a96a593f5f6e79945fd5a6e", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi", 19900],
      ["6a96a595f5f6e79945fd5a74", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi", 26900],
      ["6a96a593f5f6e79945fd5a70", "IPAD PRO 11-inch 4th GEN (2022) Wi-Fi", 22900],
      ["6a96a59cf5f6e79945fd5a8a", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi + Cellular", 24900],
      ["6a96a59df5f6e79945fd5a90", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi + Cellular", 28900],
      ["6a96a59cf5f6e79945fd5a8c", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi + Cellular", 25900],
      ["6a96a59ef5f6e79945fd5a92", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi + Cellular", 30400],
      ["6a96a59df5f6e79945fd5a8e", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi + Cellular", 26900],
      ["6a96a598f5f6e79945fd5a80", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi", 23900],
      ["6a96a59af5f6e79945fd5a86", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi", 27900],
      ["6a96a599f5f6e79945fd5a82", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi", 24900],
      ["6a96a59bf5f6e79945fd5a88", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi", 29400],
      ["6a96a59af5f6e79945fd5a84", "IPAD PRO 12.9-inch 6th GEN (2022) Wi-Fi", 25900],
      ["6a96a5a2f5f6e79945fd5aa0", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi + Cellular", 47000],
      ["6a96a5a1f5f6e79945fd5a9c", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi + Cellular", 42500],
      ["6a96a5a3f5f6e79945fd5aa2", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi + Cellular", 50000],
      ["6a96a5a1f5f6e79945fd5a9e", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi + Cellular", 44000],
      ["6a96a5a0f5f6e79945fd5a98", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi", 44000],
      ["6a96a59ef5f6e79945fd5a94", "IPAD PRO 13 M4 7th GEN (2024) M4 Wi-Fi", 39500],
      ["6a96a5a0f5f6e79945fd5a9a", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi", 47000],
      ["6a96a59ff5f6e79945fd5a96", "IPAD PRO 13 M4 7th GEN (2024) Wi-Fi", 41000],
      ["6a96a592f5f6e79945fd5a6a", "IPAD PRO 11-inch M5 Wi-Fi", 34900],
    ],
    deactivate: [],
  },

  iphone3: {
    label: "iPhone มือ2 เครื่องนอก",
    // รายการจริงชุดนี้ไม่มี OVER กำกับแถวไหนเลย ต่างจากมือ2 เครื่องไทยที่ตระกูล 12 เป็น OVER ทั้งแปดแถว
    // จึงไม่ใส่ช่องที่สี่ให้แถวใด — ไม่ใช่ลืม แต่เพราะต้นทางไม่ได้ระบุ จึงไม่มีอะไรให้ตรวจ
    rows: [
      ["6a96a776f5f6e79945fd5aa4", "iPhone12", 6000],
      ["6a96a777f5f6e79945fd5aa6", "iPhone 12", 6500],
      ["6a96a777f5f6e79945fd5aa8", "Iphone 12", 7000],
      ["6a96a778f5f6e79945fd5aaa", "iPhone 12pro", 10000],
      ["6a96a779f5f6e79945fd5aac", "iPhone 12pro", 11000],
      ["6a96a779f5f6e79945fd5aae", "iPhone 12pm", 12000],
      ["6a96a77af5f6e79945fd5ab0", "iPhone 12pm", 13000],
      ["6a96a77bf5f6e79945fd5ab2", "Iphone 12pm", 14000],
      ["6a96a77cf5f6e79945fd5ab4", "iPhone 13", 10000],
      ["6a96a77cf5f6e79945fd5ab6", "Iphone 13", 11000],
      ["6a96a77df5f6e79945fd5ab8", "Iphone 13", 12000],
      ["6a96a77ef5f6e79945fd5aba", "iPhone 13pro", 14000],
      ["6a96a77ff5f6e79945fd5abc", "Iphone 13pro", 15000],
      ["6a96a77ff5f6e79945fd5abe", "Iphone 13pro", 16000],
      ["6a96a780f5f6e79945fd5ac0", "Iphone 13pro", 17000],
      ["6a96a780f5f6e79945fd5ac2", "iPhone 13pm", 16000],
      ["6a96a781f5f6e79945fd5ac4", "iPhone 13pm", 18000],
      ["6a96a782f5f6e79945fd5ac6", "Iphone 13pm", 20000],
      ["6a96a782f5f6e79945fd5ac8", "Iphone 13pm", 22000],
      ["6a96a783f5f6e79945fd5aca", "iPhone14", 12000],
      ["6a96a783f5f6e79945fd5acc", "Iphone14", 13000],
      ["6a96a784f5f6e79945fd5ace", "Iphone14", 15000],
      ["6a96a784f5f6e79945fd5ad0", "iPhone14plus", 13500],
      ["6a96a785f5f6e79945fd5ad2", "Iphone14plus", 14500],
      ["6a96a785f5f6e79945fd5ad4", "Iphone 14plus", 15500],
      ["6a96a786f5f6e79945fd5ad6", "iPhone14pro", 18000],
      ["6a96a787f5f6e79945fd5ad8", "Iphone14pro", 19000],
      ["6a96a788f5f6e79945fd5ada", "Iphone14pro", 20500],
      ["6a96a788f5f6e79945fd5adc", "Iphone14pro", 22000],
      ["6a96a789f5f6e79945fd5ade", "iPhone14pm", 18500],
      ["6a96a78af5f6e79945fd5ae0", "iPhone 14pm", 19500],
      ["6a96a78bf5f6e79945fd5ae2", "Iphone 14pm", 20500],
      ["6a96a78cf5f6e79945fd5ae4", "Iphone 14pm", 25000],
      ["6a96a78cf5f6e79945fd5ae6", "iPhone15", 16000],
      ["6a96a78df5f6e79945fd5ae8", "iPhone 15", 18500],
      ["6a96a78ef5f6e79945fd5aea", "Iphone 15", 21000],
      ["6a96a78ef5f6e79945fd5aec", "iPhone15plus", 18000],
      ["6a96a78ff5f6e79945fd5aee", "Iphone15plus", 21000],
      ["6a96a78ff5f6e79945fd5af0", "Iphone15plus", 24000],
      ["6a96a790f5f6e79945fd5af2", "iPhone 15pro", 21000],
      ["6a96a790f5f6e79945fd5af4", "iPhone 15pro", 23500],
      ["6a96a791f5f6e79945fd5af6", "Iphone 15pro", 25500],
      ["6a96a792f5f6e79945fd5af8", "Iphone 15pro", 29000],
      ["6a96a792f5f6e79945fd5afa", "iPhone 15pm", 23500],
      ["6a96a793f5f6e79945fd5afc", "iPhone 15pm", 25000],
      ["6a96a794f5f6e79945fd5afe", "Iphone 15pm", 29000],
      ["6a96a795f5f6e79945fd5b00", "iPhone 16", 19000],
      ["6a96a795f5f6e79945fd5b02", "Iphone 16", 23000],
      ["6a96a796f5f6e79945fd5b04", "Iphone 16e", 12000],
      ["6a96a796f5f6e79945fd5b06", "iPhone 16plus", 22000],
      ["6a96a797f5f6e79945fd5b08", "Iphone 16plus", 26500],
      ["6a96a798f5f6e79945fd5b0a", "iPhone 16pro", 24500],
      ["6a96a799f5f6e79945fd5b0c", "Iphone 16pro", 27000],
      ["6a96a799f5f6e79945fd5b0e", "Iphone16pm", 32000],
      ["6a96a79af5f6e79945fd5b10", "Iphone16pm", 35000],
    ],
    deactivate: [],
  },
};

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const picked = args.filter((a) => !a.startsWith("--"));
const groups = picked.length ? picked : Object.keys(GROUPS);

for (const key of groups) {
  if (!GROUPS[key]) {
    console.error(`ไม่รู้จักประเภท "${key}" — มีให้เลือก: ${Object.keys(GROUPS).join(", ")}`);
    process.exit(1);
  }
}

const uri = readEnv("MONGO_URI");
if (!uri) {
  console.error("ไม่พบ MONGO_URI ใน .env หรือ .env.local");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
await client.connect();
const products = client.db().collection("products");
const addonRules = client.db().collection("priceAddonRules");

let changed = 0;
let missing = 0;

for (const key of groups) {
  const group = GROUPS[key];
  console.log(`\n── ${group.label} (${key}) ──`);

  for (const [id, name, arrangedPrice, over] of group.rows) {
    const _id = new ObjectId(id);
    const current = await products.findOne({ _id });
    if (!current) {
      console.log(`  ไม่พบ  ${id}`);
      missing += 1;
      continue;
    }
    if (over !== undefined) {
      const rule = await addonRules.findOne({ productId: _id });
      const isOver = rule?.addonStatus === "over";
      if (isOver !== Boolean(over)) {
        console.log(
          `  ! สถานะบวกเพิ่มไม่ตรงรายการจริง  ${name} (${current.capacity})  ฐานข้อมูล=${rule?.addonStatus ?? "ไม่มีกฎ"} รายการจริง=${over ? "over" : "normal"}`,
        );
      }
    }

    if (current.name === name && current.arrangedPrice === arrangedPrice) {
      console.log(`  ตรงอยู่แล้ว  ${name} (${current.capacity})`);
      continue;
    }
    console.log(
      `  แก้  ${current.name} (${current.capacity}) = ${current.arrangedPrice}` +
        `  →  ${name} = ${arrangedPrice}`,
    );
    if (!dry) {
      await products.updateOne(
        { _id },
        { $set: { name, arrangedPrice, updatedAt: new Date() } },
      );
    }
    changed += 1;
  }

  for (const id of group.deactivate) {
    const _id = new ObjectId(id);
    const current = await products.findOne({ _id });
    if (!current) continue;
    if (current.status === "inactive") {
      console.log(`  ปิดอยู่แล้ว  ${current.name} (${current.capacity})`);
      continue;
    }
    console.log(`  ปิดใช้งาน (ซ้ำ)  ${current.name} (${current.capacity})`);
    if (!dry) {
      await products.updateOne(
        { _id },
        { $set: { status: "inactive", updatedAt: new Date() } },
      );
    }
    changed += 1;
  }
}

console.log(`\n${dry ? "[ทดลอง] " : ""}แก้ ${changed} รายการ, ไม่พบ ${missing} รายการ`);
await client.close();
