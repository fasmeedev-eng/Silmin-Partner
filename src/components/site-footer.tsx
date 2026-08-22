import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-parchment text-ink-80">
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <div>
            <p className="text-caption font-semibold text-ink">
              silmin<span className="pl-1.5 font-normal text-ink-48">partner</span>
            </p>
            {/* TODO: แทนที่ด้วยช่องทางติดต่อจริงก่อนขึ้นใช้งาน */}
            <p className="mt-3 text-fine">
              มีคำถามเรื่องใบสมัคร โทร 02-000-0000 (จันทร์–ศุกร์ 09:00–18:00) หรือ{" "}
              <a
                href="mailto:partner@silmin.co.th"
                className="text-accent-ink underline underline-offset-4"
              >
                partner@silmin.co.th
              </a>
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-fine">
            <li>
              <Link
                href="/privacy"
                className="text-accent-ink underline underline-offset-4"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-accent-ink underline underline-offset-4">
                ข้อกำหนดการใช้งาน
              </Link>
            </li>
          </ul>
        </div>

        <p className="mt-8 border-t border-hairline pt-5 text-fine text-ink-48">
          © {new Date().getFullYear()} Silmin. สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
}
