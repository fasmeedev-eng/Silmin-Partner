"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, FileText, RefreshCw } from "lucide-react";
import type { PublicNotification } from "@/lib/db/notifications";
import { timeAgo } from "@/lib/notifications/time-ago";
import { markAllReadAction, markReadAction } from "./actions";

/** ถามซ้ำทุก 60 วินาที — เจ้าหน้าที่เปิดหน้าคิวค้างทั้งวัน ถ้าไม่ถามซ้ำเลยกระดิ่งจะนิ่งจนกว่าจะเปลี่ยนหน้า */
const POLL_MS = 60_000;

export function NotificationBell({
  initialItems,
  initialUnread,
  tone = "dark",
}: {
  initialItems: PublicNotification[];
  initialUnread: number;
  /** dark = วางบนแถบดำ (นำทาง/แถบข้าง), light = วางบนพื้นสว่าง */
  tone?: "dark" | "light";
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: PublicNotification[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // เงียบไว้ — เน็ตสะดุดชั่วคราวไม่ควรเด้ง error ใส่หน้าคนที่กำลังทำงานอื่นอยู่
    }
  }, []);

  // ถามซ้ำเป็นระยะ และถามทันทีเมื่อผู้ใช้กลับมาที่แท็บนี้ (กรณีเปิดทิ้งไว้นาน)
  useEffect(() => {
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    // เปิดแล้วถามข้อมูลใหม่ทันที — ไม่ให้เห็นรายการค้างจากรอบ poll ก่อนหน้า
    if (next) void refresh();
  };

  const handleMarkAll = async () => {
    // อัปเดตหน้าจอก่อนรอเซิร์ฟเวอร์ — การกด "อ่านทั้งหมด" ต้องรู้สึกว่าเกิดขึ้นทันที
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await markAllReadAction();
    router.refresh();
  };

  const handleClick = async (notification: PublicNotification) => {
    setOpen(false);
    if (notification.read) return;
    setItems((list) =>
      list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    setUnread((n) => Math.max(0, n - 1));
    await markReadAction(notification.id);
    router.refresh();
  };

  const onDark = tone === "dark";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          unread > 0 ? `การแจ้งเตือน — ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"
        }
        className={`relative inline-flex size-11 items-center justify-center rounded-full transition-colors ${
          onDark
            ? "text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-white"
            : "text-ink-48 hover:bg-pearl hover:text-ink"
        }`}
      >
        <Bell aria-hidden className="size-[18px]" strokeWidth={2} />
        {unread > 0 ? (
          // จุดแดงบนกระดิ่ง — แดงตรงนี้แปลว่า "มีของใหม่ที่ต้องดู" ซึ่งเป็นหน้าที่เดียวกับ
          // ปุ่มหลักในระบบ (เรียกความสนใจ) ไม่ใช่ความหมาย error จึงใช้ --brand ไม่ใช่ --danger
          <span
            aria-hidden
            className={`absolute -right-0.5 -top-0.5 flex min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-[18px] text-on-brand ${
              onDark ? "ring-2 ring-nav" : "ring-2 ring-canvas"
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="การแจ้งเตือน"
          className="nav-panel-in absolute right-0 top-[calc(100%+10px)] z-9999 w-[min(92vw,22rem)] overflow-hidden rounded-card bg-canvas text-ink shadow-lift ring-1 ring-hairline"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
            <p className="text-body font-semibold">การแจ้งเตือน</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-btn px-2.5 text-fine font-medium text-brand-ink transition-colors hover:bg-brand/[0.06]"
              >
                <CheckCheck aria-hidden className="size-4" />
                อ่านทั้งหมด
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-5 py-12 text-center text-caption leading-[1.7] text-ink-48">
              ยังไม่มีการแจ้งเตือน
              <br />
              เมื่อมีความเคลื่อนไหว จะขึ้นที่นี่
            </p>
          ) : (
            <ul className="max-h-[26rem] overflow-y-auto">
              {items.map((item) => {
                const Icon = item.type === "application_submitted" ? FileText : RefreshCw;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => void handleClick(item)}
                      className={`flex gap-3 border-b border-divider-soft px-5 py-4 transition-colors last:border-b-0 hover:bg-pearl ${
                        item.read ? "" : "bg-brand/[0.03]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                          item.read ? "bg-pearl text-ink-48" : "bg-brand text-on-brand"
                        }`}
                      >
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-caption ${item.read ? "font-medium text-ink-80" : "font-semibold text-ink"}`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-fine text-ink-48">
                          {item.body}
                        </span>
                        <span className="mt-1 block text-fine text-ink-48">
                          {timeAgo(item.createdAt)} · {item.applicationId}
                        </span>
                      </span>
                      {item.read ? null : (
                        <span
                          aria-hidden
                          className="mt-2 size-2 shrink-0 rounded-full bg-brand"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
