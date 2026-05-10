import { ChartCandlestick, MessagesSquare, SquareTerminal } from "lucide-react";

const mainMenu = [
  {
    group: "Main Menu",
    menus: [
      {
        title: "Dashboard",
        url: "/forum/dashboard",
        icon: SquareTerminal,
        isActive: true,
        items: [
          {
            title: "Dashboard",
            url: "/forum/dashboard",
          },
        ],
      },
    ],
  },
  {
    group: "Member Area",
    menus: [
      {
        title: "Member Discussion",
        url: "/forum/discussion",
        icon: MessagesSquare,
        isActive: false,
      },
      {
        title: "Market News",
        url: "/forum/market-news",
        icon: ChartCandlestick,
        isActive: false,
      },
    ],
  },
];

export default mainMenu;
