/**
 * ตัวเชื่อม Google Drive — เรียก REST ตรง ไม่ใช้ googleapis
 * ไฟล์ถูกเขียนด้วยบัญชีบริษัทที่อยู่หลัง GOOGLE_REFRESH_TOKEN ไม่ใช่บัญชีของผู้สมัคร
 * (คนละ OAuth client กับที่ใช้ล็อกอิน ดูหัวข้อ Intended integrations ใน CLAUDE.md)
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

let cachedToken: { value: string; expiresAt: number } | undefined;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} ไม่ได้ตั้งค่าไว้ใน .env`);
  return value;
}

/** access token มีอายุ 1 ชั่วโมง แคชไว้และเผื่อเวลาหมดอายุ 60 วินาที */
async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(`แลก refresh token ของ Drive ไม่สำเร็จ: ${payload.error_description ?? response.status}`);
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken.value;
}

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Drive API ตอบ ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

export async function findFolder(name: string, parentId: string): Promise<string | undefined> {
  // ชื่อโฟลเดอร์อาจมีอัญประกาศเดี่ยว ต้อง escape ก่อนใส่ในคิวรีของ Drive
  const safeName = name.replace(/'/g, "\\'");
  const query = `name='${safeName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `${API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const data = (await driveFetch(url).then((r) => r.json())) as { files?: DriveFile[] };
  return data.files?.[0]?.id;
}

export async function createFolder(name: string, parentId: string): Promise<string> {
  const data = (await driveFetch(`${API}/files?fields=id&supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      parents: [parentId],
      mimeType: "application/vnd.google-apps.folder",
    }),
  }).then((r) => r.json())) as { id: string };
  return data.id;
}

export async function uploadFile(input: {
  name: string;
  mimeType: string;
  parentId: string;
  body: ArrayBuffer;
}): Promise<DriveFile> {
  const boundary = `silmin${crypto.randomUUID().replace(/-/g, "")}`;
  const metadata = JSON.stringify({ name: input.name, parents: [input.parentId] });

  const payload = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    metadata,
    `\r\n--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`,
    input.body,
    `\r\n--${boundary}--\r\n`,
  ]);

  const data = (await driveFetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,size&supportsAllDrives=true`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: payload,
    },
  ).then((r) => r.json())) as DriveFile;

  return data;
}

/**
 * ย้ายและเปลี่ยนชื่อไฟล์โดยไม่อัปโหลดใหม่
 * ใช้ตอนใบสมัครถูกส่งจริง ไฟล์จาก _pending จะย้ายเข้าโฟลเดอร์หมวดพร้อมตั้งชื่อตามเลขที่ใบสมัคร
 */
export async function moveAndRename(
  fileId: string,
  newName: string,
  addParent: string,
  removeParent: string,
): Promise<void> {
  const params = new URLSearchParams({
    addParents: addParent,
    removeParents: removeParent,
    fields: "id",
    supportsAllDrives: "true",
  });
  await driveFetch(`${API}/files/${fileId}?${params}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  await driveFetch(`${API}/files/${fileId}?supportsAllDrives=true`, { method: "DELETE" });
}

/** ดึงเนื้อไฟล์มาเสิร์ฟผ่านพร็อกซีของเรา ไฟล์บน Drive จึงไม่ต้องเปิดสาธารณะ */
export async function downloadFile(fileId: string): Promise<Response> {
  return driveFetch(`${API}/files/${fileId}?alt=media&supportsAllDrives=true`);
}
