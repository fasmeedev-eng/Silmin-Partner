"use client";

import { useState } from "react";
import { Calculator, Check, Copy } from "lucide-react";
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

  const handleClearPrice = () => {
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
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-card bg-canvas ring-1 ring-hairline ring-inset">
      <div className="bg-nav px-6 py-5 text-on-dark">
        <h1 className="flex items-center gap-2 text-body font-semibold">
          <Calculator aria-hidden className="size-5 text-gold" />
          คำนวณผ่อนมือถือ
        </h1>
      </div>

      <div className="space-y-6 p-6">
        <Field id="price" label="ราคาเครื่อง (บาท)">
          <div className="relative">
            <TextInput
              id="price"
              value={price}
              onChange={handlePriceChange}
              inputMode="numeric"
              placeholder="0"
              className="pr-11"
            />
            {price ? (
              <button
                type="button"
                onClick={handleClearPrice}
                aria-label="ล้างราคาเครื่อง"
                className="absolute inset-y-0 right-3 flex items-center text-ink-48 hover:text-ink"
              >
                ✕
              </button>
            ) : null}
          </div>
        </Field>

        <div>
          <p className="text-caption font-semibold text-ink">ข้อมูลเงินดาวน์</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field id="down-amount" label="จำนวนเงินดาวน์ (บาท)">
              <TextInput
                id="down-amount"
                value={downAmount}
                onChange={handleDownAmountChange}
                inputMode="numeric"
                placeholder="0"
              />
            </Field>
            <Field id="down-percent" label="เปอร์เซ็นต์ (%)">
              <TextInput
                id="down-percent"
                value={downPercent}
                onChange={handleDownPercentChange}
                inputMode="decimal"
                placeholder="0"
              />
            </Field>
          </div>
        </div>

        {canCalculate ? (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-caption font-semibold text-ink">ตารางยอดผ่อน</p>
              <p className="text-caption text-ink-80">
                ดาวน์: <span className="font-semibold text-brand-ink">{baht.format(downAmountNum)} ({downPercentDisplay}%)</span>
              </p>
            </div>

            <div className="mt-3 overflow-hidden rounded-card bg-nav text-on-dark">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="text-caption font-semibold">รายละเอียดงวดผ่อน</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/10 px-3 text-fine font-semibold transition-colors hover:bg-white/20"
                >
                  {copied ? (
                    <Check aria-hidden className="size-3.5 text-gold" />
                  ) : (
                    <Copy aria-hidden className="size-3.5" />
                  )}
                  {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-fine text-on-dark-muted">
                    <th className="px-4 pt-3 text-left font-normal">งวดผ่อน</th>
                    <th className="px-4 pt-3 text-right font-normal">ผ่อนต่อเดือน</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.months} className="border-t border-white/10">
                      <td className="px-4 py-3 text-body">{row.months} งวด</td>
                      <td className="px-4 py-3 text-right text-body font-semibold tabular-nums text-gold">
                        {baht.format(row.monthly)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-caption text-ink-48">กรอกราคาเครื่องและเงินดาวน์เพื่อคำนวณยอดผ่อน</p>
        )}

        <p className="text-fine text-ink-48">
          อัตราด้านบนเป็นตัวเลขประมาณการตามมาตรฐานทั่วไป ใช้เป็นแนวทางคร่าว ๆ ให้ลูกค้าดูหน้าร้าน
          ไม่ใช่อัตราดอกเบี้ยที่ยืนยันจากบริษัทไฟแนนซ์จริง
        </p>
      </div>
    </div>
  );
}
