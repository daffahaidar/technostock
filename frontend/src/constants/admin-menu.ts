/* eslint-disable @typescript-eslint/no-unused-vars */
import { LayoutDashboard, Package, Tag, Layers, MessageSquare, Users, Ticket } from "lucide-react";

const adminMenu = [
  {
    group: "Main Menu",
    menus: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Forum",
        url: "/forum/dashboard",
        icon: MessageSquare,
        isActive: false,
      },
    ],
  },
  {
    group: "Subscription Management",
    menus: [
      {
        title: "Tipe Akun",
        url: "/admin/subscriptions/account-types",
        icon: Tag, // UserSquare not imported, using Tag for now
        isActive: false,
      },
      {
        title: "Plan Subscription",
        url: "/admin/subscriptions/plans",
        icon: Layers,
        isActive: false,
      },
      {
        title: "Kode Voucher",
        url: "/admin/subscriptions/vouchers",
        icon: Ticket,
        isActive: false,
      },
    ],
  },
  {
    group: "Member Management",
    menus: [
      {
        title: "Member",
        url: "/admin/members",
        icon: Users,
        isActive: false,
      },
    ],
  },
];

export default adminMenu;
