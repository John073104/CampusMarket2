import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { ChatService } from '../../../../services/chat.service';
import { AuthService } from '../../../../services/auth.service';
import { Chat } from '../../../../models/chat.model';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DatePipe]
})
export class MessagesPage implements OnInit {
  allChats: Chat[] = [];
  filteredChats: Chat[] = [];
  loading = true;
  searchTerm = '';
  currentUserId = '';

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
    this.loadAllChats();
  }

  loadAllChats() {
    console.log('Loading admin chats...');
    
    const timeout = setTimeout(() => {
      if (this.loading) {
        console.warn('Chat loading timeout');
        this.loading = false;
        this.allChats = [];
        this.filteredChats = [];
      }
    }, 10000);
    
    // Only load chats where current admin is a participant
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: (chats: Chat[]) => {
        clearTimeout(timeout);
        this.allChats = chats;
        this.filteredChats = chats;
        this.loading = false;
        console.log('Loaded all chats:', chats.length);
      },
      error: (error: any) => {
        clearTimeout(timeout);
        console.error('Error loading chats:', error);
        this.loading = false;
        this.allChats = [];
        this.filteredChats = [];
      }
    });
  }

  filterChats() {
    if (!this.searchTerm.trim()) {
      this.filteredChats = this.allChats;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredChats = this.allChats.filter(chat => {
      const participants = Object.values(chat.participantNames).join(' ').toLowerCase();
      const lastMessage = chat.lastMessage?.toLowerCase() || '';
      return participants.includes(term) || lastMessage.includes(term);
    });
  }

  getParticipantNames(chat: Chat): string {
    return Object.values(chat.participantNames).join(' ↔ ');
  }

  getTotalUnreadCount(chat: Chat): number {
    return Object.values(chat.unreadCount).reduce((sum, count) => sum + count, 0);
  }

  viewChat(chat: Chat) {
    if (chat.chatId) {
      this.router.navigate(['/admin/chat', chat.chatId]);
    }
  }

  getLastMessageTime(chat: Chat): Date | null {
    if (chat.lastMessageTime && typeof chat.lastMessageTime.toDate === 'function') {
      return chat.lastMessageTime.toDate();
    }
    return null;
  }
}
