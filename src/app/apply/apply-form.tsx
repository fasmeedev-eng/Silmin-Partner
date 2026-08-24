"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CircleAlert,
  CircleCheck,
  FileText,
  MessageCircle,
  Store,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";
import { ctaClass } from "@/components/ui/cta-button";
import { STEPS, type StepId } from "@/lib/application/options";
import { REQUIRED_CATEGORIES } from "@/lib/application/categories";
import { validateStep, type ApplicationData } from "@/lib/application/schema";
import { saveDraftAction, submitAction, updateApplicationAction } from "./actions";
import { DocumentsStep } from "./documents-step";
import { FormStepper } from "./form-stepper";
import {
  BusinessStep,
  ContactStep,
  InterestsStep,
  ReviewStep,
  SalesStep,
  ShopStep,
} from "./steps";

const LAST_STEP = STEPS.length - 1;

// เฉพาะเรื่อง UI ล้วน ๆ จึงแยกออกจาก STEPS ใน options.ts ซึ่งเป็นข้อมูลที่ทั้งฝั่ง
// เซิร์ฟเวอร์ (validation) และฝั่ง client ใช้ร่วมกัน — ไม่อยากให้ไอคอนเป็นภาระของฝั่งเซิร์ฟเวอร์
const STEP_ICONS: Record<StepId, LucideIcon> = {
  shop: Store,
  contact: User,
  business: Briefcase,
  sales: TrendingUp,
  documents: FileText,
  interests: MessageCircle,
  review: CircleCheck,
};

