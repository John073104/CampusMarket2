export interface Chat {
  chatId?: string;
  participantIds: string[];
  participantNames: { [userId: string]: string };
  orderId?: string;
  lastMessage: string;
  lastMessageTime: any; // Firestore Timestamp
  unreadCount: { [userId: string]: number };
}

export interface Message {
  messageId?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any; // Firestore Timestamp
  read: boolean;
}