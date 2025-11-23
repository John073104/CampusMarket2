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
    try {
      console.log('getOrCreateChat called with:', { userId1, userName1, userId2, userName2, orderId });
      
      // Validate inputs
      if (!userId1 || !userId2) {
        throw new Error('User IDs are required');
      }
      if (!userName1 || !userName2) {
        throw new Error('User names are required');
      }

      // Check if chat already exists
      const q = query(
        collection(this.firestore, 'chats'),
        where('participantIds', 'array-contains', userId1)
      );
      
      const snapshot = await getDocs(q);
      console.log('Found existing chats:', snapshot.size);
      
      const existingChat = snapshot.docs.find(doc => {
        const chat = doc.data() as Chat;
        return chat.participantIds.includes(userId2) && 
               (!orderId || chat.orderId === orderId);
      });

      if (existingChat) {
        console.log('Returning existing chat:', existingChat.id);
        return existingChat.id;
      }

      // Create new chat
      console.log('Creating new chat...');
      const newChat: any = {
        participantIds: [userId1, userId2],
        participantNames: {
          [userId1]: userName1,
          [userId2]: userName2
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      };

      // Only add orderId if it's defined
      if (orderId) {
        newChat.orderId = orderId;
      }

      const docRef = await addDoc(collection(this.firestore, 'chats'), newChat);
      console.log('New chat created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error in getOrCreateChat:', error);
      throw error;
    }
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

  // Get all chats (for admin) - real-time
  getAllChats(): Observable<Chat[]> {
    return new Observable(observer => {
      let unsubscribe: (() => void) | undefined;
      let hasEmitted = false;

      try {
        console.log('Loading all platform chats...');
        
        const q = query(collection(this.firestore, 'chats'));

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            hasEmitted = true;
            const chats = snapshot.docs.map(doc => ({
              chatId: doc.id,
              ...doc.data()
            } as Chat));
            
            // Sort by last message time
            chats.sort((a, b) => {
              const aTime = a.lastMessageTime?.seconds || 0;
              const bTime = b.lastMessageTime?.seconds || 0;
              return bTime - aTime;
            });
            
            console.log('All chats loaded:', chats.length);
            observer.next(chats);
          },
          (error) => {
            console.error('Error loading all chats:', error);
            if (!hasEmitted) {
              observer.next([]);
              hasEmitted = true;
            }
            observer.error(error);
          }
        );
        
        // Timeout fallback
        setTimeout(() => {
          if (!hasEmitted) {
            console.log('No chats loaded after 5s, emitting empty array');
            observer.next([]);
            hasEmitted = true;
          }
        }, 5000);
        
      } catch (error) {
        console.error('Error setting up all chats listener:', error);
        observer.next([]);
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
    try {
      // Reset unread count to 0
      await updateDoc(doc(this.firestore, 'chats', chatId), {
        [`unreadCount.${userId}`]: 0
      });

      console.log(`Marked messages as read for user ${userId} in chat ${chatId}`);

      // Update all unread messages
      try {
        const q = query(
          collection(this.firestore, 'chats', chatId, 'messages'),
          where('senderId', '!=', userId),
          where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} unread messages to mark as read`);
        
        const updatePromises = snapshot.docs.map(doc => 
          updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updatePromises);
      } catch (msgError) {
        console.warn('Could not update message read status:', msgError);
        // Don't throw error - unread count is already reset
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get total unread count for user
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, 'chats'),
        where('participantIds', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      let totalUnread = 0;

      snapshot.docs.forEach(doc => {
        const chat = doc.data() as Chat;
        // Safely get unread count, default to 0
        const unreadCount = chat.unreadCount?.[userId] || 0;
        // Only count valid numbers greater than 0
        if (typeof unreadCount === 'number' && unreadCount > 0) {
          totalUnread += unreadCount;
        }
      });

      console.log(`Total unread messages for ${userId}:`, totalUnread);
      return totalUnread;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  // Get chat by ID
  async getChatById(chatId: string): Promise<Chat | null> {
    const chatDoc = await getDoc(doc(this.firestore, 'chats', chatId));
    return chatDoc.exists() ? {
      chatId: chatDoc.id,
      ...chatDoc.data()
    } as Chat : null;
  }

  // Fix incorrect unread counts (utility method)
  async fixUnreadCounts(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, 'chats'),
        where('participantIds', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      console.log(`Checking ${snapshot.size} chats for user ${userId}`);

      const fixPromises = snapshot.docs.map(async (chatDoc) => {
        const chatId = chatDoc.id;
        const chat = chatDoc.data() as Chat;
        
        // Count actual unread messages
        const messagesQuery = query(
          collection(this.firestore, 'chats', chatId, 'messages'),
          where('senderId', '!=', userId),
          where('read', '==', false)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const actualUnreadCount = messagesSnapshot.size;
        const currentUnreadCount = chat.unreadCount?.[userId] || 0;

        // Update if counts don't match
        if (actualUnreadCount !== currentUnreadCount) {
          console.log(`Fixing unread count for chat ${chatId}: ${currentUnreadCount} -> ${actualUnreadCount}`);
          await updateDoc(doc(this.firestore, 'chats', chatId), {
            [`unreadCount.${userId}`]: actualUnreadCount
          });
        }
      });

      await Promise.all(fixPromises);
      console.log('Unread counts fixed successfully');
    } catch (error) {
      console.error('Error fixing unread counts:', error);
    }
  }
}
