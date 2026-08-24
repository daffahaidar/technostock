import { useEffect, useRef, useState } from "react";

import type { MessageWithSender, TypingUser, ReactionSummary } from "../types/chat";

interface UseChatWebSocketOptions {
  accessToken?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  currentUserAvatar?: string;
  groupId?: string;
  initialMessages?: MessageWithSender[];
}

interface UseChatWebSocketReturn {
  messages: MessageWithSender[];
  typingUsers: TypingUser[];
  sendMessage: (
    content: string,
    replyToId?: string | null,
    imageUrl?: string | null,
  ) => void;
  sendTyping: () => void;
  sendReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  prependMessages: (olderMessages: MessageWithSender[]) => void;
  isConnected: boolean;
  onlineCount: number;
  reactionOverrides: Record<string, ReactionSummary[]>;
  editedOverrides: Record<string, MessageWithSender>;
  deletedMessageIds: Set<string>;
}

export function useChatWebSocket({
  accessToken,
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
  groupId = "general",
  initialMessages = [],
}: UseChatWebSocketOptions): UseChatWebSocketReturn {
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<string, ReactionSummary[]>
  >({});
  const [editedOverrides, setEditedOverrides] = useState<
    Record<string, MessageWithSender>
  >({});
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(
    new Set(),
  );

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const prependMessages = (olderMessages: MessageWithSender[]) => {
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMessages = olderMessages.filter((m) => !existingIds.has(m.id));
      return [...newMessages, ...prev];
    });
  };

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_API_URL}/api/v1/chat/ws?token=${accessToken}&group_id=${groupId}`,
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "NewMessage") {
          setMessages((prev) => {
            // Jika pesan dari diri sendiri, replace optimistic message dengan data real dari server
            if (data.sender_id === currentUserId) {
              const reversedIdx = [...prev]
                .reverse()
                .findIndex(
                  (m) =>
                    m.content === data.content &&
                    m.sender_id === currentUserId &&
                    m.id !== data.id,
                );

              if (reversedIdx !== -1) {
                const realIdx = prev.length - 1 - reversedIdx;
                const updated = [...prev];
                updated[realIdx] = data;
                return updated;
              }
            }

            return [...prev, data];
          });

          setTypingUsers((prev) =>
            prev.filter((u) => u.user_id !== data.sender_id),
          );
        } else if (
          data.type === "UserTyping" &&
          data.user_id !== currentUserId
        ) {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.user_id === data.user_id)) {
              return [
                ...prev,
                { user_id: data.user_id, user_name: data.user_name },
              ];
            }
            return prev;
          });

          if (typingTimeouts.current[data.user_id]) {
            clearTimeout(typingTimeouts.current[data.user_id]);
          }

          typingTimeouts.current[data.user_id] = setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((u) => u.user_id !== data.user_id),
            );
          }, 3000);
        } else if (data.type === "ReactionUpdate") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.message_id
                ? { ...msg, reactions: data.reactions }
                : msg,
            ),
          );
          setReactionOverrides((prev) => ({
            ...prev,
            [data.message_id]: data.reactions,
          }));
        } else if (data.type === "OnlineUsersCount") {
          setOnlineCount(data.count);
        } else if (data.type === "MessageEdited") {
          // data contains the full updated MessageWithSender object
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.id ? data : msg)),
          );
          setEditedOverrides((prev) => ({ ...prev, [data.id]: data }));
        } else if (data.type === "MessageDeleted") {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== data.message_id),
          );
          setDeletedMessageIds((prev) => {
            const next = new Set(prev);
            next.add(data.message_id);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket connection closed");
    };

    wsRef.current = ws;

    return () => {
      // Dalam mode Strict React, unmount component terjadi sangat cepat sebelum WS OPEN
      // Hal ini memicu "failed: WebSocket is closed before the connection is established."
      // Cegah error warning di console dengan menunda penutupan jika socket masih CONNECTING
      if (ws.readyState === 0) {
        ws.onopen = () => ws.close();
      } else {
        ws.close();
      }
    };
  }, [accessToken, currentUserId, currentUserName, currentUserRole, currentUserAvatar, groupId]);

  const sendMessage = (
    content: string,
    replyToId?: string | null,
    imageUrl?: string | null,
  ) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Optimistic update — langsung masuk ke state secara sync
      const optimisticMessage: MessageWithSender = {
        id: crypto.randomUUID(),
        content,
        sender_id: currentUserId ?? "",
        sender_name: currentUserName ?? "",
        sender_role: currentUserRole ?? "",
        sender_avatar_url: currentUserAvatar ?? "",
        reply_to_id: replyToId ?? undefined,
        replied_message_content: undefined,
        replied_sender_name: undefined,
        reactions: [],
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      wsRef.current.send(
        JSON.stringify({
          event_type: "message",
          content,
          reply_to_id: replyToId ?? null,
          image_url: imageUrl ?? null,
        }),
      );
    }
  };

  const sendTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event_type: "typing" }));
    }
  };

  const sendReaction = (messageId: string, emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ event_type: "react", message_id: messageId, emoji }),
      );
    }
  };

  const editMessage = (messageId: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content, is_edited: true } : msg,
        ),
      );
      setEditedOverrides((prev) => {
        const existing = prev[messageId];
        if (existing) {
          return {
            ...prev,
            [messageId]: { ...existing, content, is_edited: true },
          };
        }
        return prev;
      });

      wsRef.current.send(
        JSON.stringify({ event_type: "edit", message_id: messageId, content }),
      );
    }
  };

  const deleteMessage = (messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Optimistic delete
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setDeletedMessageIds((prev) => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });

      wsRef.current.send(
        JSON.stringify({ event_type: "delete", message_id: messageId }),
      );
    }
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReaction,
    editMessage,
    deleteMessage,
    prependMessages,
    isConnected,
    onlineCount,
    reactionOverrides,
    editedOverrides,
    deletedMessageIds,
  };
}
