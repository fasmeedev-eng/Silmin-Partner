"use client";

import { useState } from "react";
import { Check, Copy, HandCoins, Lightbulb, Printer, Wallet } from "lucide-react";
import { Field, RadioGroup, TextInput } from "@/components/ui/form-fields";
import type { Option } from "@/lib/application/options";

/**
 * ค่าคอมมิชชั่นที่ร้านพาร์ทเนอร์ได้รับ — 10% ของยอดจัดไฟแนนซ์ (ราคา − เงินดาวน์) เท่านั้น
 * ไม่ขึ้นกับจำนวนงวดที่ลูกค้าเลือกผ่อน จึงเป็นตัวเลขเดียว ไม่ใช่คอลัมน์แยกในตาราง
 * ข้อมูลนี้เป็นของร้าน ไม่ใช่ของลูกค้า จึงต้อง print:hidden และไม่ใส่ในข้อความที่คัดลอก/พิมพ์ให้ลูกค้า
 * แยกเป็นคนละสูตรกับ "อัตรากำไร" ของตารางยอดผ่อนด้านล่างโดยสิ้นเชิง — ห้ามนำมารวมกัน
 */
const PARTNER_COMMISSION_RATE_PERCENT = 10;

/** เปอร์เซ็นต์ดาวน์ที่ใช้บ่อยหน้าร้าน — กดทีเดียวแทนการพิมพ์ทั้งสองช่อง */
const QUICK_DOWN_PERCENTS = [0, 10, 20, 30, 40] as const;

const baht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

/**
 * ══════════════════════════════════════════════════════════════════════════
 * สูตรผ่อนมือถือของร้าน — ใช้คำนวณตารางยอดผ่อนทั้งตาราง (แทนที่สูตร add-on เดิม)
 *
 * ยอดจัด        = ราคาขาย - เงินดาวน์
 * กำไร          = ยอดจัด × อัตรากำไร (ตามประเภทเครื่อง + จำนวนงวด)
 * ยอดผ่อนรวม    = ยอดจัด + กำไร
 * ค่างวดต่อเดือน = ยอดผ่อนรวม ÷ จำนวนงวด
 *
 * อัตรากำไรเก็บเป็น configuration แยกตามประเภทเครื่อง ไม่ hardcode กระจายในโค้ด
 * คนละสูตรกับค่าคอมมิชชั่นร้านด้านบน — ห้ามนำมารวมกัน
 * ══════════════════════════════════════════════════════════════════════════
 */
type DeviceType = "new" | "used";

const INSTALLMENT_MONTHS = [3, 6, 10, 12, 15] as const;

const NEW_DEVICE_PROFIT_RATES: Record<number, number> = {
  3: 50,
  6: 70,
  10: 80,
  12: 90,
  15: 100,
};

const USED_DEVICE_PROFIT_RATES: Record<number, number> = {
  3: 60,
  6: 75,
  10: 85,
  12: 95,
  15: 105,
};

const DEVICE_TYPE_OPTIONS: readonly Option[] = [
  { value: "new", label: "มือ 1" },
  { value: "used", label: "มือ 2" },
];

interface InstallmentResult {
  financedAmount: number;
  profitRatePercent: number;
  profitAmount: number;
  totalInstallment: number;
  monthlyPayment: number;
}

function calculateInstallment({
  salePrice,
  downPayment,
  deviceType,
  months,
}: {
  salePrice: number;
  downPayment: number;
  deviceType: DeviceType;
  months: number;
}): InstallmentResult {
  const financedAmount = Math.max(salePrice - downPayment, 0);
  const rates = deviceType === "new" ? NEW_DEVICE_PROFIT_RATES : USED_DEVICE_PROFIT_RATES;
  const profitRatePercent = rates[months] ?? 0;
  const profitAmount = financedAmount * (profitRatePercent / 100);
  const totalInstallment = financedAmount + profitAmount;
  const monthlyPayment = months > 0 ? totalInstallment / months : 0;

  return { financedAmount, profitRatePercent, profitAmount, totalInstallment, monthlyPayment };
}

/** แสดงทศนิยม 2 ตำแหน่งเฉพาะเมื่อมีเศษจริง — จำนวนเต็มยังคงแสดงแบบเดิมไม่มี .00 ห้อยท้าย */
const bahtDecimal = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatShopBaht(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? baht.format(rounded) : bahtDecimal.format(rounded);
}

