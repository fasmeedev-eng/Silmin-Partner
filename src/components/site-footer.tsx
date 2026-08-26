import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * ท้ายหน้าเป็นพื้นดำเหมือนแถบนำทาง — หน้าเว็บจึงถูกปิดหัวท้ายด้วยสีเดียวกัน
 * และต่อเนื่องจาก ClosingCta ที่เป็นพื้นดำอยู่แล้ว โดยคั่นด้วยเส้นบางแทนการเปลี่ยนสี
 *
 * ข้อมูลติดต่อแยกเป็นคอลัมน์ของตัวเอง มีหัวข้อ "ติดต่อเรา" กำกับ (ตรงกับลิงก์เดียวกันบนแถบนำทาง
 * ที่พาเลื่อนมาลงเอยตรงนี้) ทุกแถว (ที่อยู่/เบอร์โทร/เวลาทำการ/อีเมล) ใช้ไวยากรณ์เดียวกัน —
 * ไอคอนทองซ้าย + ตัวหนังสือขาว ไม่มีแถวไหนเป็นปุ่มทึบแยกแบบ (เคยลองปุ่มแดงกับเบอร์โทรแล้ว
 * แต่ทำให้แถวเดียวเด่นกว่าเพื่อนจนดูเหมือนคนละชุดข้อมูล จึงปรับกลับให้เข้าแนวเดียวกันทั้งคอลัมน์)
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
          </div>

          {/* TODO: แทนที่เบอร์/อีเมลด้วยช่องทางติดต่อจริงก่อนขึ้นใช้งาน (ที่อยู่เป็นของจริงแล้ว) */}
          <div>
            <h2 className="text-fine font-semibold uppercase tracking-wide text-white/45">
              ติดต่อเรา
            </h2>

            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.9} />
                <span className="max-w-[32ch] text-body leading-[1.62] text-white">
                  883 ถ.สิโรรส ต.สะเตง อ.เมือง จ.ยะลา 95000
                </span>
              </li>

              <li className="flex items-start gap-3">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.9} />
                <a
                  href="tel:073729615"
                  className="text-body font-medium tabular-nums text-white transition-colors hover:text-gold"
                >
                  073-729615
                </a>
              </li>

              <li className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.9} />
                <span className="text-body text-white">จันทร์–เสาร์ 09:30–19:30</span>
              </li>

              <li>
                <a
                  href="mailto:partner@silmin.co.th"
                  className="inline-flex items-center gap-2.5 text-body font-medium text-white transition-colors hover:text-gold"
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
          © {new Date().getFullYear()} SG PLUS. สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
}
