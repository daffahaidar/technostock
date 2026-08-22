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
    group: "Product Management",
    menus: [
      {
        title: "Produk",
        url: "/admin/product",
        icon: Package,
        isActive: false,
      },
      {
        title: "Kategori Produk",
        url: "/admin/product/category",
        icon: Tag,
        isActive: false,
      },
      {
        title: "Plan Produk",
        url: "/admin/product/plan",
        icon: Layers,
        isActive: false,
      },
    ],
  },
];

export default adminMenu;