export function InstallmentCalculator() {
  const [price, setPrice] = useState("");
  const [downAmount, setDownAmount] = useState("");
  const [downPercent, setDownPercent] = useState("");
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("new");

  const priceNum = Number(price) || 0;
  const downAmountNum = Number(downAmount) || 0;

  // ราคา ↔ ดาวน์ (บาท) ↔ ดาวน์ (%) ผูกกันสามทาง — แก้ช่องไหนอีกสองช่องต้องตามให้ทัน
  // แก้ราคา: คงเปอร์เซ็นต์เดิมไว้ แล้วคำนวณจำนวนเงินดาวน์ใหม่ตามเปอร์เซ็นต์นั้น
  const handlePriceChange = (value: string) => {
    setPrice(value);
    const nextPrice = Number(value) || 0;
    const percent = Number(downPercent) || 0;
    if (nextPrice > 0 && percent > 0) {
      setDownAmount(String(Math.round((nextPrice * percent) / 100)));
    }
  };

  const handleDownAmountChange = (value: string) => {
    setDownAmount(value);
    if (priceNum > 0) {
      const amount = Number(value) || 0;
      setDownPercent(((amount / priceNum) * 100).toFixed(2));
    }
  };

  const handleDownPercentChange = (value: string) => {
    setDownPercent(value);
    if (priceNum > 0) {
      const percent = Number(value) || 0;
      setDownAmount(String(Math.round((priceNum * percent) / 100)));
    }
  };

  const handleClearAll = () => {
    setPrice("");
    setDownAmount("");
    setDownPercent("");
  };

  const financed = Math.max(priceNum - downAmountNum, 0);
  const canCalculate = priceNum > 0 && financed > 0;
  const downPercentDisplay = priceNum > 0 ? (Number(downPercent) || 0).toFixed(2) : "0";

  const rows = INSTALLMENT_MONTHS.map((months) => {
    const result = calculateInstallment({ salePrice: priceNum, downPayment: downAmountNum, deviceType, months });
    return { months, profitRatePercent: result.profitRatePercent, monthly: result.monthlyPayment };
  });
  // แผนที่อัตรากำไรต่ำที่สุด = ประหยัดที่สุดสำหรับลูกค้า
  const cheapestRate = Math.min(...rows.map((r) => r.profitRatePercent));
  const commission = Math.round(financed * (PARTNER_COMMISSION_RATE_PERCENT / 100));

  const handleCopy = async () => {
    const lines = [
      `ราคามือถือ: ${baht.format(priceNum)} บาท`,
      `เงินดาวน์: ${baht.format(downAmountNum)} บาท (${downPercentDisplay}%)`,
      `ยอดจัดไฟแนนซ์: ${baht.format(financed)} บาท`,
      `ประเภทเครื่อง: ${deviceType === "new" ? "มือ 1" : "มือ 2"}`,
      "",
      "งวดผ่อน\tผ่อนต่อเดือน",
      ...rows.map((r) => `${r.months} งวด\t${formatShopBaht(r.monthly)} บาท`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // เงียบไว้ — บาง context (ไม่ใช่ HTTPS, เบราว์เซอร์เก่า) ไม่รองรับ Clipboard API
    }
  };

  return (
    // สองคอลัมน์บนจอกว้าง: กรอกทางซ้าย เห็นผลทางขวาพร้อมกัน ไม่ต้องเลื่อนไปมาระหว่างคุยกับลูกค้า
    // จอแคบเรียงลงมา ผลลัพธ์อยู่ใต้ช่องกรอกตามลำดับที่คนใช้จริง
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] print:block">
      {/* ── ช่องกรอก ─────────────────────────────────────────── */}
      <div className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:p-7 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-input bg-brand-soft text-brand-ink ring-1 ring-inset ring-brand/15"
            >
              <Wallet className="size-[18px]" strokeWidth={2} />
            </span>
            <h2 className="text-body font-semibold">ข้อมูลเครื่องและการชำระ</h2>
          </div>
          {price || downAmount ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="min-h-[44px] rounded-btn px-3 text-caption font-medium text-brand-ink transition-colors hover:bg-brand/[0.06]"
            >
              ล้างค่า
            </button>
          ) : null}
        </div>

        <div className="mt-6 space-y-6">
          <Field id="price" label="ราคากดขาย">
            <div className="relative">
              <TextInput
                id="price"
                value={price}
                onChange={handlePriceChange}
                inputMode="numeric"
                placeholder="0"
                className=" w-full border border-gray-200 pl-2 rounded-sm text-lead font-semibold tabular-nums"
              />
              {/* หน่วยอยู่ในช่อง ไม่ใช่ใน label — บอกหน่วยตรงจุดที่กำลังพิมพ์ */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-body text-ink-48"
              >
              </span>
            </div>
          </Field>

          <div>
            <p className="mb-2.5 text-caption font-semibold text-ink">ประเภทเครื่อง</p>
            <RadioGroup
              name="device-type"
              value={deviceType}
              onChange={(value) => setDeviceType(value as DeviceType)}
              options={DEVICE_TYPE_OPTIONS}
            />
          </div>

          <div>
            <p className="text-caption font-semibold text-ink">เงินดาวน์</p>

            {/* เปอร์เซ็นต์ที่ใช้บ่อย — พนักงานหน้าร้านกดทีเดียวแทนการคิดเลขแล้วพิมพ์สองช่อง */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {QUICK_DOWN_PERCENTS.map((percent) => {
                const active = priceNum > 0 && Math.round(Number(downPercent) || 0) === percent;
                return (
                  <button
                    key={percent}
                    type="button"
                    disabled={priceNum <= 0}
                    onClick={() => handleDownPercentChange(String(percent))}
                    aria-pressed={active}
                    className={`min-h-[40px] rounded-btn px-4 text-caption font-medium tabular-nums transition-all disabled:pointer-events-none disabled:opacity-40 ${active
                      ? "bg-ink text-white"
                      : "bg-pearl text-ink-80 ring-1 ring-hairline ring-inset hover:bg-canvas hover:ring-ink-48/30"
                      }`}
                  >
                    {percent}%
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid   grid-cols-1 md:grid-cols-2  gap-3">
              <Field id="down-amount" label="จำนวนเงินดาวน์ (บาท)">
                <TextInput
                  id="down-amount"
                  value={downAmount}
                  onChange={handleDownAmountChange}
                  inputMode="numeric"
                  placeholder="0"
                  className="tabular-nums w-full md:w-auto pl-2 rounded-sm border border-gray-200"
                />
              </Field>
              <Field id="down-percent" label="เปอร์เซ็นต์ (%)">
                <TextInput
                  id="down-percent"
                  value={downPercent}
                  onChange={handleDownPercentChange}
                  inputMode="decimal"
                  placeholder="0"
                  className="tabular-nums w-full md:w-auto pl-2 rounded-sm border border-gray-200"
                />
              </Field>
            </div>
          </div>

          {/* ยอดจัดไฟแนนซ์ซ้ำอีกครั้งทางฝั่งกรอก — ตัวเลขเดียวกับทางขวา แค่ให้เห็นระหว่างกำลังพิมพ์ */}
          <div className="flex items-center justify-between gap-4 rounded-input bg-pearl px-4 py-3.5 ring-1 ring-hairline ring-inset">
            <span className="flex items-center gap-2 text-caption font-medium text-ink-80">
              <Wallet aria-hidden className="size-4 shrink-0 text-ink-48" strokeWidth={1.9} />
              ยอดจัดไฟแนนซ์
            </span>
            <span className="text-body font-bold tabular-nums text-gold-ink">
              {baht.format(financed)} บาท
            </span>
          </div>

          {/* ค่าคอมของร้าน — ไฮไลต์ด้วยพื้นทองอ่อน (ต่างจากยอดจัดไฟแนนซ์ที่พื้น pearl เฉย ๆ)
              ให้เห็นเด่นตั้งแต่ตอนกำลังกรอก ไม่ต้องเลื่อนตาไปดูฝั่งผลลัพธ์ การ์ดนี้ทั้งใบ print:hidden
              อยู่แล้ว (ห่อจากข้างนอก) จึงไม่หลุดไปอยู่ในเอกสารที่พิมพ์ให้ลูกค้า */}
          <div className="flex items-center justify-between gap-4 rounded-input bg-gold-soft px-4 py-3.5 ring-1 ring-gold/25 ring-inset">
            <span className="flex items-center gap-2 text-caption font-medium text-gold-ink">
              <HandCoins aria-hidden className="size-4 shrink-0" strokeWidth={1.9} />
              ค่าคอมมิชชั่นร้าน ({PARTNER_COMMISSION_RATE_PERCENT}% ของยอดจัดไฟแนนซ์)
            </span>
            <span className="text-body font-bold tabular-nums text-gold-ink">
              {baht.format(commission)} บาท
            </span>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2.5 rounded-input bg-gold-soft p-4 text-fine leading-[1.7] text-gold-ink ring-1 ring-gold/20 ring-inset">
          <Lightbulb aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.9} />
          อัตรานี้ใช้สำหรับการประเมินเบื้องต้นเท่านั้น
          เงื่อนไขเป็นไปตามที่บริษัทกำหนด
        </p>
      </div>

      {/* ── ผลลัพธ์ ───────────────────────────────────────────
          พื้นดำเพราะตัวเลขคือของที่ต้องอ่านจากระยะหนึ่งเมตรตอนหันจอให้ลูกค้าดู
          ทองบนดำได้คอนทราสต์ ~13:1 สูงกว่าอะไรก็ตามที่วางบนพื้นขาวได้ */}
      <div className="overflow-hidden rounded-card bg-nav text-white shadow-soft print:rounded-none print:bg-white print:text-ink print:shadow-none">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 print:border-hairline">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-input bg-white/10 text-gold print:hidden"
            >
              <Wallet className="size-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-body font-semibold">ตารางยอดผ่อน</h2>
              <p className="mt-0.5 text-fine text-white/45 print:text-ink-48">
                เลือกดูยอดผ่อนที่เหมาะสมกับลูกค้า
              </p>
            </div>
          </div>

          {canCalculate ? (
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "คัดลอกแล้ว" : "คัดลอกตาราง"}
                title="คัดลอกตาราง"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-btn bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-white"
              >
                {copied ? (
                  <Check aria-hidden className="size-4 text-gold" strokeWidth={2.5} />
                ) : (
                  <Copy aria-hidden className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-btn bg-white/10 px-4 text-caption font-semibold transition-colors hover:bg-white/20 focus-visible:outline-white"
              >
                <Printer aria-hidden className="size-4" />
                พิมพ์ตาราง
              </button>
            </div>
          ) : null}
        </div>

        {canCalculate ? (
          <>
            {/* สรุปตัวเลขที่ตารางไม่ได้บอก — โดยเฉพาะ "ยอดจัดไฟแนนซ์" ซึ่งเป็นฐานของทุกงวด
                ถ้าไม่แสดง ลูกค้าจะไม่เข้าใจว่าตัวเลขรายเดือนคิดมาจากอะไร */}
            <dl className="grid grid-cols-4 divide-x divide-white/10 border-b border-white/10 print:divide-hairline print:border-hairline">
              <SummaryCell label="ราคามือถือ" value={baht.format(priceNum)} />
              <SummaryCell
                label="เงินดาวน์"
                value={baht.format(downAmountNum)}
                note={`${downPercentDisplay}%`}
              />
              <SummaryCell label="ยอดจัดไฟแนนซ์" value={baht.format(financed)} highlight />
              <SummaryCell label="ประเภทเครื่อง" value={deviceType === "new" ? "มือ 1" : "มือ 2"} />
            </dl>

            <table className="w-full">
              <caption className="sr-only">
                ยอดผ่อนต่อเดือนแยกตามจำนวนงวด คำนวณจากยอดจัดไฟแนนซ์ {baht.format(financed)} บาท
              </caption>
              <thead>
                <tr className="text-fine text-white/45 print:text-ink-48">
                  <th scope="col" className="px-6 pt-4 text-left font-normal">
                    งวดผ่อน
                  </th>
                  <th scope="col" className="px-6 pt-4 text-right font-normal">
                    ค่างวดต่อเดือน
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.months}
                    className="border-t border-white/[0.07] print:border-hairline"
                  >
                    <th scope="row" className="px-6 py-4 text-left text-body font-normal">
                      {row.months} งวด
                    </th>
                    <td className="px-6 py-4 text-right text-lead font-semibold tabular-nums text-gold print:text-ink">
                      <span className="inline-flex items-center justify-end gap-2">
                        {formatShopBaht(row.monthly)}

                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="border-t border-white/10 px-6 py-4 text-fine leading-[1.7] text-white/45 print:border-hairline print:text-ink-48">
              หมายเหตุ: อัตรากำไรและยอดผ่อนอาจเปลี่ยนแปลงได้ตามเงื่อนไขของร้าน
            </p>
          </>
        ) : (
          // ไม่เขียนว่า "ทางซ้าย" — จอแคบช่องกรอกอยู่ด้านบน ไม่ใช่ด้านซ้าย คำบอกทิศทางจะผิดทันที
          <p className="px-6 py-16 text-center text-caption leading-[1.7] text-white/45">
            กรอกราคาเครื่องและเงินดาวน์
            <br />
            แล้วตารางยอดผ่อนจะขึ้นตรงนี้
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  note,
  highlight = false,
}: {
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-4 py-4 text-center">
      <dt className="text-fine text-white/45 print:text-ink-48">{label}</dt>
      <dd
        className={`mt-1 text-body font-semibold tabular-nums ${highlight ? "text-gold print:text-brand" : "text-white print:text-ink"
          }`}
      >
        {value}
        {note ? (
          <span className="pl-1.5 text-fine font-normal text-white/45 print:text-ink-48">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
