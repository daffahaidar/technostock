import { MessagesSquare, SquareTerminal } from "lucide-react";

const maintainerMenu = [
  {
    group: "Main Menu",
    menus: [
      {
        title: "Dashboard",
        url: "/maintainer/dashboard",
        icon: SquareTerminal,
        isActive: true,
      },
    ],
  },
  {
    group: "RnD Area",
    menus: [
      {
        title: "Member Discussion",
        url: "/maintainer/discussion",
        icon: MessagesSquare,
        isActive: false,
      },
    ],
  },
];

export default maintainerMenu;
