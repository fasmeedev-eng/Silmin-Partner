import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { guardPartnerAccess } from "@/lib/auth/guard";

/**
 * พื้นที่พาร์ทเนอร์ — เปิดให้ร้านที่มีใบสมัครถึงสถานะ ActivePartner แล้วเท่านั้น (admin เข้าได้เสมอ)
 * ดู guardPartnerAccess (src/lib/auth/guard.ts) — เดิมล็อกไว้ให้ admin อย่างเดียวเป็นตำแหน่งชั่วคราว
 * ตอนที่ยังไม่มีฟีเจอร์อะไรอยู่หลังด่านนี้ ตอนนี้มีเครื่องคำนวณผ่อน (/partner/calculator) แล้ว
 * จึงเปลี่ยนเงื่อนไขตามที่ตั้งใจไว้แต่แรก — ส่วนระยะที่ 2 จริง (สัญญา/บัญชีธนาคาร) ยังไม่ได้สร้าง
 */
export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await guardPartnerAccess();

  if (!result.allowed) {
    if (result.reason === "unauthenticated") redirect("/login?callbackUrl=/partner");

    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[520px] flex-col justify-center px-6 py-16">
        <ShieldAlert aria-hidden className="size-8 text-ink-48" strokeWidth={1.5} />
        <h1 className="mt-6 text-h3">หน้านี้เปิดให้เฉพาะพาร์ทเนอร์</h1>
        <p className="mt-4 text-body text-ink-80">
          พื้นที่นี้เปิดให้เฉพาะร้านค้าที่เป็นพาร์ทเนอร์ใช้งานอยู่แล้วเท่านั้น
          หากใบสมัครของคุณยังอยู่ระหว่างตรวจสอบ กรุณารอผลก่อน
        </p>
        <Link
          href="/me"
          className="mt-8 inline-flex min-h-[52px] w-fit items-center rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
        >
          ดูสถานะใบสมัครของฉัน
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}
