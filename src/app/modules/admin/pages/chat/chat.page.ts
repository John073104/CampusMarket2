import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../../../services/chat.service';
import { AuthService } from '../../../../services/auth.service';
import { Chat, Message } from '../../../../models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DatePipe]
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('chatContent', { read: ElementRef }) chatContent?: ElementRef;
  
  chat: Chat | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = true;
  currentUserId = '';
  currentUserName = '';
  otherUserName = '';
  chatId = '';
  private messagesSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.userId) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.currentUserId = user.userId;
    this.currentUserName = user.name || user.email;
    
    this.chatId = this.route.snapshot.paramMap.get('id') || '';
    if (this.chatId) {
      await this.loadChat();
      this.loadMessages();
    } else {
      this.loading = false;
    }
  }

  async loadChat() {
    try {
      this.chat = await this.chatService.getChatById(this.chatId);
      if (!this.chat) {
        console.error('Chat not found');
        this.router.navigate(['/admin/messages']);
        return;
      }
      const otherUserId = this.chat.participantIds.find(id => id !== this.currentUserId);
      this.otherUserName = otherUserId ? this.chat.participantNames[otherUserId] : 'Unknown';
      
      // Mark as read (non-blocking)
      this.chatService.markMessagesAsRead(this.chatId, this.currentUserId)
        .catch(err => console.warn('Could not mark messages as read:', err));
      
      this.loading = false;
    } catch (error) {
      console.error('Error loading chat:', error);
      this.loading = false;
      this.router.navigate(['/admin/messages']);
    }
  }

  loadMessages() {
    if (!this.chatId) {
      console.error('No chat ID provided');
      return;
    }
    
    this.messagesSubscription = this.chatService.getMessages(this.chatId).subscribe({
      next: (messages) => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.messages = [];
      }
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.chatId) return;

    try {
      await this.chatService.sendMessage(
        this.chatId,
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

  goBack() {
    this.router.navigate(['/admin/messages']);
  }

  ngOnDestroy() {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }
}
