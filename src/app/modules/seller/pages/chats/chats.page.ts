import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ChatService } from '../../../../services/chat.service';
import { AuthService } from '../../../../services/auth.service';
import { Chat, Message } from '../../../../models/chat.model';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
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
    private router: Router
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
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: (chats) => {
        this.chats = chats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
        this.loading = false;
      }
    });
  }

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    this.loadMessages(chat.chatId);
    this.chatService.markMessagesAsRead(chat.chatId, this.currentUserId);
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
    if (!this.newMessage.trim() || !this.selectedChat) return;

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
      this.router.navigate(['/seller/dashboard']);
    }
  }
}

