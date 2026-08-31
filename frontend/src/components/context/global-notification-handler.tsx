"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/useNotificationStore";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { useGetChatUnreadCount } from "@/app/maintainer/discussion/_queries/unread-count";

export function GlobalNotificationHandler() {
  const { data } = authClient.useSession();
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const resetUnread = useNotificationStore((state) => state.resetUnread);
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);

  const { chatUnreadCountData } = useGetChatUnreadCount(
    data?.session?.token,
    !!pathname?.startsWith("/maintainer"),
  );

  // Sinkronkan badge dengan jumlah unread dari server, kecuali saat user sedang
  // membuka halaman diskusi.
  useEffect(() => {
    const count = chatUnreadCountData?.results?.count;
    if (typeof count !== "number") return;
    if (pathname?.startsWith("/maintainer/discussion")) return;
    useNotificationStore.setState({ unreadCount: count });
  }, [chatUnreadCountData, pathname]);

  useEffect(() => {
    if (!pathname?.startsWith("/maintainer")) return;
    const token = data?.session?.token;
    const currentUserId = data?.session?.userId;
    if (!token || !currentUserId) return;

    // Use the backend WebSocket endpoint mapped globally (defaulting group_id=general assumption)
    // process.env.NEXT_PUBLIC_WS_API_URL is typically provided in .env
    const apiUrl = process.env.NEXT_PUBLIC_WS_API_URL || "ws://localhost:8000";
    const wsUrl = `${apiUrl}/api/v1/chat/ws?token=${token}&group_id=general`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Only trigger badge for New Messages not from the current user
        if (payload.type === "NewMessage" && payload.sender_id !== currentUserId) {
          if (!window.location.pathname.startsWith("/maintainer/discussion")) {
            incrementUnread();
          }
        }
      } catch {
        // Safe to ignore non-JSON or other message formats
      }
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === 1 || ws.readyState === 2 || ws.readyState === 3) {
        ws.close();
      } else {
        ws.onopen = () => ws.close();
      }
    };
  }, [data?.session?.token, data?.session?.userId, incrementUnread, pathname]);

  // Reset immediately if the user navigates into the discussion page
  useEffect(() => {
    if (!pathname?.startsWith("/maintainer")) return;
    if (pathname?.startsWith("/maintainer/discussion")) {
      resetUnread();
    }
  }, [pathname, resetUnread]);

  return null;
}
