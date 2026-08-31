/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  MessageSquare,
  Users,
  Ticket,
  Wallet,
} from "lucide-react";

const managementMenu = [
  {
    group: "Main Menu",
    menus: [
      {
        title: "Dashboard",
        url: "/management/dashboard",
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
        url: "/management/subscriptions/account-types",
        icon: Tag, // UserSquare not imported, using Tag for now
        isActive: false,
      },
      {
        title: "Plan Subscription",
        url: "/management/subscriptions/plans",
        icon: Layers,
        isActive: false,
      },
      {
        title: "Kode Voucher",
        url: "/management/subscriptions/vouchers",
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
        url: "/management/members",
        icon: Users,
        isActive: false,
      },
    ],
  },
  {
    group: "Financial Management",
    menus: [
      {
        title: "Financial Reports",
        url: "/management/finances/reports",
        icon: Wallet,
        isActive: false,
      },
    ],
  },
];

export default managementMenu;
