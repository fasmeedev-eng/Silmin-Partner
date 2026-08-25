"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CircleAlert, FileText, Plus, Trash2 } from "lucide-react";
import { ALLOWED_LABEL, humanSize } from "@/lib/application/documents";
import { DOCUMENT_CATEGORIES } from "@/lib/application/categories";

interface PublicDocument {
  id: string;
  category: string;
  fileName: string;
  mimeType: string;
  size: number;
}

const ACCEPT = "image/jpeg,image/png,application/pdf";

export function DocumentsStep({
  onCountsChange,
  showRequiredError,
  applicationId,
}: {
  onCountsChange: (counts: Record<string, number>) => void;
  showRequiredError: boolean;
  /** มีค่าเมื่อกำลังแก้ไขใบสมัครที่ส่งแล้ว — ไฟล์จะผูกกับใบนั้นแทนที่จะผูกกับร่าง */
  applicationId?: string;
}) {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  // เซ็ตแทนสตริงเดียว — อัปโหลดสองหมวดพร้อมกันต้องล็อกอิสระจากกัน
  const [busyCategories, setBusyCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const publish = useCallback(
    (list: PublicDocument[]) => {
      const counts: Record<string, number> = {};
      for (const document of list) {
        counts[document.category] = (counts[document.category] ?? 0) + 1;
      }
      onCountsChange(counts);
    },
    [onCountsChange],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
      const response = await fetch(`/api/apply/documents${query}`);
      if (!active) return;
      if (response.ok) {
        const payload = (await response.json()) as { documents: PublicDocument[] };
        setDocuments(payload.documents);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applicationId]);

  /**
   * รายงานจำนวนไฟล์ขึ้นไปให้ ApplyForm จาก effect เท่านั้น ห้ามเรียกจากที่อื่น
   *
   * เดิมเรียก publish() อยู่ข้างใน updater ของ setDocuments ซึ่งดูเหมือนจะสะดวกเพราะมี next
   * อยู่ในมือแล้ว แต่ React เรียก updater ระหว่าง render phase และเรียกซ้ำได้มากกว่าหนึ่งครั้ง
   * การ setState ของคอมโพเนนต์แม่จากตรงนั้นจึงได้ error "Cannot update a component while
   * rendering a different component" — updater ต้องเป็นฟังก์ชันบริสุทธิ์ ผลข้างเคียงทั้งหมด
   * ต้องรอให้ state เปลี่ยนเสร็จก่อนแล้วค่อยทำใน effect
   *
   * ปลอดภัยจากลูปเพราะ onCountsChange ฝั่ง ApplyForm ถูก useCallback ไว้ identity จึงคงที่
   *
   * เงื่อนไข loading สำคัญ ไม่ใช่การกันพลาดเผื่อไว้เฉย ๆ — ผู้ใช้ที่ถอยกลับไปขั้นก่อนหน้าแล้ว
   * กลับมาขั้นนี้อีกครั้งจะทำให้คอมโพเนนต์นี้ mount ใหม่และเริ่มที่ documents = [] ถ้าปล่อยให้
   * รายงานตอนนั้น ApplyForm จะได้ค่าว่างทับของเดิมชั่วขณะระหว่างรอ fetch แล้วปุ่ม "ถัดไป"
   * จะบล็อกทั้งที่ผู้ใช้แนบไฟล์ครบไปแล้ว รายงานเฉพาะตอนที่รู้จำนวนไฟล์จริงเท่านั้น
   */
  useEffect(() => {
    if (loading) return;
    publish(documents);
  }, [documents, loading, publish]);

  const upload = async (categoryId: string, file: File) => {
    setError(undefined);
    setBusyCategories((prev) => new Set(prev).add(categoryId));

    const body = new FormData();
    body.set("category", categoryId);
    body.set("file", file);
    if (applicationId) body.set("applicationId", applicationId);

    const response = await fetch("/api/apply/documents", { method: "POST", body });
    const payload = (await response.json()) as { document?: PublicDocument; message?: string };

    if (!response.ok || !payload.document) {
      setError(payload.message ?? "อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } else {
      // อัปเดตแบบ functional กันกรณีอัปโหลดสองหมวดพร้อมกัน — ค่า documents ที่ปิดคลุมไว้ตอนเรียก
      // ฟังก์ชันนี้อาจเก่ากว่าที่อีกคำขอเพิ่งเขียนไปแล้ว
      setDocuments((prev) => [...prev, payload.document as PublicDocument]);
    }
    setBusyCategories((prev) => {
      const next = new Set(prev);
      next.delete(categoryId);
      return next;
    });
  };

  const remove = async (id: string) => {
    setError(undefined);
    const response = await fetch("/api/apply/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, applicationId }),
    });
    if (!response.ok) {
      setError("ลบไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-7">
      <p className="max-w-[60ch] text-caption text-ink-48">
        หมวดที่มีเครื่องหมาย <span className="text-brand">*</span> ต้องแนบอย่างน้อย 1 ไฟล์
        ส่วนหมวดอื่นแนบเท่าที่มี · รองรับ {ALLOWED_LABEL}
      </p>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-inset ring-danger/25"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
          {error}
        </p>
      ) : null}

      {DOCUMENT_CATEGORIES.map((category) => {
        const files = documents.filter((d) => d.category === category.id);
        const full = files.length >= category.maxFiles;
        const missingRequired = showRequiredError && category.required && files.length === 0;

        return (
          <section
            key={category.id}
            className={`rounded-card p-6 ring-1 ring-inset transition-colors ${
              missingRequired ? "bg-danger/[0.04] ring-2 ring-danger" : "bg-pearl ring-hairline"
            }`}
          >
            <h3 className="text-body font-semibold">
              {category.label}
              {category.required ? <span className="pl-1 text-brand">*</span> : null}
            </h3>
            <p className="mt-1.5 text-fine text-ink-48">{category.hint}</p>

            {files.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 rounded-input bg-canvas p-3 ring-1 ring-hairline ring-inset"
                  >
                    {file.mimeType.startsWith("image/") ? (
                      <Image
                        src={`/api/documents/${file.id}`}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="size-12 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-parchment">
                        <FileText aria-hidden className="size-5 text-ink-48" />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <a
                        href={`/api/documents/${file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-caption font-medium text-brand-ink underline underline-offset-4 hover:text-brand-hover"
                      >
                        {file.fileName}
                      </a>
                      <span className="text-fine text-ink-48">{humanSize(file.size)}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => void remove(file.id)}
                      aria-label={`ลบ ${file.fileName}`}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-48 transition-colors hover:bg-danger/10 hover:text-danger-ink focus-visible:outline-danger-focus"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <input
              ref={(el) => {
                inputRefs.current[category.id] = el;
              }}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void upload(category.id, file);
              }}
            />
            <button
              type="button"
              disabled={loading || full || busyCategories.has(category.id)}
              onClick={() => inputRefs.current[category.id]?.click()}
              className="mt-4 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-canvas px-6 text-body font-medium text-ink ring-1 ring-hairline ring-inset transition-all hover:-translate-y-0.5 hover:shadow-soft hover:ring-ink-48/40 disabled:pointer-events-none disabled:opacity-60 motion-reduce:hover:translate-y-0"
            >
              <Plus aria-hidden className="size-[18px]" />
              {busyCategories.has(category.id)
                ? "กำลังอัปโหลด…"
                : full
                  ? `ครบ ${category.maxFiles} ไฟล์แล้ว`
                  : "เพิ่มไฟล์"}
            </button>

            {missingRequired ? (
              <p
                role="alert"
                className="mt-3 flex items-start gap-1.5 text-fine text-danger-ink"
              >
                <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2.25} />
                แนบ{category.label}อย่างน้อย 1 ไฟล์
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
