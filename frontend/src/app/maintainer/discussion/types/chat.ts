export interface ReactionSummary {
  emoji: string;
  count: number;
  user_names: string[];
  has_reacted: boolean;
}

export interface MessageWithSender {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_role: string;
  sender_avatar_url: string | null;
  reply_to_id?: string;
  replied_message_content?: string;
  replied_sender_name?: string;
  reactions: ReactionSummary[];
  image_url?: string | null;
  is_edited?: boolean;
}

export interface TypingUser {
  user_id: string;
  user_name: string;
}
