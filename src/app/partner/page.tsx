import Link from "next/link";

export const metadata = { title: "พื้นที่พาร์ทเนอร์" };

export default function PartnerPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[560px] flex-col justify-center px-6 py-20">
      <h1 className="text-h3">พื้นที่พาร์ทเนอร์ (ระยะที่ 2)</h1>
      <p className="mt-4 text-body text-ink-80">
        ส่วนสัญญา บัญชีธนาคาร และข้อมูลผู้มีอำนาจ ยังไม่ได้สร้าง
      </p>
      <Link
        href="/"
        className="mt-8 self-start text-body text-accent-ink underline underline-offset-4"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
