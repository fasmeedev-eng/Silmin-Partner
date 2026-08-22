/**
 * ตรวจว่า refresh token ของ Google Drive ยังใช้ได้ และเข้าถึงโฟลเดอร์ปลายทางได้จริง
 * ใช้: node scripts/check-drive.mjs
 * เรียก REST ของ Google ตรง ๆ ไม่ต้องพึ่ง googleapis เพื่อให้เช็คได้ก่อนตัดสินใจติดตั้ง
 */
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

const clientId = env("GOOGLE_CLIENT_ID");
const clientSecret = env("GOOGLE_CLIENT_SECRET");
const refreshToken = env("GOOGLE_REFRESH_TOKEN");
const folderId = env("GOOGLE_DRIVE_FOLDER_ID");

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});
const token = await tokenRes.json();

if (!tokenRes.ok) {
  console.error("แลก refresh token ไม่สำเร็จ:", token.error, "-", token.error_description);
  process.exit(1);
}

console.log("refresh token ใช้ได้");
console.log("  scope     :", token.scope);
console.log("  อายุ token:", token.expires_in, "วินาที");

const auth = { Authorization: `Bearer ${token.access_token}` };

const about = await fetch(
  "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress),storageQuota(limit,usage)",
  { headers: auth },
).then((r) => r.json());
if (about.user) {
  console.log("  บัญชี     :", about.user.emailAddress);
  const q = about.storageQuota ?? {};
  if (q.limit) {
    const gb = (n) => (Number(n) / 1024 ** 3).toFixed(2);
    console.log(`  พื้นที่    : ใช้ไป ${gb(q.usage)} GB จาก ${gb(q.limit)} GB`);
  }
}

const folder = await fetch(
  `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,trashed&supportsAllDrives=true`,
  { headers: auth },
).then((r) => r.json());

if (folder.error) {
  console.error("เข้าถึงโฟลเดอร์ปลายทางไม่ได้:", folder.error.message);
  process.exitCode = 1;
} else {
  console.log("โฟลเดอร์ปลายทาง");
  console.log("  ชื่อ      :", folder.name);
  console.log("  ประเภท    :", folder.mimeType);
  console.log("  ถูกลบทิ้ง? :", folder.trashed ? "ใช่" : "ไม่");

  const children = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed=false`,
    )}&fields=files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: auth },
  ).then((r) => r.json());
  const names = (children.files ?? []).map((f) => f.name);
  console.log("  ข้างในมี  :", names.length ? names.join(", ") : "(ว่าง)");
}
