import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { findUserIdByEmail, getUserAccess, upsertUserOnSignIn } from "@/lib/db/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    /**
     * ทำงานตอนเข้าสู่ระบบสำเร็จเท่านั้น (มี account) — บันทึกผู้ใช้ลง MongoDB
     * แล้วเก็บเฉพาะ _id ไว้ใน token ไม่เก็บ role เพราะ role เปลี่ยนได้ตลอดในฐานข้อมูล
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub && profile.email) {
        token.uid = await upsertUserOnSignIn({
          googleId: profile.sub,
          email: profile.email,
          name: profile.name ?? undefined,
          image: typeof profile.picture === "string" ? profile.picture : undefined,
        });
        return token;
      }

      // ซ่อมโทเคนที่ไม่มี uid — เกิดกับโทเคนที่ออกก่อนระบบมีฐานข้อมูล
      // ถ้าไม่ซ่อม เจ้าของโทเคนนั้นจะถูกมองเป็น customer ตลอดไปแม้บทบาทในฐานข้อมูลจะเป็น admin
      // และไม่มีอะไรบนหน้าจอบอกให้เขารู้ว่าต้องออกจากระบบแล้วเข้าใหม่
      if (!token.uid && typeof token.email === "string") {
        token.uid = (await findUserIdByEmail(token.email)) ?? undefined;
      }
      return token;
    },

    /** อ่าน role จากฐานข้อมูลใหม่ (มีแคช 30 วินาที) การแก้ role ด้วยมือจึงมีผลเกือบทันที */
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid;
        const access = await getUserAccess(token.uid);
        session.user.role = access?.role ?? "customer";
        session.user.active = access?.active ?? true;
      }
      return session;
    },
  },
});
