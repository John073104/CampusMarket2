# CampusMarket Messaging System Documentation

## Overview
The CampusMarket messaging system provides real-time chat functionality between customers and sellers. It enables customers to inquire about products and communicate directly with sellers.

## Architecture

### Collections
- **chats**: Stores chat conversations between users
  - `chatId`: Unique identifier for the chat
  - `participants`: Array of user IDs participating in the chat
  - `participantDetails`: Map of user information (name, role, profileImage)
  - `lastMessage`: Most recent message text
  - `lastMessageTime`: Timestamp of last message
  - `lastMessageSenderId`: ID of user who sent last message
  - `createdAt`: Chat creation timestamp

- **messages** (subcollection under chats): Stores individual messages
  - `messageId`: Unique identifier for the message
  - `senderId`: ID of user who sent the message
  - `text`: Message content
  - `createdAt`: Message timestamp

### Services

#### ChatService (`src/app/services/chat.service.ts`)
Handles all chat-related operations:

**Key Methods:**
- `createChat(user1Id, user2Id, user1Details, user2Details)`: Creates a new chat between two users
- `getOrCreateChat(...)`: Gets existing chat or creates new one if doesn't exist
- `getUserChats(userId)`: Retrieves all chats for a user (with 5s timeout)
- `getChatMessages(chatId)`: Real-time observable of messages in a chat
- `sendMessage(chatId, senderId, text)`: Sends a new message
- `markChatAsRead(chatId, userId)`: Marks chat as read (future use)

**Performance Features:**
- 5-second timeout prevents infinite loading
- 3-second fallback returns empty array if no chats found
- Manual sorting instead of Firestore orderBy for speed
- Real-time updates using Firestore snapshots

## User Flows

### Customer Initiates Chat
1. Customer views product detail page
2. Clicks "Message Seller" button
3. System calls `ChatService.getOrCreateChat()`:
   - Checks if chat exists between customer and seller
   - If exists: Opens existing chat
   - If new: Creates chat document with both participants
4. Navigates to chat page (`/customer/chat/:chatId`)
5. Customer can send/receive messages in real-time

### Seller Receives Message
1. Notification service sends notification to seller (in-app)
2. Seller sees new message badge on Chats page
3. Seller navigates to `/seller/chats`
4. List shows all active conversations with customers
5. Seller clicks chat to open conversation
6. Messages load in real-time via Observable

### Real-Time Synchronization
The messaging system uses Firestore real-time listeners:

```typescript
// Messages update in real-time
this.messages$ = this.chatService.getChatMessages(this.chatId);

// Observable automatically updates when new messages arrive
this.messages$.subscribe(messages => {
  this.messages = messages;
  this.scrollToBottom();
});
```

## UI Components

### Customer Pages
- **Chats List** (`customer/chats/chats.page.ts`)
  - Displays all customer conversations
  - Shows last message, seller name, timestamp
  - Badge for unread messages (future)
  - Auto-refreshes via Observable

- **Chat Detail** (`customer/chat/chat.page.ts`)
  - Message input field
  - Message history (scrollable)
  - Real-time message updates
  - Auto-scroll to latest message

### Seller Pages
- **Chats List** (`seller/chats/chats.page.ts`)
  - Similar to customer chats
  - Shows customer names and last messages
  - Quick access to all conversations

- **Chat Detail** (`seller/chat/chat.page.ts`)
  - Same interface as customer
  - Sellers can respond to customer inquiries

## Features

### Implemented
✅ Real-time messaging
✅ Chat creation/retrieval
✅ Message history
✅ Participant details display
✅ Auto-scroll to latest message
✅ Loading states with timeout
✅ Empty state handling
✅ Profile images in chat list

### Future Enhancements
- ❌ Read receipts
- ❌ Typing indicators
- ❌ Image/file attachments
- ❌ Message search
- ❌ Push notifications
- ❌ Chat deletion
- ❌ Block user functionality

## Error Handling

The system includes robust error handling:

1. **Timeout Protection**: Chats load with 5-second timeout
2. **Fallback Mechanism**: Returns empty array after 3 seconds if no data
3. **Error Logging**: Console errors for debugging
4. **Empty States**: User-friendly messages when no chats exist

## Performance Optimizations

1. **Lazy Loading**: Messages load only when chat is opened
2. **Efficient Queries**: Uses whereIn for participant lookup
3. **Manual Sorting**: Avoids slow Firestore orderBy queries
4. **Timeout Mechanism**: Prevents indefinite loading states
5. **Observable Pattern**: Real-time updates without polling

## Code Examples

### Creating a Chat
```typescript
// From product-detail.page.ts
async messageCreator() {
  const user = this.authService.getCurrentUser();
  if (user) {
    const chatId = await this.chatService.getOrCreateChat(
      user.userId!,
      this.product.sellerId,
      { name: user.name || user.email, role: user.role },
      { name: this.product.sellerName, role: 'seller' }
    );
    this.router.navigate([`/customer/chat/${chatId}`]);
  }
}
```

### Sending a Message
```typescript
async sendMessage() {
  if (this.newMessage.trim() && this.currentUser) {
    await this.chatService.sendMessage(
      this.chatId,
      this.currentUser.userId!,
      this.newMessage.trim()
    );
    this.newMessage = '';
  }
}
```

### Loading Chats with Timeout
```typescript
async loadChats() {
  this.loading = true;
  const timeoutId = setTimeout(() => {
    this.loading = false;
    console.error('Chat loading timeout');
  }, 5000);

  this.chatService.getUserChats(user.userId!).subscribe({
    next: (chats) => {
      clearTimeout(timeoutId);
      this.chats = chats;
      this.loading = false;
    },
    error: (error) => {
      clearTimeout(timeoutId);
      this.loading = false;
    }
  });
}
```

## Database Structure

```
chats/
  {chatId}/
    chatId: string
    participants: [userId1, userId2]
    participantDetails: {
      userId1: { name, role, profileImage },
      userId2: { name, role, profileImage }
    }
    lastMessage: string
    lastMessageTime: Timestamp
    lastMessageSenderId: string
    createdAt: Timestamp
    
    messages/ (subcollection)
      {messageId}/
        messageId: string
        senderId: string
        text: string
        createdAt: Timestamp
```

## Security Rules (Recommended)

```javascript
// Firestore security rules for chats
match /chats/{chatId} {
  allow read, write: if request.auth.uid in resource.data.participants;
  
  match /messages/{messageId} {
    allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
    allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
  }
}
```

## Troubleshooting

### Messages Not Loading
- Check console for timeout errors
- Verify chatId exists in Firestore
- Ensure user is authenticated
- Check internet connection

### Chat List Empty
- Wait for 3-second fallback
- Verify chats collection has documents
- Check participants array includes current userId
- Look for console errors

### Real-Time Not Working
- Verify Firestore snapshot listeners are active
- Check Observable subscription is not unsubscribed
- Ensure component is not destroyed
- Verify Firestore permissions

## Contact
For issues or questions about the messaging system, check the console logs for detailed error messages.
