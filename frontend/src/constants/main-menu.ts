/* eslint-disable @typescript-eslint/no-unused-vars */
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
        title: "Market News",
        url: "/forum/market-news",
        icon: ChartCandlestick,
        isActive: false,
      },
    ],
  },
];

export default mainMenu;
