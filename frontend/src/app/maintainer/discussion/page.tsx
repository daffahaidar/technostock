"use client";

import SidebarLayout from "@/components/layout/sidebar";
import { Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import useMounted from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import ChatInput from "./_components/chat-input";
import { MessageWithSender } from "./types/chat";
import { useChatWebSocket } from "./_queries/chat-websocket";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import BubbleChat from "./_components/bubble-chat";
import { useGetChatHistory } from "./_queries/chat-history";
import { useInView } from "react-intersection-observer";

export default function DiscussionPage() {
  const { data } = authClient.useSession();
  const { ref, inView } = useInView();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { isMounted } = useMounted();
  const { setTheme, theme } = useTheme();
  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [editingMessage, setEditingMessage] =
    useState<MessageWithSender | null>(null);
  const { chatHistoryData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetChatHistory(data?.session.token);

  const {
    messages,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReaction,
    editMessage,
    deleteMessage,
    onlineCount,
    reactionOverrides,
    editedOverrides,
    deletedMessageIds,
  } = useChatWebSocket({
    accessToken: data?.session.token,
    currentUserId: data?.session.userId,
    currentUserName: data?.user.name, // sesuaikan field-nya
    initialMessages: [],
  });

  const liveMessageIds = new Set(messages.map((m) => m.id));
  const historyMessages = chatHistoryData
    ? (chatHistoryData.pages as MessageWithSender[][])
        .flatMap((page) => page)
        .filter((msg) => !liveMessageIds.has(msg.id))
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
    : [];

  const allMessages = [...historyMessages, ...messages];
  const reversedMessages = [...allMessages]
    .filter((msg: MessageWithSender) => !deletedMessageIds.has(msg.id))
    .reverse()
    .map((msg: MessageWithSender) => {
      let updatedMsg = msg;
      if (editedOverrides[msg.id]) {
        updatedMsg = editedOverrides[msg.id];
      }
      if (reactionOverrides[msg.id]) {
        updatedMsg = { ...updatedMsg, reactions: reactionOverrides[msg.id] };
      }
      return updatedMsg;
    });

  const formatDateSeparator = (isoString: string) => {
    const messageDate = new Date(isoString);
    if (isNaN(messageDate.getTime())) return "";

    const today = new Date();
    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return "Today";
    }

    return messageDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderBubbleChat = (
    msg: MessageWithSender,
    attachRef: boolean,
    showSeparator: boolean,
  ) => (
    <div key={`container-${msg.id}`} className="flex flex-col gap-2">
      {showSeparator && (
        <div className="relative flex items-center justify-center py-4">
          <div className="bg-border absolute inset-x-0 top-1/2 mx-auto h-px max-w-[90%]" />
          <span
            className={`${formatDateSeparator(msg.created_at) === "Today" ? "bg-primary text-muted" : "bg-muted text-muted-foreground"} relative z-10 rounded-full px-4 py-0.5 text-xs font-medium`}
          >
            {formatDateSeparator(msg.created_at)}
          </span>
        </div>
      )}
      <BubbleChat
        ref={attachRef ? ref : undefined}
        key={msg.id}
        id={msg.id}
        message={msg.content}
        sender={msg.sender_name}
        timestamp={formatTime(msg.created_at)}
        isMe={msg.sender_id === data?.session.userId}
        role={msg.sender_role}
        reactions={msg.reactions}
        onReactionToggle={(messageId, emoji) => {
          sendReaction(messageId, emoji);
        }}
        sender_avatar_url={msg?.sender_avatar_url || ""}
        reply_to_id={msg.reply_to_id}
        replied_message_content={msg.replied_message_content}
        replied_sender_name={msg.replied_sender_name}
        onReplyClick={() => {
          setReplyingTo(msg);
          setEditingMessage(null);
        }}
        onEditClick={() => {
          setEditingMessage(msg);
          setReplyingTo(null);
        }}
        onDeleteClick={() => deleteMessage(msg.id)}
        isEdited={msg.is_edited}
        imageUrl={msg.image_url}
      />
    </div>
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (data?.session.token) {
      const apiUrl = (process.env.NEXT_PUBLIC_WS_API_URL || "ws://localhost:8000")
        .replace("ws://", "http://").replace("wss://", "https://");
        
      fetch(`${apiUrl}/api/v1/chat/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.token}`,
        },
      }).catch(console.error);
    }
  }, [data?.session.token]);

  const handleSendMessage = (content: string, imageUrl?: string | null) => {
    flushSync(() => {
      if (editingMessage) {
        editMessage(editingMessage.id, content);
        setEditingMessage(null);
      } else {
        sendMessage(content, replyingTo?.id, imageUrl);
        setReplyingTo(null);
      }
    });
    // We only scroll down if it's a new message
    if (!editingMessage) {
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SidebarLayout
      breadcrumb={[{ name: "Forum" }, { name: "Discussion" }]}
      className="-mx-4 -mt-4 flex h-screen flex-col p-0"
      headerShown={false}
    >
      <header className="bg-sidebar sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex items-center gap-2">
              <div className="size-3 animate-pulse rounded-full bg-green-600" />
              <h2 className="hover:text-foreground text-muted-foreground text-sm break-words transition-colors">
                {onlineCount} Member{onlineCount > 1 ? "s" : ""} Online
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMounted && (
              <Button
                size={"sm"}
                variant={"ghost"}
                onClick={() =>
                  setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                }
              >
                {theme === "dark" ? <Sun /> : <Moon />}
              </Button>
            )}
          </div>
        </div>
      </header>
      <div
        className="flex flex-1 flex-col-reverse gap-2 overflow-y-auto px-4 py-4"
        ref={chatContainerRef}
      >
        {typingUsers.length > 0 && (
          <div className="flex w-full animate-pulse justify-start">
            <div className="bg-secondary text-muted-foreground max-w-[66%] min-w-[40%] space-y-2 rounded-md p-3 text-sm italic">
              {typingUsers.map((u) => u.user_name).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          </div>
        )}
        {reversedMessages.map((msg: MessageWithSender, index: number) => {
          const isLastItem = index === reversedMessages.length - 1;

          let showSeparator = false;
          // Reversed Messages has the LATEST message at index 0 and the OLDEST at length - 1
          // To show a separator we should check if the message BEFORE it (index + 1) has a different date

          if (index === reversedMessages.length - 1) {
            // This is the absolute oldest message shown, force a separator at the top (bottom of the flex-col-reverse)
            showSeparator = true;
          } else {
            const currentMsgDate = new Date(msg.created_at);
            const olderMsgDate = new Date(
              reversedMessages[index + 1].created_at,
            );

            showSeparator =
              currentMsgDate.getDate() !== olderMsgDate.getDate() ||
              currentMsgDate.getMonth() !== olderMsgDate.getMonth() ||
              currentMsgDate.getFullYear() !== olderMsgDate.getFullYear();
          }

          return renderBubbleChat(msg, isLastItem, showSeparator);
        })}
        {hasNextPage && (
          <div className="flex justify-center p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load Older Messages"}
            </Button>
          </div>
        )}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        token={data?.session.token}
      />
    </SidebarLayout>
  );
}
