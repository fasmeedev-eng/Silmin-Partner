/**
 * วงกลมดำพร้อมตัวย่อชื่อร้าน
 *
 * มีไว้ให้กวาดตาหาแถวที่ต้องการ ไม่ได้ให้ข้อมูลใหม่ — ชื่อร้านเต็มอยู่ข้าง ๆ อยู่แล้ว
 * จึงเป็น aria-hidden ทั้งก้อน เครื่องอ่านหน้าจอไม่ต้องอ่านชื่อร้านซ้ำสองรอบ
 *
 * ตัวย่อคือคำแรกของชื่อร้าน ไม่ใช่อักษรตัวแรกตัวเดียว เพราะร้านไทยจำนวนมาก
 * ขึ้นต้นด้วยคำเดียวกัน ("ร้าน…") แล้ววงกลมทุกใบจะเหมือนกันหมดจนไร้ประโยชน์
 */

const MAX_CHARS = 5;

/** ขนาดตัวอักษรลดตามจำนวนตัวอักษร ไม่งั้นตัวย่อห้าตัวจะล้นวงกลม */
const SIZE_BY_LENGTH: Record<number, string> = {
  1: "text-[16px]",
  2: "text-[15px]",
  3: "text-[13px]",
  4: "text-[11px]",
  5: "text-[10px]",
};

function initialsOf(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const trimmed = [...first].slice(0, MAX_CHARS).join("");
  // ตัดเครื่องหมายวรรคตอนท้ายทิ้ง — "Easy.Care" ตัดห้าตัวได้ "Easy." ซึ่งอ่านเหมือนพิมพ์ค้าง
  return trimmed.replace(/[^\p{L}\p{N}]+$/u, "") || trimmed || "?";
}

/**
 * ขาวหรือทองสลับกันไปตามชื่อ — เป็นของตกแต่งล้วน ไม่ได้เข้ารหัสสถานะอะไรไว้
 * ทั้งสองสีอยู่ในพาเลตต์และคอนทราสต์บนพื้นดำผ่านทั้งคู่ (ขาว ~19:1, ทอง ~11:1)
 * ที่ต้องคงที่ต่อชื่อคือเพื่อให้ร้านเดิมมีวงกลมสีเดิมทุกวัน ไม่ใช่สุ่มใหม่ทุกครั้งที่โหลด
 */
function toneOf(name: string): string {
  let sum = 0;
  for (const char of name) sum = (sum + char.codePointAt(0)!) % 1024;
  return sum % 2 === 0 ? "text-white" : "text-gold";
}

export function ShopAvatar({ name }: { name: string }) {
  const initials = initialsOf(name);
  return (
    <span
      aria-hidden
      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-nav font-bold uppercase ${SIZE_BY_LENGTH[initials.length] ?? "text-[10px]"} ${toneOf(name)}`}
    >
      {initials}
    </span>
  );
}
