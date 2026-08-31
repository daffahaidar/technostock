// Sumber kebenaran role di frontend. Urut dari wewenang tertinggi ke terendah,
// sama dengan enum `Role` di shared-core dan CHECK constraint `users.users`.
//
// Maintainer  role tertinggi, akses penuh
// Owner       menyetujui tindakan Admin (fiturnya belum ada) — untuk sekarang
//             wewenangnya sama dengan Admin
// Admin       kelola tipe akun, plan, voucher, member
// Member      user dengan langganan aktif
// User        role default saat registrasi
export const ROLES = [
  "Maintainer",
  "Owner",
  "Admin",
  "Member",
  "User",
] as const;

export type Role = (typeof ROLES)[number];

// Halaman awal tiap role setelah login / saat ditolak dari route lain.
export const ROLE_DASHBOARDS: Record<string, string> = {
  Maintainer: "/maintainer/dashboard",
  Owner: "/management/dashboard",
  Admin: "/admin/dashboard",
  Member: "/forum/dashboard",
  User: "/",
};

// Cocok dengan RequireRole("Maintainer", "Owner", "Admin") di main-service.
export const ADMIN_ROLES: string[] = ["Maintainer", "Owner", "Admin"];

// Boleh masuk /forum: staf + member berlangganan.
export const FORUM_ROLES: string[] = [...ADMIN_ROLES, "Member"];

// Staf tidak perlu berlangganan — semua fitur member sudah terbuka untuk mereka.
export const isFullAccessRole = (role?: string | null) =>
  ADMIN_ROLES.some((r) => r.toLowerCase() === role?.toLowerCase());
