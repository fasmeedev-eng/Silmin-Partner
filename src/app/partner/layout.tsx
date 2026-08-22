import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { guardRole } from "@/lib/auth/guard";

/**
 * พื้นที่ระยะที่ 2 (สัญญา บัญชีธนาคาร ข้อมูลผู้มีอำนาจ) ยังไม่ได้สร้าง
 *
 * TODO: กติกาการเข้าถึงจริงยังไม่ถูกกำหนด — ปลายทางน่าจะเป็นเจ้าของร้านที่สถานะ ActivePartner
 * ระหว่างนี้ล็อกไว้ให้ admin เท่านั้น เพราะหน้าเปล่าที่ใครก็เข้าได้คือหนี้ที่รอวันระเบิด
 * เมื่อสร้างระยะที่ 2 ให้เปลี่ยนเงื่อนไขเป็นการตรวจว่าผู้ใช้มีใบสมัครสถานะ ActivePartner จริง
 */
export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await guardRole(["admin"]);

  if (!result.allowed) {
    if (result.reason === "unauthenticated") redirect("/login?callbackUrl=/partner");
    return <AccessDenied reason={result.reason} role={result.role} email={result.email} />;
  }

  return <>{children}</>;
}
