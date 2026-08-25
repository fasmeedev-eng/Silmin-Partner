"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, MessageSquare, TriangleAlert } from "lucide-react";
import { STATUS_META, isDangerStatus } from "@/lib/application/status";
import { ALLOWED_TRANSITIONS, requiresMessage } from "@/lib/application/transitions";
import type { ApplicationStatus } from "@/lib/db/applications";
import { addNoteAction, changeStatusAction } from "../actions";

/**
 * คำอธิบายว่าการเลือกแต่ละสถานะ "แปลว่าอะไร" ในภาษาคนทำงาน
 * ชื่อสถานะเปล่า ๆ ไม่พอสำหรับคนที่ไม่ได้ออกแบบระบบนี้เอง
 */
const ACTION_HINTS: Partial<Record<ApplicationStatus, string>> = {
  Reviewing: "รับเรื่องไว้ตรวจสอบ ร้านจะเห็นว่าเรากำลังดูอยู่",
  NeedMoreInfo: "ขอข้อมูลหรือเอกสารเพิ่มจากร้าน ต้องบอกด้วยว่าขออะไร",
  Approved: "ผ่านการพิจารณา เตรียมเข้าสู่ขั้นตอนทำสัญญา",
  Onboarding: "เริ่มทำสัญญาและเปิดระบบให้ร้าน",
  ActivePartner: "เปิดใช้งานเรียบร้อย ร้านเริ่มขายได้",
  Rejected: "ปิดใบสมัครนี้ ต้องบอกเหตุผลให้ร้านทราบ",
};

