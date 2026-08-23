import { LayoutDashboard, Package, Tag, Layers } from "lucide-react";

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
        title: "Plan Langganan",
        url: "/admin/subscriptions/plans",
        icon: Layers,
        isActive: false,
      },
    ],
  },
];

export default adminMenu;
