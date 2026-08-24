import { Camera, ChevronDown } from "lucide-react";

/**
 * ภาพจำลองหน้าจอใบสมัครบนมือถือ — ประกอบจาก DOM ไม่ใช่ SVG หรือไฟล์ภาพ
 * เพื่อให้ตัวอักษรไทยเรนเดอร์ด้วยฟอนต์จริง (สระบน/วรรณยุกต์ล่างจึงวางถูกตำแหน่ง
 * ซึ่ง <text> ใน SVG ทำได้ไม่ดีนัก) และปรับตามความกว้างจอได้เหมือน layout ปกติ
 *
 * สีข้างในเครื่องตรึงเป็นค่าคงที่ ไม่ผูกกับตัวแปรธีม — นี่คือ "ภาพสินค้า" ชิ้นหนึ่ง
 * หน้าจอมือถือในภาพโฆษณาต้องเป็นสีเดิมเสมอ ไม่ใช่กลับเป็นพื้นดำตามธีมของผู้ชม
 *
 * ทั้งก้อนเป็น role="img" — เนื้อหาข้างในเป็นตัวอย่างที่กดไม่ได้ ไม่ควรให้ screen reader
 * ไล่อ่านทีละช่องเหมือนฟอร์มจริง คำอธิบายทั้งหมดอยู่ใน aria-label เดียว
 */
const STEPS = ["ข้อมูลร้านค้า", "ข้อมูลผู้ติดต่อ", "อัปโหลดเอกสาร"];

export function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="ตัวอย่างหน้าจอใบสมัครพาร์ทเนอร์บนมือถือ ขั้นที่ 1 ข้อมูลร้านค้า จากทั้งหมด 3 ขั้น มีช่องชื่อร้าน เบอร์โทรศัพท์ จังหวัด ปุ่มถ่ายรูปหน้าร้าน และปุ่มถัดไป"
      className="device-float relative w-full max-w-[330px] select-none"
    >
      {/* ปุ่มข้างเครื่อง — รายละเอียดเล็ก ๆ ที่ทำให้อ่านออกว่าเป็นมือถือ ไม่ใช่การ์ดมุมมน */}
      <span
        aria-hidden
        className="absolute -left-[3px] top-[124px] h-11 w-[3px] rounded-l-full bg-[#2b2b30]"
      />
      <span
        aria-hidden
        className="absolute -left-[3px] top-[182px] h-11 w-[3px] rounded-l-full bg-[#2b2b30]"
      />
      <span
        aria-hidden
        className="absolute -right-[3px] top-[162px] h-[72px] w-[3px] rounded-r-full bg-[#2b2b30]"
      />

      {/* กรอบเครื่องสองชั้น: ขอบนอกไล่เฉดเลียนแสงตกกระทบขอบโลหะ ขอบในเป็นดำสนิท */}
      <div
        className="rounded-phone p-[3px] shadow-device"
        style={{
          background: "linear-gradient(150deg, #3d3d44 0%, #131317 42%, #0a0a0c 100%)",
        }}
      >
        <div className="rounded-[41px] bg-[#0a0a0c] p-[9px]">
          <div className="overflow-hidden rounded-[33px] bg-white px-5 pb-5 pt-3">
            <div
              aria-hidden
              className="mx-auto h-[26px] w-[96px] rounded-full bg-[#0a0a0c]"
            />

            <p className="mt-4 text-[15px] font-semibold text-[#0a0a0a]">
              ใบสมัครพาร์ทเนอร์
            </p>

            <Stepper />

            <div className="mt-4 space-y-3">
              <Field label="ชื่อร้าน" value="ABC Mobile" />
              <Field label="เบอร์โทรศัพท์" value="08X-XXX-XXXX" />

              {/* ช่องที่กำลังโฟกัส — ขอบแดงบอกว่าผู้ใช้อยู่ตรงนี้ */}
              <div>
                <p className="text-[11px] font-medium text-[#8c8c8c]">จังหวัด</p>
                <div className="mt-1.5 flex h-[42px] items-center justify-between rounded-input border-[1.5px] border-brand px-3">
                  <span className="text-[13px] text-[#0a0a0a]">กรุงเทพมหานคร</span>
                  <ChevronDown aria-hidden className="size-4 text-brand" />
                </div>
              </div>
            </div>

            <div className="mt-3 flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-input border border-dashed border-[#dedede] bg-[#fcfcfc]">
              <Camera aria-hidden className="size-6 text-brand" strokeWidth={1.75} />
              <span className="text-[10.5px] text-[#8c8c8c]">แตะเพื่อถ่ายรูปหน้าร้าน</span>
            </div>

            <div className="mt-3.5 flex h-[44px] items-center justify-center rounded-input bg-brand text-[14px] font-semibold text-on-brand">
              ถัดไป
            </div>

            <div
              aria-hidden
              className="mx-auto mt-3.5 h-[4px] w-[104px] rounded-full bg-[#dcdcdc]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper() {
  return (
    <div className="mt-4 flex items-start">
      {STEPS.map((label, index) => {
        const done = index === 0;
        return (
          <div key={label} className="relative flex flex-1 flex-col items-center">
            {/* เส้นเชื่อมวาดจากวงกลมนี้ย้อนไปหาวงก่อนหน้า จึงข้ามตัวแรกไป */}
            {index > 0 ? (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[13px] h-[2px] w-full ${
                  index === 1 ? "bg-brand" : "bg-[#e8e8e8]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-[26px] items-center justify-center rounded-full text-[12px] font-semibold ${
                done ? "bg-brand text-on-brand" : "bg-[#f0f0f0] text-[#a3a3a3]"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`mt-1.5 text-center text-[9.5px] leading-tight ${
                done ? "font-medium text-[#0a0a0a]" : "text-[#8c8c8c]"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#8c8c8c]">{label}</p>
      <div className="mt-1.5 flex h-[42px] items-center rounded-input border border-[#e6e6e6] bg-[#fcfcfc] px-3 text-[13px] text-[#0a0a0a]">
        {value}
      </div>
    </div>
  );
}
