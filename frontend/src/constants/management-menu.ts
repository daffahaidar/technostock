import { LayoutDashboard, Package } from "lucide-react";

const managementMenu = [
  {
    group: "Management",
    menus: [
      {
        title: "Dashboard",
        url: "/management/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Product",
        url: "/management/product",
        icon: Package,
        isActive: false,
        items: [
          {
            title: "Product Category",
            url: "/management/product/category",
          },
          {
            title: "Product Plan",
            url: "/management/product/plan",
          },
          {
            title: "Product Item",
            url: "/management/product",
          },
        ],
      },
    ],
  },
];

export default managementMenu;
