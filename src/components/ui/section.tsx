import type { ReactNode } from "react";

type Tone = "canvas" | "parchment" | "tile";

// ตัวคั่นส่วนคือการเปลี่ยนสีพื้นเต็มความกว้าง ไม่ใช้เส้นขอบหรือเงา (DESIGN.md)
const tones: Record<Tone, string> = {
  canvas: "bg-canvas text-ink",
  parchment: "bg-parchment text-ink",
  tile: "bg-tile text-on-dark",
};

export function Section({
  tone = "canvas",
  id,
  children,
  className = "",
}: {
  tone?: Tone;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`${tones[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-16 sm:px-8 sm:py-20 lg:py-[80px]">
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`text-caption font-semibold uppercase ${
        tone === "dark" ? "text-on-dark-muted" : "text-ink-48"
      }`}
    >
      {children}
    </p>
  );
}
