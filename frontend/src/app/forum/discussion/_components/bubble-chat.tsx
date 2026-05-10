import { Card } from "@/components/ui/card";
import { cn } from "@/libs/shadcn";
import React from "react";
import { Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ReactionSummary } from "../types/chat";

interface BubbleChatProps {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  isMe: boolean;
  role?: string;
  reactions?: ReactionSummary[];
  onReactionToggle?: (messageId: string, emoji: string) => void;
  reply_to_id?: string;
  replied_message_content?: string;
  replied_sender_name?: string;
  sender_avatar_url?: string;
  onReplyClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  isEdited?: boolean;
  imageUrl?: string | null;
}

const BubbleChat = React.forwardRef<HTMLDivElement, BubbleChatProps>(
  (
    {
      id,
      message,
      sender,
      timestamp,
      isMe,
      role,
      reactions = [],
      onReactionToggle,
      reply_to_id,
      replied_message_content,
      replied_sender_name,
      sender_avatar_url,
      onReplyClick,
      onEditClick,
      onDeleteClick,
      isEdited,
      imageUrl,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const isOnlyEmoji = React.useMemo(() => {
      const trimmed = message.trim();
      if (!trimmed) return false;

      // Gunakan Intl.Segmenter untuk mendeteksi emoji kompleks (seperti skin tones / family) sebagai 1 karakter
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const segments = Array.from(segmenter.segment(trimmed));
        if (segments.length !== 1) return false;
        const segment = segments[0].segment;
        return (
          /\p{Emoji_Presentation}/u.test(segment) ||
          /\p{Extended_Pictographic}/u.test(segment)
        );
      }

      return (
        /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(trimmed) &&
        trimmed.length <= 10
      );
    }, [message]);

    return (
      <ContextMenu>
        <div
          ref={ref}
          className={cn(
            "group relative flex w-full",
            isMe ? "justify-end" : "justify-start",
          )}
        >
          <ContextMenuTrigger asChild>
            <Card
              className={`${isMe ? "bg-primary" : "bg-secondary"} max-w-2/3 min-w-2/5 gap-0 space-y-2 rounded-md p-3 ${isOnlyEmoji ? `border-none bg-transparent shadow-none ${isMe ? "text-right" : "text-left"}` : ""}`}
            >
              {reply_to_id && replied_message_content && (
                <div className="border-muted-foreground/50 bg-background/10 mb-2 w-full rounded-md border-l-4 p-2 text-xs">
                  <span
                    className={cn(
                      "font-semibold",
                      isMe ? "text-primary-foreground/90" : "text-primary/90",
                    )}
                  >
                    {replied_sender_name}
                  </span>
                  <p
                    className={cn(
                      "mt-0.5 line-clamp-2",
                      isMe
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {replied_message_content}
                  </p>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Avatar
                    className={`${isMe ? "bg-muted" : "bg-muted-foreground"} flex h-8 w-8 items-center justify-center rounded-lg`}
                  >
                    {sender_avatar_url && (
                      <AvatarImage
                        src={sender_avatar_url}
                        alt={sender}
                        className="rounded-lg"
                      />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {sender.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "font-semibold",
                        isMe
                          ? isOnlyEmoji
                            ? "text-primary"
                            : "text-background"
                          : "text-primary",
                      )}
                    >
                      {sender}{" "}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        isMe
                          ? isOnlyEmoji
                            ? "text-muted-foreground"
                            : "text-muted"
                          : "text-muted-foreground",
                      )}
                    >
                      {timestamp}
                      {isEdited && (
                        <span className="text-[10px] italic opacity-70">
                          (edited)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {role && (
                  <div>
                    <Badge
                      className={
                        isMe ? "bg-secondary text-primary" : "bg-primary"
                      }
                    >
                      {role}
                    </Badge>
                  </div>
                )}
              </div>
              {imageUrl && (
                <div className="mt-2 w-fit overflow-hidden rounded-md border text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Chat image"
                    className="max-h-[300px] w-auto max-w-full object-contain"
                  />
                </div>
              )}
              {message && (
                <div
                  className={cn(
                    "text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-2 prose-pre:bg-black/50 prose-pre:text-white prose-code:text-sm prose-img:max-h-[300px] prose-img:rounded-md prose-img:object-contain prose-a:text-blue-500",
                    isMe && !isOnlyEmoji ? "text-background prose-headings:text-background prose-p:text-background prose-strong:text-background" : "text-primary",
                    isOnlyEmoji && "text-9xl leading-none prose-p:text-9xl prose-p:leading-none p-0 m-0",
                    imageUrl ? "mt-2" : "",
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
                </div>
              )}

              <div className="mt-1 flex items-end justify-between">
                <div className="flex flex-wrap gap-2">
                  {reactions.length > 0 && (
                    <>
                      {reactions.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() =>
                            onReactionToggle && onReactionToggle(id, r.emoji)
                          }
                          title={r.user_names.join(", ")}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
                            r.has_reacted
                              ? "bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/50"
                              : isMe && !isOnlyEmoji
                                ? "bg-background/20 text-background hover:bg-background/40"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span className="text-sm">{r.emoji}</span>
                          <span>{r.count}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {!isOnlyEmoji && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 rounded-full p-1 px-2 text-xs font-semibold text-blue-500 ring-1 ring-blue-500 transition-colors">
                          <Smile size={15} /> +
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full border-none bg-transparent p-0 shadow-none">
                        <EmojiPicker
                          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                          onEmojiClick={(e) => {
                            if (onReactionToggle) onReactionToggle(id, e.emoji);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                {!isOnlyEmoji && (
                  <div>
                    <button
                      onClick={onReplyClick}
                      className="flex items-center gap-1.5 rounded-full p-1 px-2 text-xs font-semibold text-blue-500 ring-1 ring-blue-500 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {isMe && (
              <>
                <ContextMenuItem onClick={onEditClick}>
                  Edit Chat
                </ContextMenuItem>
                <ContextMenuItem onClick={onDeleteClick}>
                  <span className="text-destructive">Unsend Chat</span>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </div>
      </ContextMenu>
    );
  },
);

BubbleChat.displayName = "BubbleChat";

export default BubbleChat;
