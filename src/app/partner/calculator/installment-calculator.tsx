"use client";

import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { Field, TextInput } from "@/components/ui/form-fields";

/**
 * อัตราค่าธรรมเนียมแบบ add-on (คงที่) ต่องวด — เป็นตัวเลขประมาณการมาตรฐานทั่วไปที่กำหนดขึ้นเอง
 * (ราว 1%/เดือนของยอดที่ต้องผ่อน ซึ่งเป็นช่วงที่พบได้ทั่วไปสำหรับแผนผ่อนของร้านที่ไม่ใช่ 0%)
 * ไม่ใช่อัตราที่ยืนยันจากบริษัทไฟแนนซ์จริง — ถ้าธุรกิจมีอัตราจริงให้แทนที่ตารางนี้
 */
const INSTALLMENT_PLANS = [
  { months: 3, addOnRatePercent: 3 },
  { months: 6, addOnRatePercent: 6 },
  { months: 8, addOnRatePercent: 8 },
  { months: 10, addOnRatePercent: 10 },
  { months: 12, addOnRatePercent: 12 },
] as const;

/** เปอร์เซ็นต์ดาวน์ที่ใช้บ่อยหน้าร้าน — กดทีเดียวแทนการพิมพ์ทั้งสองช่อง */
const QUICK_DOWN_PERCENTS = [0, 10, 20, 30] as const;

const baht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

export function InstallmentCalculator() {
  const [price, setPrice] = useState("");
  const [downAmount, setDownAmount] = useState("");
  const [downPercent, setDownPercent] = useState("");
  const [copied, setCopied] = useState(false);

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

  const rows = INSTALLMENT_PLANS.map((plan) => {
    const total = financed * (1 + plan.addOnRatePercent / 100);
    return { ...plan, monthly: Math.round(total / plan.months) };
  });

  const handleCopy = async () => {
    const lines = [
      `ราคาเครื่อง: ${baht.format(priceNum)} บาท`,
      `เงินดาวน์: ${baht.format(downAmountNum)} บาท (${downPercentDisplay}%)`,
      `ยอดที่ต้องผ่อน: ${baht.format(financed)} บาท`,
      "",
      "งวดผ่อน\tผ่อนต่อเดือน",
      ...rows.map((r) => `${r.months} งวด\t${baht.format(r.monthly)} บาท`),
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* ── ช่องกรอก ─────────────────────────────────────────── */}
      <div className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-body font-semibold">ข้อมูลเครื่อง</h2>
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

        <div className="mt-5 space-y-6">
          <Field id="price" label="ราคาเครื่อง (บาท)">
            <div className="relative">
              {/* สัญลักษณ์เงินบาทอยู่ในช่อง ไม่ใช่ใน label — บอกหน่วยตรงจุดที่กำลังพิมพ์ */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-body text-ink-48"
              >
                ฿
              </span>
              <TextInput
                id="price"
                value={price}
                onChange={handlePriceChange}
                inputMode="numeric"
                placeholder="0"
                className="pl-9 text-lead font-semibold tabular-nums"
              />
            </div>
          </Field>

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

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field id="down-amount" label="จำนวนเงินดาวน์ (บาท)">
                <TextInput
                  id="down-amount"
                  value={downAmount}
                  onChange={handleDownAmountChange}
                  inputMode="numeric"
                  placeholder="0"
                  className="tabular-nums"
                />
              </Field>
              <Field id="down-percent" label="เปอร์เซ็นต์ (%)">
                <TextInput
                  id="down-percent"
                  value={downPercent}
                  onChange={handleDownPercentChange}
                  inputMode="decimal"
                  placeholder="0"
                  className="tabular-nums"
                />
              </Field>
            </div>
          </div>
        </div>

        <p className="mt-7 flex items-start gap-2.5 rounded-input bg-pearl p-4 text-fine leading-[1.7] text-ink-48 ring-1 ring-hairline ring-inset">
          <Info aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.9} />
          อัตราที่ใช้คำนวณเป็นตัวเลขประมาณการตามมาตรฐานทั่วไป ใช้เป็นแนวทางคร่าว ๆ ให้ลูกค้าดูหน้าร้าน
          ไม่ใช่อัตราดอกเบี้ยที่ยืนยันจากบริษัทไฟแนนซ์จริง
        </p>
      </div>

      {/* ── ผลลัพธ์ ───────────────────────────────────────────
          พื้นดำเพราะตัวเลขคือของที่ต้องอ่านจากระยะหนึ่งเมตรตอนหันจอให้ลูกค้าดู
          ทองบนดำได้คอนทราสต์ ~13:1 สูงกว่าอะไรก็ตามที่วางบนพื้นขาวได้ */}
      <div className="overflow-hidden rounded-card bg-nav text-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <h2 className="text-body font-semibold">ตารางยอดผ่อน</h2>
          {canCalculate ? (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-btn bg-white/10 px-4 text-caption font-semibold transition-colors hover:bg-white/20 focus-visible:outline-white"
            >
              {copied ? (
                <Check aria-hidden className="size-4 text-gold" strokeWidth={2.5} />
              ) : (
                <Copy aria-hidden className="size-4" />
              )}
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
          ) : null}
        </div>

        {canCalculate ? (
          <>
            {/* สรุปสามตัวเลขที่ตารางไม่ได้บอก — โดยเฉพาะ "ยอดที่ต้องผ่อน" ซึ่งเป็นฐานของทุกงวด
                ถ้าไม่แสดง ลูกค้าจะไม่เข้าใจว่าตัวเลขรายเดือนคิดมาจากอะไร */}
            <dl className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
              <SummaryCell label="ราคาเครื่อง" value={baht.format(priceNum)} />
              <SummaryCell
                label="เงินดาวน์"
                value={baht.format(downAmountNum)}
                note={`${downPercentDisplay}%`}
              />
              <SummaryCell label="ยอดที่ต้องผ่อน" value={baht.format(financed)} highlight />
            </dl>

            <table className="w-full">
              <caption className="sr-only">
                ยอดผ่อนต่อเดือนแยกตามจำนวนงวด คำนวณจากยอดที่ต้องผ่อน{" "}
                {baht.format(financed)} บาท
              </caption>
              <thead>
                <tr className="text-fine text-white/45">
                  <th scope="col" className="px-6 pt-4 text-left font-normal">
                    งวดผ่อน
                  </th>
                  <th scope="col" className="px-6 pt-4 text-right font-normal">
                    ผ่อนต่อเดือน
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.months} className="border-t border-white/[0.07]">
                    <th scope="row" className="px-6 py-4 text-left text-body font-normal">
                      {row.months} งวด
                    </th>
                    <td className="px-6 py-4 text-right text-lead font-semibold tabular-nums text-gold">
                      {baht.format(row.monthly)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <dt className="text-fine text-white/45">{label}</dt>
      <dd
        className={`mt-1 text-body font-semibold tabular-nums ${highlight ? "text-gold" : "text-white"
          }`}
      >
        {value}
        {note ? <span className="pl-1.5 text-fine font-normal text-white/45">{note}</span> : null}
      </dd>
    </div>
  );
}
