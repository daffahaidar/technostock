use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::domain::entities::message::MessageWithSender;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum ServerMessage {
    NewMessage(MessageWithSender),
    UserTyping { user_id: Uuid, user_name: String },
    ReactionUpdate { message_id: Uuid, reactions: Vec<crate::domain::entities::message_reaction::ReactionSummary> },
    OnlineUsersCount { count: usize },
    MessageEdited(MessageWithSender),
    MessageDeleted { message_id: Uuid },
}

#[derive(Clone)]
pub struct Broadcaster {
    pub groups: Arc<DashMap<String, broadcast::Sender<ServerMessage>>>,
}

impl Broadcaster {
    pub fn new() -> Self {
        Self {
            groups: Arc::new(DashMap::new()),
        }
    }

    pub fn get_or_create_sender(&self, group_id: &str) -> broadcast::Sender<ServerMessage> {
        self.groups
            .entry(group_id.to_string())
            .or_insert_with(|| {
                let (tx, _) = broadcast::channel(100);
                tx
            })
            .clone()
    }
}

impl Default for Broadcaster {
    fn default() -> Self {
        Self::new()
    }
}

