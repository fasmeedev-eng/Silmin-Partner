"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileText, Plus, Trash2 } from "lucide-react";
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
        publish(payload.documents);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [publish, applicationId]);

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
      setDocuments((prev) => {
        const next = [...prev, payload.document as PublicDocument];
        publish(next);
        return next;
      });
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
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      publish(next);
      return next;
    });
  };

  return (
    <div className="space-y-7">
      <p className="max-w-[60ch] text-caption text-ink-48">
        หมวดที่มีเครื่องหมาย <span className="text-accent-ink">*</span> ต้องแนบอย่างน้อย 1 ไฟล์
        ส่วนหมวดอื่นแนบเท่าที่มี · รองรับ {ALLOWED_LABEL}
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-danger/10 p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
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
            className={`rounded-lg p-6 ring-1 ring-inset ${
              missingRequired ? "ring-2 ring-accent-ink" : "ring-hairline"
            }`}
          >
            <h3 className="text-body font-semibold">
              {category.label}
              {category.required ? <span className="pl-1 text-accent-ink">*</span> : null}
            </h3>
            <p className="mt-1 text-fine text-ink-48">{category.hint}</p>

            {files.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-3 rounded-md bg-pearl p-3 ring-1 ring-hairline ring-inset"
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
                        className="block truncate text-caption text-accent-ink underline underline-offset-4"
                      >
                        {file.fileName}
                      </a>
                      <span className="text-fine text-ink-48">{humanSize(file.size)}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => void remove(file.id)}
                      aria-label={`ลบ ${file.fileName}`}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-48 transition-colors hover:bg-danger/10 hover:text-danger-ink"
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
              className="mt-4 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-pearl px-6 text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment disabled:opacity-60"
            >
              <Plus aria-hidden className="size-4" />
              {busyCategories.has(category.id)
                ? "กำลังอัปโหลด…"
                : full
                  ? `ครบ ${category.maxFiles} ไฟล์แล้ว`
                  : "เพิ่มไฟล์"}
            </button>

            {missingRequired ? (
              <p role="alert" className="mt-3 text-fine text-danger-ink">
                แนบ{category.label}อย่างน้อย 1 ไฟล์
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
