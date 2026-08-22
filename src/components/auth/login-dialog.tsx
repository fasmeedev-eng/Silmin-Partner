"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import { resolveRedirect } from "@/lib/safe-redirect";
import { GoogleMark } from "./google-mark";

type OpenLogin = (callbackUrl?: string) => void;

const LoginDialogContext = createContext<OpenLogin>(() => {});

export function useLoginDialog() {
  return useContext(LoginDialogContext);
}

// เหตุผลที่ต้องเข้าสู่ระบบ อยู่ตรงจุดที่ผู้ใช้ถามคำถามนั้นพอดี ไม่ต้องมีทั้งส่วนบนหน้าแรก
const reasons = [
  "กรอกไม่จบ ระบบเก็บร่างไว้ให้ กลับมากรอกต่อได้",
  "ติดตามสถานะใบสมัครเองได้ ไม่ต้องโทรถาม",
  "อัปโหลดเอกสารเพิ่มได้เมื่อเจ้าหน้าที่ขอ",
];

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [redirectTo, setRedirectTo] = useState("/after-login");
  const [pending, setPending] = useState(false);

  // จำปลายทางจากปุ่มที่ผู้ใช้กด แล้วพากลับมาที่นั่นหลังล็อกอินสำเร็จ
  // ต้องล้าง pending ทุกครั้งที่เปิดใหม่ ไม่งั้นถ้าครั้งก่อนกดแล้วยกเลิก
  // ปุ่มจะค้างเป็น disabled ตลอดไปและปลายทางจะติดค่าเดิม
  const open = useCallback<OpenLogin>((next = "/after-login") => {
    setPending(false);
    setRedirectTo(resolveRedirect(next, window.location.origin, "/after-login"));
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // ปิดเมื่อคลิกพื้นหลัง — Esc เบราว์เซอร์จัดการให้อยู่แล้ว
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    // ปิดด้วยวิธีไหนก็ตาม (ปุ่มกากบาท คลิกพื้นหลัง Esc) ให้กลับสู่สถานะพร้อมใช้
    const onClose = () => setPending(false);

    dialog.addEventListener("click", onClick);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  return (
    <LoginDialogContext.Provider value={open}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="login-dialog-title"
        className="login-dialog m-auto w-[min(92vw,26rem)] rounded-lg bg-canvas p-0 text-ink backdrop:bg-black/50"
      >
        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="login-dialog-title" className="text-h3">
              เข้าสู่ระบบเพื่อเริ่มกรอกใบสมัคร
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="ปิด"
              className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-48 transition-colors hover:bg-parchment hover:text-ink"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <ul className="mt-5 space-y-2.5">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-caption text-ink-80">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-ink" />
                {reason}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPending(true);
              // v5 ใช้ redirectTo — callbackUrl เป็นชื่อเดิมของ v4 ที่ถูก deprecate แล้ว
              // ถ้าเรียกไม่สำเร็จ (เน็ตหลุด เซิร์ฟเวอร์ล่ม) ต้องคืนปุ่มให้กดใหม่ได้
              // กรณีสำเร็จเบราว์เซอร์จะออกจากหน้านี้ไปเอง จึงไม่ต้องรีเซ็ต
              void signIn("google", { redirectTo }).catch(() => setPending(false));
            }}
            className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-pearl text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment disabled:opacity-60"
          >
            <GoogleMark />
            {pending ? "กำลังพาไปหน้า Google…" : "เข้าสู่ระบบด้วย Google"}
          </button>

          <p className="mt-5 text-fine text-ink-48">
            เราขอจากบัญชี Google ของคุณแค่ชื่อและอีเมลเท่านั้น
            ไม่มีสิทธิ์อ่านอีเมลหรือไฟล์ใน Google Drive ของคุณ
          </p>
        </div>
      </dialog>
    </LoginDialogContext.Provider>
  );
}
