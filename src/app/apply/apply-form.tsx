"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { STEPS } from "@/lib/application/options";
import { REQUIRED_CATEGORIES } from "@/lib/application/categories";
import { validateStep, type ApplicationData } from "@/lib/application/schema";
import { saveDraftAction, submitAction, updateApplicationAction } from "./actions";
import { DocumentsStep } from "./documents-step";
import {
  BusinessStep,
  ContactStep,
  InterestsStep,
  ReviewStep,
  SalesStep,
  ShopStep,
} from "./steps";

const LAST_STEP = STEPS.length - 1;

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
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-8 sm:px-8 sm:pb-20">
      {/* แถบความคืบหน้า — บอกเสมอว่าอยู่ขั้นไหนและเหลืออีกกี่ขั้น */}
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-caption text-ink-48">
            ขั้นที่ {stepIndex + 1} จาก {STEPS.length}
          </p>
          <p className="text-caption text-ink-48" aria-live="polite">
            {editing ? "กำลังแก้ไขใบสมัครที่ส่งแล้ว" : null}
            {!editing && saveState === "saving" ? "กำลังบันทึกร่าง…" : null}
            {!editing && saveState === "saved" ? "บันทึกร่างแล้ว" : null}
          </p>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-divider-soft"
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="ความคืบหน้าการกรอกใบสมัคร"
        >
          <div
            className="h-full rounded-full bg-accent-ink transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 text-h3 focus:outline-none sm:text-h2"
      >
        {step.title}
      </h1>

      <div className="mt-6">
        {step.id === "shop" ? <ShopStep {...stepProps} /> : null}
        {step.id === "contact" ? <ContactStep {...stepProps} /> : null}
        {step.id === "business" ? <BusinessStep {...stepProps} /> : null}
        {step.id === "sales" ? <SalesStep {...stepProps} /> : null}
        {step.id === "documents" ? (
          <DocumentsStep
            onCountsChange={(counts) => {
              setDocumentCounts(counts);
              if (REQUIRED_CATEGORIES.every((c) => counts[c.id] > 0)) setDocumentError(false);
            }}
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
        <p role="alert" className="mt-6 rounded-md bg-pearl p-4 text-caption text-accent-ink ring-1 ring-hairline ring-inset">
          {submitError}
        </p>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex min-h-[52px] items-center gap-2 rounded-full px-5 text-body text-ink-80 transition-colors hover:text-ink disabled:invisible"
        >
          <ArrowLeft aria-hidden className="size-4" />
          ย้อนกลับ
        </button>

        {stepIndex < LAST_STEP ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
          >
            ถัดไป
            <ArrowRight aria-hidden className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={openConfirm}
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-7 text-body font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            {editing ? "บันทึกการแก้ไข" : "ส่งใบสมัคร Partner"}
          </button>
        )}
      </div>

      <dialog
        ref={confirmRef}
        aria-labelledby="confirm-title"
        className="login-dialog m-auto w-[min(92vw,26rem)] rounded-lg bg-canvas p-0 text-ink backdrop:bg-black/50"
      >
        <div className="p-7">
          <h2 id="confirm-title" className="text-h3">
            {editing ? "ยืนยันการแก้ไข" : "ตรวจสอบข้อมูล"}
          </h2>
          <p className="mt-4 text-caption text-ink-80">
            {editing
              ? "ข้อมูลใหม่จะแทนที่ข้อมูลเดิมในใบสมัครนี้ และบันทึกไว้ในประวัติการแก้ไข"
              : "กรุณาตรวจสอบข้อมูลก่อนส่งใบสมัคร เมื่อกด “ยืนยันส่งใบสมัคร” ข้อมูลจะถูกส่งให้บริษัทตรวจสอบ"}
          </p>
          <p className="mt-3 text-fine text-ink-48">
            {editing
              ? "แก้ไขได้จนกว่าเจ้าหน้าที่จะเริ่มตรวจสอบ หลังจากนั้นระบบจะล็อกข้อมูล"
              : "หลังส่งแล้วยังแก้ไขได้ ตราบใดที่สถานะยังเป็น “รอดำเนินการ”"}
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => confirmRef.current?.close()}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full px-6 text-body text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent px-6 text-body font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              <Check aria-hidden className="size-4" />
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
