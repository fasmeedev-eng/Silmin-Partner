import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/db/users";

declare module "next-auth" {
  interface Session {
    user: {
      /** _id ของเอกสารใน collection users */
      id: string;
      role: Role;
      active: boolean;
    } & DefaultSession["user"];
  }
}

// ต้อง augment "@auth/core/jwt" ไม่ใช่ "next-auth/jwt"
// เพราะ next-auth/jwt เป็นแค่ `export * from "@auth/core/jwt"` การประกาศ interface JWT
// ทับที่ next-auth/jwt จะกลายเป็นคนละ interface ไม่ merge เข้ากับตัวจริง
declare module "@auth/core/jwt" {
  interface JWT {
    /** _id ของเอกสารใน collection users — เก็บแค่ตัวนี้ ไม่เก็บ role */
    uid?: string;
  }
}
