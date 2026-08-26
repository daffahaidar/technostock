import { SquareTerminal, UserRoundCog } from "lucide-react";

const profileMenu = [
  {
    group: "General",
    menus: [
      {
        title: "Edit Profile",
        url: "/user/profile",
        icon: UserRoundCog,
        isActive: false,
      },
    ],
  },
  {
    group: "Payment & Subscription",
    menus: [
      {
        title: "Billing",
        url: "/user/billing",
        icon: SquareTerminal,
        isActive: false,
      },
      {
        title: "Transaction History",
        url: "/user/transaction",
        icon: SquareTerminal,
        isActive: false,
      },
      {
        title: "Subscription",
        url: "/user/subscription",
        icon: SquareTerminal,
        isActive: false,
      },
    ],
  },
  {
    group: "Security",
    menus: [
      {
        title: "Change Password",
        url: "/user/password",
        icon: UserRoundCog,
        isActive: false,
      },
      {
        title: "Two-Factor Authentication",
        url: "/user/two-factor",
        icon: SquareTerminal,
        isActive: false,
      },
    ],
  },
];

export default profileMenu;
