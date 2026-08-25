import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { CtaButton } from "@/components/ui/cta-button";
import { ApplyForm } from "@/app/apply/apply-form";
import { findOwnApplication } from "@/lib/db/applications";
import { isActivePartnerUser } from "@/lib/auth/guard";
import { STATUS_META, editBlockedReason, isEditable } from "@/lib/application/status";
import { draftSchema } from "@/lib/application/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return { title: `แก้ไขใบสมัคร ${applicationId}` };
}

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/me");

  const { applicationId } = await params;
  const application = await findOwnApplication(session.user.id, applicationId);
  // ไม่พบ = ไม่มีจริง หรือไม่ใช่ของคนนี้ ตอบเหมือนกันทั้งสองกรณี
  if (!application) redirect("/me");

  const isActivePartner = await isActivePartnerUser(session.user.id, session.user.role);

  // ด่านนี้เป็นแค่ UX — updateApplicationAction ตรวจสถานะซ้ำบนเซิร์ฟเวอร์ตอนกดบันทึกอยู่แล้ว
  if (!isEditable(application.status)) {
    return (
      <>
        <SiteHeader
          signedIn
          email={session.user.email}
          role={session.user.role}
          isActivePartner={isActivePartner}
        />
        <main className="surface-tint min-h-svh">
          <div className="mx-auto w-full max-w-[560px] px-6 py-16 lg:px-8 lg:py-24">
            <span className="flex size-14 items-center justify-center rounded-full bg-pearl ring-1 ring-hairline">
              <Lock aria-hidden className="size-6 text-ink-48" strokeWidth={1.6} />
            </span>
            <h1 className="mt-7 text-h3 font-bold">แก้ไขใบสมัครนี้ไม่ได้แล้ว</h1>
            <p className="mt-4 text-lead text-ink-80">
              {editBlockedReason(application.status)}
            </p>
            <p className="mt-4 text-caption text-ink-48">
              สถานะปัจจุบัน: {STATUS_META[application.status].label}
            </p>
            <div className="mt-9">
              <CtaButton href={`/me/${applicationId}`} variant="brand-outline">
                <ArrowLeft aria-hidden className="size-[18px]" />
                กลับไปดูใบสมัคร
              </CtaButton>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ความยินยอมถูกเก็บเป็นหลักฐานแยกไว้ตอนส่งครั้งแรกแล้ว (พร้อม timestamp, IP, เวอร์ชันนโยบาย)
  // ฟอร์มจึงติ๊กให้เพื่อให้ผ่านการตรวจ แต่ไม่ถามซ้ำและไม่เขียนทับหลักฐานเดิม
  // ใบสมัครที่ส่งไว้ก่อนหน้านี้ไม่มีคีย์ของช่องที่เพิ่มมาทีหลัง (หมู่ที่/ซอย/จุดสังเกต)
  // ต้องผ่าน draftSchema ให้เติมค่าว่างก่อนส่งเข้าฟอร์ม ไม่งั้น input ของ React จะเป็น uncontrolled
  // แล้วสลับเป็น controlled ตอนผู้ใช้พิมพ์ — กติกาของฟอร์มนี้คือทุกช่องเป็นสตริงเสมอ ไม่มี undefined
  const restored = draftSchema.safeParse(application.data);
  const initialData = {
    ...(restored.success ? restored.data : application.data),
    consent: { truthful: true, pdpa: true },
  };

  return (
    <>
      <SiteHeader
        signedIn
        email={session.user.email}
        role={session.user.role}
        isActivePartner={isActivePartner}
      />
      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[860px] px-6 pt-10 lg:px-8">
          <Link
            href={`/me/${applicationId}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-caption text-ink-80 transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            ยกเลิกและกลับไปดูใบสมัคร
          </Link>
          <p className="mt-2 text-caption tabular-nums text-ink-48">
            กำลังแก้ไข {application.applicationId}
          </p>
        </div>
        <ApplyForm initialData={initialData} applicationId={applicationId} />
      </main>
    </>
  );
}
