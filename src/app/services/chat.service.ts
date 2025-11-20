import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment,
  arrayUnion
} from '@angular/fire/firestore';
import { Chat, Message } from '../models/chat.model';
import { NotificationService } from './notification.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private firestore: Firestore, private notificationService: NotificationService) {}

  // Create or get existing chat between two users
  async getOrCreateChat(
    userId1: string,
    userName1: string,
    userId2: string,
    userName2: string,
    orderId?: string
  ): Promise<string> {
    // Check if chat already exists
    const q = query(
      collection(this.firestore, 'chats'),
      where('participantIds', 'array-contains', userId1)
    );
    
    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => {
      const chat = doc.data() as Chat;
      return chat.participantIds.includes(userId2) && 
             (!orderId || chat.orderId === orderId);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create new chat
    const newChat: Omit<Chat, 'chatId'> = {
      participantIds: [userId1, userId2],
      participantNames: {
        [userId1]: userName1,
        [userId2]: userName2
      },
      orderId,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    };

    const docRef = await addDoc(collection(this.firestore, 'chats'), newChat);
    return docRef.id;
  }

  // Send message
  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string
  ): Promise<void> {
    // Add message to messages subcollection
    const message: Omit<Message, 'messageId'> = {
      chatId,
      senderId,
      senderName,
      text,
      timestamp: serverTimestamp(),
      read: false
    };

    await addDoc(
      collection(this.firestore, 'chats', chatId, 'messages'), 
      message
    );

    // Update chat with last message
    const chatDoc = await getDoc(doc(this.firestore, 'chats', chatId));
    const chatData = chatDoc.data() as Chat;
    
    // Increment unread count for other participant
    const otherParticipantId = chatData.participantIds.find(id => id !== senderId);
    
    await updateDoc(doc(this.firestore, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${otherParticipantId}`]: increment(1)
    });

    // Send in-app notification to other participant (non-blocking)
    if (otherParticipantId) {
      this.notificationService.notifyNewMessage(otherParticipantId, senderName, chatId)
        .catch(err => console.error('Failed to send chat notification:', err));
    }
  }

  // Get messages for a chat (real-time)
  getMessages(chatId: string): Observable<Message[]> {
    return new Observable(observer => {
      let unsubscribe: (() => void) | undefined;

      try {
        const q = query(
          collection(this.firestore, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
              messageId: doc.id,
              ...doc.data()
            } as Message));
            observer.next(messages);
          },
          (error) => {
            console.warn('Messages orderBy failed, using fallback...', error);
            // Fallback without orderBy
            const fallbackQuery = collection(this.firestore, 'chats', chatId, 'messages');
            
            unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
              const messages = snapshot.docs.map(doc => ({
                messageId: doc.id,
                ...doc.data()
              } as Message));
              
              // Sort manually by timestamp
              messages.sort((a, b) => {
                const aTime = a.timestamp?.seconds || 0;
                const bTime = b.timestamp?.seconds || 0;
                return aTime - bTime; // Ascending order
              });
              
              observer.next(messages);
            });
          }
        );
      } catch (error) {
        console.error('Error setting up messages listener:', error);
        observer.error(error);
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }

  // Get user chats (real-time) - OPTIMIZED with fast fallback
  getUserChats(userId: string): Observable<Chat[]> {
    return new Observable(observer => {
      let unsubscribe: (() => void) | undefined;
      let hasEmitted = false;

      try {
        console.log('Setting up chat listener for user:', userId);
        
        // Use simple query without orderBy for faster initial load
        const q = query(
          collection(this.firestore, 'chats'),
          where('participantIds', 'array-contains', userId)
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            hasEmitted = true;
            const chats = snapshot.docs.map(doc => ({
              chatId: doc.id,
              ...doc.data()
            } as Chat));
            
            // Sort manually by lastMessageTime
            chats.sort((a, b) => {
              const aTime = a.lastMessageTime?.seconds || 0;
              const bTime = b.lastMessageTime?.seconds || 0;
              return bTime - aTime;
            });
            
            console.log('Chats loaded:', chats.length);
            observer.next(chats);
          },
          (error) => {
            console.error('Chat snapshot error:', error);
            if (!hasEmitted) {
              // Emit empty array on first error to prevent infinite loading
              observer.next([]);
              hasEmitted = true;
            }
            observer.error(error);
          }
        );
        
        // Emit empty array immediately if no data after 3 seconds
        setTimeout(() => {
          if (!hasEmitted) {
            console.log('No chats loaded after 3s, emitting empty array');
            observer.next([]);
            hasEmitted = true;
          }
        }, 3000);
        
      } catch (error) {
        console.error('Error setting up chat listener:', error);
        observer.next([]); // Emit empty array instead of error
        observer.error(error);
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'chats', chatId), {
      [`unreadCount.${userId}`]: 0
    });

    // Update all unread messages
    const q = query(
      collection(this.firestore, 'chats', chatId, 'messages'),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  }

  // Get total unread count for user
  async getTotalUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(this.firestore, 'chats'),
      where('participantIds', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    let totalUnread = 0;

    snapshot.docs.forEach(doc => {
      const chat = doc.data() as Chat;
      totalUnread += chat.unreadCount[userId] || 0;
    });

    return totalUnread;
  }

  // Get chat by ID
  async getChatById(chatId: string): Promise<Chat | null> {
    const chatDoc = await getDoc(doc(this.firestore, 'chats', chatId));
    return chatDoc.exists() ? {
      chatId: chatDoc.id,
      ...chatDoc.data()
    } as Chat : null;
  }
}
