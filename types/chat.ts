export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatThread {
  chatId: string;
  messages: ChatMessage[];
}