export function StaffPanel({
  applicationId,
  shopName,
  status,
  canChangeStatus,
  canWriteNotes,
}: {
  applicationId: string;
  shopName: string;
  status: ApplicationStatus;
  canChangeStatus: boolean;
  canWriteNotes: boolean;
}) {
  const router = useRouter();
  // ซ่อน UI ตามสิทธิ์เป็นแค่ความสุภาพ — เซิร์ฟเวอร์ปฏิเสธเองอยู่แล้วถ้ายิงตรงมา
  const options = canChangeStatus ? ALLOWED_TRANSITIONS[status] : [];

  const [to, setTo] = useState<ApplicationStatus | "">("");
  const [message, setMessage] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  const [pending, start] = useTransition();
  const confirmRef = useRef<HTMLDialogElement>(null);

  const needsMessage = to !== "" && requiresMessage(to);
  const missingMessage = needsMessage && message.trim().length === 0;

  useEffect(() => {
    const dialog = confirmRef.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  const openConfirm = () => {
    setError(undefined);
    if (!to) return;
    if (missingMessage) {
      setError(`สถานะ "${STATUS_META[to].label}" ต้องเขียนข้อความถึงร้านก่อน`);
      return;
    }
    confirmRef.current?.showModal();
  };

  const submitStatus = () => {
    if (!to) return;
    start(async () => {
      const result = await changeStatusAction({
        applicationId,
        to,
        message,
        internalNote: statusNote,
      });
      confirmRef.current?.close();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTo("");
      setMessage("");
      setStatusNote("");
      setDone(`เปลี่ยนสถานะเป็น "${STATUS_META[to].label}" เรียบร้อยแล้ว`);
      router.refresh();
    });
  };

  const submitNote = () => {
    setError(undefined);
    setDone(undefined);
    start(async () => {
      const result = await addNoteAction({ applicationId, note });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNote("");
      setDone("บันทึกโน้ตแล้ว");
      router.refresh();
    });
  };

  // focus-visible:outline-none กันเส้นโฟกัสของเบราว์เซอร์มาซ้อนกับ ring ที่วาดเอง (เห็นเป็นเส้นคู่)
  const field =
    "w-full rounded-input bg-canvas px-4 py-3 text-body text-ink ring-1 ring-hairline ring-inset placeholder:text-ink-48 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink";

  return (
    <section className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:p-8">
      <h2 className="text-h3">ขั้นตอนถัดไป</h2>
      <p className="mt-2 max-w-[56ch] text-body text-ink-80">
        {canChangeStatus
          ? "เลือกว่าจะทำอะไรกับใบสมัครนี้ ระบบจะแจ้งร้านให้อัตโนมัติ"
          : "บัญชีของคุณดูข้อมูลได้อย่างเดียว ไม่มีสิทธิ์เปลี่ยนสถานะใบสมัคร"}
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      {done ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-input bg-pearl p-4 text-caption font-medium text-ink ring-1 ring-hairline ring-inset"
        >
          <CircleCheck aria-hidden className="size-[18px] shrink-0 text-brand" />
          {done}
        </p>
      ) : null}

      {canChangeStatus && options.length === 0 ? (
        <p className="mt-5 rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
          ใบสมัครนี้จบกระบวนการแล้ว ไม่มีขั้นตอนถัดไป
        </p>
      ) : null}

      {options.length > 0 ? (
        <div className="mt-6 space-y-3">
          {/* แต่ละตัวเลือกเป็นการ์ดใหญ่พร้อมคำอธิบาย ไม่ใช่ชิปเล็ก ๆ ที่ต้องเดาความหมาย */}
          {options.map((option) => {
            const selected = to === option;
            const isReject = isDangerStatus(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTo(selected ? "" : option);
                  setError(undefined);
                }}
                aria-pressed={selected}
                // ตัวที่เลือกไว้เป็นดำ ยกเว้น "ไม่ผ่าน" ที่เป็นแดง — แดงในแผงนี้ต้องแปลว่า
                // "ตัวเลือกที่ตัดจบและย้อนไม่ได้" อย่างเดียว ถ้าตัวเลือกปกติเป็นแดงด้วย
                // เจ้าหน้าที่จะแยกไม่ออกว่ากำลังจะกดปฏิเสธร้านหรือแค่เลื่อนสถานะ
                className={`block w-full rounded-card p-5 text-left transition-all ${
                  isReject ? "focus-visible:outline-danger-focus" : ""
                } ${
                  selected
                    ? isReject
                      ? "bg-danger text-on-danger shadow-soft"
                      : "bg-nav text-white shadow-soft"
                    : "bg-canvas shadow-soft ring-1 ring-hairline/70 hover:ring-ink-48/30"
                }`}
              >
                <span className="block text-body font-semibold">
                  {STATUS_META[option].label}
                </span>
                <span
                  className={`mt-1 block text-caption leading-[1.7] ${
                    selected ? (isReject ? "text-on-danger/80" : "text-white/60") : "text-ink-80"
                  }`}
                >
                  {ACTION_HINTS[option] ?? STATUS_META[option].detail}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {to ? (
        <div className="mt-6 space-y-5 border-t border-hairline pt-6">
          <div>
            <label htmlFor="status-message" className="block text-body font-semibold text-ink">
              ข้อความถึงร้าน
              {needsMessage ? <span className="pl-1 text-brand">*</span> : null}
            </label>
            <p className="mt-1 max-w-[56ch] text-caption text-ink-48">
              {needsMessage
                ? "จำเป็นต้องกรอก เพราะร้านต้องรู้ว่าต้องแก้อะไรหรือไม่ผ่านเพราะอะไร"
                : "ไม่บังคับ ร้านจะเห็นข้อความนี้ในหน้าใบสมัครของเขา"}
            </p>
            <textarea
              id="status-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="เช่น รูปบัตรประชาชนไม่ชัด กรุณาถ่ายใหม่ให้เห็นเลขบัตรครบ"
              className={`mt-3 ${field}`}
            />
          </div>

          <div hidden={!canWriteNotes}>
            <label htmlFor="status-note" className="block text-body font-semibold text-ink">
              โน้ตภายใน
            </label>
            <p className="mt-1 text-caption text-ink-48">
              ไม่บังคับ · เจ้าหน้าที่เห็นกันเองเท่านั้น ร้านไม่เห็น
            </p>
            <textarea
              id="status-note"
              rows={2}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className={`mt-3 ${field}`}
            />
          </div>

          <button
            type="button"
            onClick={openConfirm}
            // ปุ่มยืนยันปกติเป็นดำ ปุ่มของ "ไม่ผ่าน" เป็นแดง — ด้วยเหตุผลเดียวกับการ์ดตัวเลือกด้านบน
            // ถ้าทั้งสองเป็นแดง สัญญาณเตือนของการกดปฏิเสธร้านจะหายไปทั้งที่เป็นการกระทำที่ย้อนไม่ได้
            className={`inline-flex min-h-[56px] w-full items-center justify-center rounded-btn px-8 text-body font-semibold shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 sm:w-auto ${
              isDangerStatus(to)
                ? "bg-danger text-on-danger hover:bg-danger-hover focus-visible:outline-danger-focus"
                : "bg-nav text-white hover:opacity-90"
            }`}
          >
            ดำเนินการ
          </button>
        </div>
      ) : null}

      <div className="mt-8 border-t border-hairline pt-6" hidden={!canWriteNotes}>
        <label htmlFor="internal-note" className="block text-body font-semibold text-ink">
          จดโน้ตไว้เตือนตัวเอง
        </label>
        <p className="mt-1 max-w-[56ch] text-caption text-ink-48">
          เช่น &ldquo;โทรแล้วไม่รับสาย นัดโทรใหม่พรุ่งนี้บ่าย&rdquo; — ร้านไม่เห็นข้อความนี้
        </p>
        <textarea
          id="internal-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`mt-3 ${field}`}
        />
        <button
          type="button"
          onClick={submitNote}
          disabled={pending || note.trim().length === 0}
          className="mt-3 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-canvas px-6 text-body font-medium text-ink shadow-soft ring-1 ring-hairline ring-inset transition-colors hover:ring-ink-48/40 disabled:opacity-50"
        >
          <MessageSquare aria-hidden className="size-4" />
          บันทึกโน้ต
        </button>
      </div>

      {/* หน้ายืนยันทวนให้เห็นทั้งหมดก่อนกด — คนที่กลัวกดผิดต้องได้เห็นผลลัพธ์ล่วงหน้า */}
      <dialog
        ref={confirmRef}
        aria-labelledby="confirm-status-title"
        className="login-dialog m-auto w-[min(92vw,30rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
      >
        <div className="p-7">
          <h2 id="confirm-status-title" className="text-h3">
            ยืนยันการดำเนินการ
          </h2>

          {to ? (
            <dl className="mt-5 space-y-3 rounded-input bg-pearl p-4 text-caption ring-1 ring-hairline ring-inset">
              <div>
                <dt className="text-ink-48">ร้าน</dt>
                <dd className="mt-0.5 font-semibold">{shopName || applicationId}</dd>
              </div>
              <div>
                <dt className="text-ink-48">เปลี่ยนสถานะเป็น</dt>
                <dd className="mt-0.5 font-semibold">{STATUS_META[to].label}</dd>
              </div>
              <div>
                <dt className="text-ink-48">ข้อความที่ร้านจะเห็น</dt>
                <dd className="mt-0.5 whitespace-pre-line">
                  {message.trim() || "— ไม่ได้เขียนข้อความ —"}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => confirmRef.current?.close()}
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn px-6 text-body font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
            >
              ย้อนกลับไปแก้
            </button>
            <button
              type="button"
              onClick={submitStatus}
              disabled={pending}
              className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn px-6 text-body font-semibold transition-colors disabled:opacity-60 ${
                to !== "" && isDangerStatus(to)
                  ? "bg-danger text-on-danger hover:bg-danger-hover focus-visible:outline-danger-focus"
                  : "bg-nav text-white hover:opacity-90"
              }`}
            >
              <CircleCheck aria-hidden className="size-[18px]" />
              {pending ? "กำลังบันทึก…" : "ยืนยัน"}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
