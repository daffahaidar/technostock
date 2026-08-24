"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/useNotificationStore";
import { authClient } from "@/app/auth/sign-in/_handlers/client";

export function GlobalNotificationHandler() {
  const { data } = authClient.useSession();
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const resetUnread = useNotificationStore((state) => state.resetUnread);
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);



  useEffect(() => {
    if (!pathname?.startsWith("/maintainer")) return;
    const token = data?.session?.token;
    const currentUserId = data?.session?.userId;
    if (!token || !currentUserId) return;

    // Use the backend WebSocket endpoint mapped globally (defaulting group_id=general assumption)
    // process.env.NEXT_PUBLIC_WS_API_URL is typically provided in .env
    const apiUrl = process.env.NEXT_PUBLIC_WS_API_URL || "ws://localhost:8000";
    const httpApiUrl = apiUrl.replace("ws://", "http://").replace("wss://", "https://");
    const wsUrl = `${apiUrl}/api/v1/chat/ws?token=${token}&group_id=general`;

    // Fetch initial unread count from the new Read Receipts Backend implementation
    fetch(`${httpApiUrl}/api/v1/chat/unread-count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // Fail silently to avoid Next.js dev overlay catching console.error
          return null;
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data && data?.meta?.status === "success" && typeof data?.results?.count === "number") {
          // If we are currently NOT on the discussion page, set the loaded unread count.
          if (!window.location.pathname.startsWith("/maintainer/discussion")) {
            // Note: we might want to just set it to the count exactly.
            // Since `useNotificationStore` only has increment and reset, we'll augment it!
            // Wait, we need a setUnread method in the store. Let's just do it directly if needed,
            // or we'll have to useNotificationStore.setState({ unreadCount: count });
            useNotificationStore.setState({ unreadCount: data.results.count });
          }
        }
      })
      .catch(() => {
        // Silently ignore connection errors when the chat service is not running
      });

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
