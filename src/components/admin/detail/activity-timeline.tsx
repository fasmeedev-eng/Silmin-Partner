import { FileText } from "lucide-react";
import type { Activity } from "@/lib/db/applications";

const thaiDateTime = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * เส้นเวลาแบบจุดกลม — รีสกินจากของเดิม (เส้นคั่นซ้าย) ให้ใกล้ดีไซน์อ้างอิงมากขึ้น
 * ข้อมูลเป็นของเดิมทั้งหมด: activities จาก listActivities รวมโน้ตภายในด้วย (includeInternal: true)
 * เพราะหน้านี้เป็นมุมมองของเจ้าหน้าที่ ต่างจาก /me ที่ผู้สมัครไม่เห็นโน้ตภายใน
 */
export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <section className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
      <h2 className="text-body font-semibold text-ink">ประวัติการดำเนินการ</h2>

      {activities.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-caption text-ink-48">
          <FileText aria-hidden className="size-4" />
          ยังไม่มีเหตุการณ์
        </p>
      ) : (
        <ol className="mt-4">
          {activities.map((activity, index) => (
            <li
              key={`${activity.at.toISOString()}-${index}`}
              className="relative border-l-2 border-hairline pb-6 pl-5 last:border-transparent last:pb-0"
            >
              <span
                aria-hidden
                className={`absolute -left-[7px] top-0.5 size-3 rounded-full ring-4 ring-canvas ${
                  activity.visibility === "internal" ? "bg-gold" : "bg-ink"
                }`}
              />
              {activity.visibility === "internal" ? (
                <p className="text-fine font-semibold text-gold-ink">โน้ตภายใน · ร้านไม่เห็น</p>
              ) : null}
              <p className="text-caption font-medium text-ink">{activity.message}</p>
              <p className="mt-0.5 text-fine text-ink-48">
                {thaiDateTime.format(activity.at)}
                {activity.actorLabel ? ` · โดย ${activity.actorLabel}` : " · ระบบ"}
              </p>
              {activity.changes?.length ? (
                <ul className="mt-2 space-y-1">
                  {activity.changes.map((change) => (
                    <li key={change.path} className="text-fine text-ink-80">
                      <span className="text-ink-48">{change.label}: </span>
                      <span className="line-through decoration-ink-48">{change.before}</span>
                      <span className="px-1.5 text-ink-48">→</span>
                      <span>{change.after}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
