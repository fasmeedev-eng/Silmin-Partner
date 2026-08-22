import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { loadDraft } from "@/lib/db/applications";
import { ApplyForm } from "./apply-form";

export const metadata = { title: "ใบสมัครพาร์ทเนอร์" };

export default async function ApplyPage() {
  const session = await auth();
  // middleware กันไว้อีกชั้นแล้ว แต่หน้าเซิร์ฟเวอร์ต้องไม่เชื่อว่ามีคนกันให้เสมอ
  if (!session?.user?.id) redirect("/login?callbackUrl=/apply");

  const draft = await loadDraft(session.user.id);

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
      <SiteHeader signedIn email={session.user.email} role={session.user.role} />
      <main>
        <ApplyForm initialData={initialData} />
      </main>
    </>
  );
}