export function ApplyForm({
  initialData,
  /** มีค่าเมื่อกำลังแก้ไขใบสมัครที่ส่งแล้ว — เปลี่ยนปลายทางการบันทึกและปิด autosave ร่าง */
  applicationId,
}: {
  initialData: ApplicationData;
  applicationId?: string;
}) {
  const editing = Boolean(applicationId);
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitError, setSubmitError] = useState<string>();
  // เอกสารไม่ได้อยู่ใน ApplicationData เพราะเก็บเป็นตัวชี้ไปยัง Drive คนละที่กับข้อความ
  // ขั้นเอกสารจึงรายงานจำนวนไฟล์กลับขึ้นมา เพื่อให้ปุ่ม "ถัดไป" ตรวจได้ว่าแนบรูปหน้าร้านหรือยัง
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [documentError, setDocumentError] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  const confirmRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dirtyRef = useRef(false);
  const submittedRef = useRef(false);

  const step = STEPS[stepIndex];
  const StepIcon = STEP_ICONS[step.id];

  // ต้อง useCallback ไว้เสมอ — ถ้าเป็นแอร์โรว์อินไลน์ใน JSX มันจะได้ identity ใหม่ทุก render
  // แล้ว DocumentsStep จะ re-run effect ที่เรียก callback นี้ทุกครั้งที่ re-render จนวนลูปไม่รู้จบ
  const handleDocumentCounts = useCallback((counts: Record<string, number>) => {
    setDocumentCounts(counts);
    if (REQUIRED_CATEGORIES.every((c) => counts[c.id] > 0)) setDocumentError(false);
  }, []);

  const update = useCallback<
    <K extends keyof ApplicationData>(section: K, patch: Partial<ApplicationData[K]>) => void
  >((section, patch) => {
    dirtyRef.current = true;
    setData((current) => ({ ...current, [section]: { ...current[section], ...patch } }));

    // ล้าง error ของช่องที่เพิ่งแก้ ไม่งั้นข้อความเดิมจะค้างอยู่ทั้งที่ผู้ใช้แก้ให้ถูกแล้ว
    setErrors((current) => {
      const prefixes = Object.keys(patch).map((key) => `${String(section)}.${key}`);
      const next = Object.fromEntries(
        Object.entries(current).filter(
          ([path]) => !prefixes.some((p) => path === p || path.startsWith(`${p}.`)),
        ),
      );
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, []);

  const persist = useCallback(async (value: ApplicationData) => {
    // โหมดแก้ไขไม่แตะร่าง ใบสมัครจริงจะถูกเขียนตอนกดบันทึกเท่านั้น
    // ถ้าเผลอบันทึกร่างที่นี่ ผู้ใช้จะได้ร่างค้างขึ้นมาใหม่ทั้งที่ไม่ได้ตั้งใจสมัครใบที่สอง
    if (editing) return;
    // ส่งใบสมัครไปแล้วห้ามเขียนร่างอีก ไม่งั้นร่างที่เพิ่งถูกแปลงเป็นใบสมัครจะถูกสร้างขึ้นมาใหม่
    if (submittedRef.current) return;
    setSaveState("saving");
    const result = await saveDraftAction(value);
    setSaveState(result.ok ? "saved" : "idle");
  }, [editing]);

  // บันทึกร่างหลังหยุดพิมพ์ 1.5 วินาที — ผู้ใช้กรอกในร้าน สัญญาณหลุดง่าย
  // ถ้ารอบันทึกตอนกด "ถัดไป" อย่างเดียว ปิดแท็บกลางขั้นแล้วงานหายทั้งขั้น
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      dirtyRef.current = false;
      void persist(data);
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, persist]);

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
    setErrors({});
    // ย้ายโฟกัสไปหัวข้อขั้นใหม่ ไม่งั้นคนใช้คีย์บอร์ดและ screen reader จะไม่รู้ว่าหน้าเปลี่ยน
    requestAnimationFrame(() => headingRef.current?.focus());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = () => {
    // หมวดที่บังคับต้องมีอย่างน้อย 1 ไฟล์ทุกหมวด ไม่ใช่แค่รูปหน้าร้าน
    if (
      step.id === "documents" &&
      REQUIRED_CATEGORIES.some((category) => !(documentCounts[category.id] > 0))
    ) {
      setDocumentError(true);
      return;
    }
    const stepErrors = validateStep(step.id, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    void persist(data);
    goToStep(Math.min(stepIndex + 1, LAST_STEP));
  };

  const goBack = () => goToStep(Math.max(stepIndex - 1, 0));

  const openConfirm = () => {
    const stepErrors = validateStep("review", data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setSubmitError(undefined);
    confirmRef.current?.showModal();
  };

  const doSubmit = () => {
    // ปิด autosave ตั้งแต่ก่อนยิง ไม่ใช่หลังสำเร็จ — timer ที่ตั้งค้างไว้อาจยิงระหว่างรอผลลัพธ์
    submittedRef.current = true;
    dirtyRef.current = false;

    startSubmit(async () => {
      const result = applicationId
        ? await updateApplicationAction(applicationId, data)
        : await submitAction(data);

      if (result.ok && result.applicationId) {
        confirmRef.current?.close();
        router.push(
          applicationId
            ? `/me/${encodeURIComponent(applicationId)}?saved=1`
            : `/apply/success?id=${encodeURIComponent(result.applicationId)}`,
        );
        router.refresh();
        return;
      }
      // ไม่สำเร็จ ต้องกลับมาบันทึกร่างได้ตามเดิม ไม่งั้นสิ่งที่กรอกต่อจากนี้จะหาย
      submittedRef.current = false;
      confirmRef.current?.close();
      setErrors(result.errors ?? {});
      setSubmitError(
        result.message ??
        (applicationId ? "บันทึกการแก้ไขไม่สำเร็จ" : "ส่งใบสมัครไม่สำเร็จ กรุณาลองอีกครั้ง"),
      );
    });
  };

  const stepProps = { data, errors, update };

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 pb-28 pt-10 lg:px-8 lg:pb-20">
      {/* แถบขั้นตอน — บอกทั้งว่าอยู่ขั้นไหน ผ่านอะไรมาแล้ว และเหลืออะไรอีก */}
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-caption font-medium text-ink-48">
            ขั้นที่{" "}
            <span className="font-semibold tabular-nums text-ink">{stepIndex + 1}</span> จาก{" "}
            <span className="tabular-nums">{STEPS.length}</span>
          </p>
          <p className="text-caption text-ink-48" aria-live="polite">
            {editing ? "กำลังแก้ไขใบสมัครที่ส่งแล้ว" : null}
            {!editing && saveState === "saving" ? "กำลังบันทึกร่าง…" : null}
            {!editing && saveState === "saved" ? "บันทึกร่างแล้ว" : null}
          </p>
        </div>

        <div className="mt-5">
          <FormStepper currentIndex={stepIndex} onStepSelect={goToStep} />
        </div>
      </div>

      {/* ไอคอนต่อขั้น ช่วยให้กวาดสายตาแล้วจับได้ทันทีว่ากำลังอยู่ขั้นไหนในฟอร์ม 7 ขั้น */}
      <div className="mt-9 flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-input bg-brand text-on-brand"
        >
          <StepIcon className="size-[22px]" strokeWidth={2} />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-h3 font-bold leading-[1.32] focus:outline-none"
        >
          {step.title}
        </h1>
      </div>

      {/* เนื้อหาแต่ละขั้นอยู่บนการ์ดขาว ลอยอยู่บนพื้นอุ่นของหน้า — ขอบเขตของ "สิ่งที่ต้องกรอกตอนนี้"
          จึงชัดด้วยตัวมันเอง ไม่ต้องมีเส้นคั่นหรือหัวข้อย่อยมาบอก */}
      <div className="mt-7 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:p-8">
        {step.id === "shop" ? <ShopStep {...stepProps} /> : null}
        {step.id === "contact" ? <ContactStep {...stepProps} /> : null}
        {step.id === "business" ? <BusinessStep {...stepProps} /> : null}
        {step.id === "sales" ? <SalesStep {...stepProps} /> : null}
        {step.id === "documents" ? (
          <DocumentsStep
            onCountsChange={handleDocumentCounts}
            showRequiredError={documentError}
            applicationId={applicationId}
          />
        ) : null}
        {step.id === "interests" ? <InterestsStep {...stepProps} /> : null}
        {step.id === "review" ? (
          <ReviewStep {...stepProps} goToStep={goToStep} editing={editing} />
        ) : null}
      </div>

      {submitError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-inset ring-danger/25"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
          {submitError}
        </p>
      ) : null}

      <div className="mt-9 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex min-h-[56px] items-center gap-2 rounded-btn px-5 text-body font-medium text-ink-80 transition-colors hover:bg-canvas hover:text-ink disabled:invisible"
        >
          <ArrowLeft aria-hidden className="size-[18px]" />
          ย้อนกลับ
        </button>

        {stepIndex < LAST_STEP ? (
          <button type="button" onClick={goNext} className={ctaClass("brand")}>
            ถัดไป
            <ArrowRight aria-hidden className="size-[18px]" />
          </button>
        ) : (
          <button type="button" onClick={openConfirm} className={ctaClass("brand")}>
            {editing ? "บันทึกการแก้ไข" : "ส่งใบสมัคร Partner"}
            <Check aria-hidden className="size-[18px]" />
          </button>
        )}
      </div>

      <dialog
        ref={confirmRef}
        aria-labelledby="confirm-title"
        className="login-dialog m-auto w-[min(92vw,28rem)] rounded-card bg-canvas p-0 text-ink backdrop:bg-black/60"
      >
        <div className="p-8">
          <h2 id="confirm-title" className="text-h3 font-bold">
            {editing ? "ยืนยันการแก้ไข" : "ตรวจสอบข้อมูล"}
          </h2>
          <p className="mt-4 text-caption leading-[1.7] text-ink-80">
            {editing
              ? "ข้อมูลใหม่จะแทนที่ข้อมูลเดิมในใบสมัครนี้ และบันทึกไว้ในประวัติการแก้ไข"
              : "กรุณาตรวจสอบข้อมูลก่อนส่งใบสมัคร เมื่อกด “ยืนยันส่งใบสมัคร” ข้อมูลจะถูกส่งให้บริษัทตรวจสอบ"}
          </p>
          <p className="mt-3 text-fine text-ink-48">
            {editing
              ? "แก้ไขได้จนกว่าเจ้าหน้าที่จะเริ่มตรวจสอบ หลังจากนั้นระบบจะล็อกข้อมูล"
              : "หลังส่งแล้วยังแก้ไขได้ ตราบใดที่สถานะยังเป็น “รอดำเนินการ”"}
          </p>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => confirmRef.current?.close()}
              className="inline-flex min-h-[56px] items-center justify-center rounded-btn px-6 text-body font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className={ctaClass("brand", "disabled:pointer-events-none disabled:opacity-60")}
            >
              <Check aria-hidden className="size-[18px]" />
              {isSubmitting
                ? "กำลังบันทึก…"
                : editing
                  ? "ยืนยันการแก้ไข"
                  : "ยืนยันส่งใบสมัคร"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
