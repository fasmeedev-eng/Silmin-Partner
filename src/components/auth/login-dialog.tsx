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
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Check, ShieldCheck, X } from "lucide-react";
import sgMark from "@/components/brand/sg-mark.png";
import { resolveRedirect } from "@/lib/safe-redirect";
import { GoogleMark } from "./google-mark";

type OpenLogin = (callbackUrl?: string) => void;

const LoginDialogContext = createContext<OpenLogin>(() => {});

export function useLoginDialog() {
  return useContext(LoginDialogContext);
}

// เหตุผลที่ต้องเข้าสู่ระบบ อยู่ตรงจุดที่ผู้ใช้ถามคำถามนั้นพอดี ไม่ต้องมีทั้งส่วนบนหน้าแรก
const REASONS = [
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
        className="login-dialog m-auto w-[min(92vw,27rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
      >
        <div className="p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            {/* เครื่องหมายแบรนด์ตรงหัวป็อปอัป — จังหวะที่ขอให้คนล็อกอินคือจังหวะที่เขาถามว่า
                "นี่เว็บของใคร" การมีโลโก้อยู่ตรงนั้นตอบคำถามนั้นก่อนที่เขาจะต้องถาม */}
            <Image src={sgMark} alt="" priority className="h-10 w-auto" sizes="44px" />
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="ปิด"
              className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-48 transition-colors hover:bg-pearl hover:text-ink"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <h2 id="login-dialog-title" className="mt-5 text-h3 font-bold leading-[1.32]">
            เข้าสู่ระบบเพื่อเริ่มกรอกใบสมัคร
          </h2>
          <p className="mt-3 text-caption leading-[1.7] text-ink-80">
            ใช้บัญชี Google ของคุณ ไม่ต้องตั้งรหัสผ่านใหม่ และไม่ต้องจำเลขที่ใบสมัคร
          </p>

          {/* ใช้ติ๊กถูกแดงจางแบบเดียวกับรายการสิทธิประโยชน์บนหน้าแรก — คนคนเดียวกันเพิ่งอ่านมันมา */}
          <ul className="mt-6 space-y-3">
            {REASONS.map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-caption text-ink-80">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-brand/10"
                >
                  <Check className="size-3.5 text-brand-ink" strokeWidth={3} />
                </span>
                {reason}
              </li>
            ))}
          </ul>

          {/* ปุ่ม Google ตั้งใจไม่ทำเป็นสีแบรนด์แดง — แนวปฏิบัติของ Google คือปุ่มพื้นขาว
              ตัวอักษรเข้ม พร้อมโลโก้สี่สีที่คนจำได้ การย้อมมันเป็นสีเราทำให้คนลังเลว่ากดแล้วไปไหน
              ตรงนี้จึงให้ความเด่นด้วยขนาดและเงาแทนสี และเป็นปุ่มเดียวในกล่องอยู่แล้ว */}
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
            className="mt-7 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-btn bg-canvas text-body font-semibold text-ink shadow-soft ring-1 ring-hairline ring-inset transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift hover:ring-ink-48/40 disabled:pointer-events-none disabled:opacity-60 motion-reduce:hover:translate-y-0"
          >
            <GoogleMark />
            {pending ? "กำลังพาไปหน้า Google…" : "เข้าสู่ระบบด้วย Google"}
          </button>

          <p className="mt-6 flex items-start gap-2.5 rounded-input bg-pearl p-4 text-fine leading-[1.7] text-ink-48 ring-1 ring-hairline ring-inset">
            <ShieldCheck aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.9} />
            เราขอจากบัญชี Google ของคุณแค่ชื่อและอีเมลเท่านั้น
            ไม่มีสิทธิ์อ่านอีเมลหรือไฟล์ใน Google Drive ของคุณ
          </p>
        </div>
      </dialog>
    </LoginDialogContext.Provider>
  );
}
