import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { loadDraft } from "@/lib/db/applications";
import { isActivePartnerUser } from "@/lib/auth/guard";
import { ApplyForm } from "./apply-form";

export const metadata = { title: "ใบสมัครพาร์ทเนอร์" };

export default async function ApplyPage() {
  const session = await auth();
  // middleware กันไว้อีกชั้นแล้ว แต่หน้าเซิร์ฟเวอร์ต้องไม่เชื่อว่ามีคนกันให้เสมอ
  if (!session?.user?.id) redirect("/login?callbackUrl=/apply");

  const [draft, isActivePartner] = await Promise.all([
    loadDraft(session.user.id),
    isActivePartnerUser(session.user.id, session.user.role),
  ]);

  // เติมชื่อและอีเมลจากบัญชี Google ให้ ถ้าผู้ใช้ยังไม่ได้แก้เอง
  // ลดจำนวนช่องที่ต้องพิมพ์บนมือถือ ซึ่งเป็นอุปกรณ์หลักของหน้านี้
  const initialData = {
    ...draft,
    contact: {
      ...draft.contact,
      fullName: draft.contact.fullName || (session.user.name ?? ""),
      email: draft.contact.email || (session.user.email ?? ""),
    },
  };

  return (
    <>
      <SiteHeader
        signedIn
        email={session.user.email}
        role={session.user.role}
        isActivePartner={isActivePartner}
      />
      {/* พื้นอุ่นเดียวกับแบนเนอร์ — การ์ดฟอร์มสีขาวจึงอ่านออกว่าเป็นอีกระนาบหนึ่ง
          min-h-svh กันไม่ให้พื้นขาวโผล่ใต้ฟอร์มตอนขั้นที่เนื้อหาสั้น ๆ */}
      <main className="surface-tint min-h-svh">
        <ApplyForm initialData={initialData} />
      </main>
    </>
  );
}
