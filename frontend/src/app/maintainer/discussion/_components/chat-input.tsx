import { Button } from "@/components/ui/button";
import { ImagePlus, Smile } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import Image from "next/image";
import { MessageWithSender } from "../types/chat";
import { X, Edit2 } from "lucide-react";
import { messageBackend } from "@/libs/axios";

export default function ChatInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  token,
}: {
  onSendMessage: (msg: string, imageUrl?: string | null) => void;
  onTyping?: () => void;
  replyingTo?: MessageWithSender | null;
  onCancelReply?: () => void;
  editingMessage?: MessageWithSender | null;
  onCancelEdit?: () => void;
  token?: string;
}) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleSend = async () => {
    const text = editor
      ? (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown().trim()
      : "";
    if ((!text && !selectedImage) || isUploading) return;

    let uploadedImageUrl: string | null = null;

    if (selectedImage) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedImage);

        const res = await messageBackend.post("/api/v1/chat/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status !== 200) {
          throw new Error("Failed to upload image");
        }

        const data = res.data;
        uploadedImageUrl = data.results?.image_url;
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload image.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Call upstream with both text and potential image URL
    onSendMessage(text, uploadedImageUrl);

    if (!editingMessage) {
      if (editor) {
        editor.commands.setContent(""); // clear tiptap content
      }
      removeImage();
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder: "Type your message...",
        emptyEditorClass: "is-editor-empty",
      }),
      Markdown.configure({
        html: false, // Ensure it outputs Markdown
        transformPastedText: true,
      }),
    ],
    content: "",
    onUpdate: () => {
      if (onTyping) onTyping();
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-9 text-sm max-h-[200px] overflow-y-auto px-3 py-2 w-full flex-1 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files.length > 0
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (
          event.clipboardData &&
          event.clipboardData.files &&
          event.clipboardData.files.length > 0
        ) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // When editingMessage changes, update the input text and focus
  useEffect(() => {
    if (editor) {
      if (editingMessage) {
        editor.commands.setContent(editingMessage.content);
        editor.commands.focus();
      } else if (!replyingTo) {
        editor.commands.setContent("");
      }
    }
  }, [editingMessage, replyingTo, editor]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  return (
    <div className="bg-background flex flex-col border-t">
      {replyingTo && !editingMessage && (
        <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2 text-sm">
          <div className="flex flex-col">
            <span className="text-primary flex items-center gap-1 text-xs font-semibold">
              Replying to {replyingTo.sender_name}
            </span>
            <span className="text-muted-foreground line-clamp-1 text-xs">
              {replyingTo.content}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {editingMessage && (
        <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2 text-sm">
          <div className="flex flex-col">
            <span className="text-primary flex items-center gap-1 text-xs font-semibold">
              <Edit2 size={12} /> Editing Message
            </span>
            <span className="text-muted-foreground line-clamp-1 text-xs">
              {editingMessage.content}
            </span>
          </div>
          <button
            onClick={() => {
              editor?.commands.setContent("");
              if (onCancelEdit) onCancelEdit();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {imagePreview && !editingMessage && (
        <div className="bg-muted/20 relative m-4 mb-0 flex max-h-[150px] w-fit items-center justify-center overflow-hidden rounded-md border">
          <Image
            src={imagePreview}
            alt="Preview"
            width={500}
            height={500}
            className="h-full max-h-[150px] w-auto object-contain"
          />
          <button
            onClick={removeImage}
            className="bg-background/80 hover:bg-background text-foreground absolute top-1 right-1 rounded-full p-1 shadow-sm transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex items-start gap-3 p-3">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <Button
          variant={"outline"}
          className="image-upload"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!editingMessage || isUploading}
        >
          <ImagePlus />
        </Button>
        <div className="flex-1">
          <EditorContent editor={editor} disabled={isUploading} />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="emoji-picker" type="button">
              <Smile />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={10}
            className="w-full border-none bg-transparent p-0 shadow-none"
          >
            <EmojiPicker
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(emojiData) => {
                editor?.commands.insertContent(emojiData.emoji);
                if (onTyping) onTyping();
                editor?.commands.focus();
              }}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSend}
          variant={editingMessage ? "secondary" : "default"}
          disabled={isUploading}
        >
          {isUploading
            ? "Sending..."
            : editingMessage
              ? "Save changes"
              : "Send"}
        </Button>
      </div>
    </div>
  );
}
