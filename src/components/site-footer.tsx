import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * ท้ายหน้าเป็นพื้นดำเหมือนแถบนำทาง — หน้าเว็บจึงถูกปิดหัวท้ายด้วยสีเดียวกัน
 * และต่อเนื่องจาก ClosingCta ที่เป็นพื้นดำอยู่แล้ว โดยคั่นด้วยเส้นบางแทนการเปลี่ยนสี
 */
export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="scroll-mt-20 border-t border-white/[0.08] bg-nav text-white/70"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-10">
          <div>
            <BrandLogo tone="dark" />

            {/* TODO: แทนที่ด้วยช่องทางติดต่อจริงก่อนขึ้นใช้งาน */}
            <ul className="mt-6 space-y-3">
              <li>
                <a
                  href="tel:020000000"
                  className="inline-flex items-center gap-3 text-caption text-white/70 transition-colors hover:text-white"
                >
                  <Phone aria-hidden className="size-4 shrink-0 text-gold" strokeWidth={1.9} />
                  073-729615
                  <span className="text-white/35">จันทร์–เสาร์ 09:30–19:30</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:partner@silmin.co.th"
                  className="inline-flex items-center gap-3 text-caption text-white/70 transition-colors hover:text-white"
                >
                  <Mail aria-hidden className="size-4 shrink-0 text-gold" strokeWidth={1.9} />
                  partner@silmin.co.th
                </a>
              </li>
            </ul>
          </div>

          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-caption">
            <li>
              <Link
                href="/privacy"
                className="text-white/70 transition-colors hover:text-white"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-white/70 transition-colors hover:text-white"
              >
                ข้อกำหนดการใช้งาน
              </Link>
            </li>
          </ul>
        </div>

        <p className="mt-12 border-t border-white/[0.08] pt-7 text-fine text-white/35">
          © {new Date().getFullYear()} SG. สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
}
