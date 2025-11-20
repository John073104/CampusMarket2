import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ChatService } from '../../../../services/chat.service';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { Chat, Message } from '../../../../models/chat.model';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DatePipe]
})
export class ChatsPage implements OnInit {
  @ViewChild('chatContent', { read: ElementRef }) chatContent?: ElementRef;
  
  chats: Chat[] = [];
  selectedChat: Chat | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = true;
  currentUserId = '';
  currentUserName = '';

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentUserId = user.userId;
    this.currentUserName = user.name || user.email;
    
    this.loadChats();
  }

  loadChats() {
    console.log('Loading chats for user:', this.currentUserId);
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (this.loading) {
        console.warn('Chat loading timeout - setting empty state');
        this.loading = false;
        this.chats = [];
      }
    }, 5000); // 5 second timeout
    
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: (chats) => {
        clearTimeout(timeout);
        this.chats = chats;
        this.loading = false;
        console.log('Loaded chats:', chats.length);
      },
      error: (error) => {
        clearTimeout(timeout);
        console.error('Error loading chats:', error);
        this.loading = false;
        this.chats = [];
      }
    });
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    if (chat.chatId) {
      this.loadMessages(chat.chatId);
      this.chatService.markMessagesAsRead(chat.chatId, this.currentUserId);
    }
  }

  loadMessages(chatId: string) {
    this.chatService.getMessages(chatId).subscribe({
      next: (messages) => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChat || !this.selectedChat.chatId) return;

    try {
      await this.chatService.sendMessage(
        this.selectedChat.chatId,
        this.currentUserId,
        this.currentUserName,
        this.newMessage.trim()
      );
      
      this.newMessage = '';
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  scrollToBottom() {
    if (this.chatContent) {
      const element = this.chatContent.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  getOtherParticipantName(chat: Chat): string {
    const otherUserId = chat.participantIds.find(id => id !== this.currentUserId);
    return otherUserId ? chat.participantNames[otherUserId] : 'Unknown';
  }

  getUnreadCount(chat: Chat): number {
    return chat.unreadCount[this.currentUserId] || 0;
  }

  goBack() {
    if (this.selectedChat) {
      this.selectedChat = null;
      this.messages = [];
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }

  async openNewChatModal() {
    const alert = await this.alertController.create({
      header: 'Start New Chat',
      message: 'Who would you like to chat with?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Contact Admin',
          handler: () => this.selectAdminToChat()
        },
        {
          text: 'Chat with Seller',
          handler: () => this.selectSellerToChat()
        }
      ]
    });
    await alert.present();
  }

  async selectAdminToChat() {
    try {
      const admins = await this.userService.getAdminUsers();
      if (admins.length === 0) {
        const alert = await this.alertController.create({
          header: 'No Admins Available',
          message: 'No administrators are currently available.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      const inputs = admins.map(admin => ({
        type: 'radio' as const,
        label: admin.name || admin.email,
        value: admin.userId
      }));

      const alert = await this.alertController.create({
        header: 'Select Admin',
        inputs: inputs,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Start Chat',
            handler: async (adminId) => {
              if (adminId) {
                const admin = admins.find(a => a.userId === adminId);
                if (admin) {
                  await this.startNewChat(admin.userId!, admin.name || admin.email);
                }
              }
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  }

  async selectSellerToChat() {
    try {
      const sellers = await this.userService.getSellerUsers();
      if (sellers.length === 0) {
        const alert = await this.alertController.create({
          header: 'No Sellers Available',
          message: 'No sellers are currently available. Browse products to chat with sellers!',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      const inputs = sellers.map(seller => ({
        type: 'radio' as const,
        label: `${seller.name || seller.email}${seller.courseName ? ' - ' + seller.courseName : ''}`,
        value: seller.userId
      }));

      const alert = await this.alertController.create({
        header: 'Select Seller',
        inputs: inputs,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Start Chat',
            handler: async (sellerId) => {
              if (sellerId) {
                const seller = sellers.find(s => s.userId === sellerId);
                if (seller) {
                  await this.startNewChat(seller.userId!, seller.name || seller.email);
                }
              }
            }
          }
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Error loading sellers:', error);
    }
  }

  async startNewChat(otherUserId: string, otherUserName: string) {
    try {
      const chatId = await this.chatService.getOrCreateChat(
        this.currentUserId,
        this.currentUserName,
        otherUserId,
        otherUserName
      );
      
      // Navigate to the chat
      this.router.navigate(['/customer/chat', chatId]);
    } catch (error) {
      console.error('Error starting chat:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Failed to start chat. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}

