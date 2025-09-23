// Database models and utilities for the CS AI System

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  preferences: {
    language: string;
    notifications: boolean;
    timezone: string;
  };
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  customerId: string;
  assignedAgentId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  dueDate?: Date;
  slaHours: number;
  satisfaction?: number;
  source: 'chat' | 'email' | 'phone' | 'web' | 'api';
  metadata: Record<string, any>;
}

export interface ChatSession {
  id: string;
  ticketId?: string;
  customerId: string;
  agentId?: string;
  status: 'active' | 'waiting' | 'transferred' | 'ended';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  rating?: number;
  feedback?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
  read: boolean;
  edited?: boolean;
  editedAt?: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'supervisor' | 'admin';
  status: 'online' | 'away' | 'offline';
  skills: string[];
  currentChats: number;
  maxChats: number;
  performance: {
    avgResponseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    ticketsResolved: number;
  };
  createdAt: Date;
  lastActive: Date;
}

export interface AnalyticsData {
  id: string;
  date: Date;
  metrics: {
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    agentUtilization: number;
    firstResponseTime: number;
    chatVolume: number;
    peakHours: number[];
  };
  trends: {
    ticketVolume: number[];
    responseTimes: number[];
    satisfaction: number[];
  };
}

// Mock database implementation (replace with real database later)
class Database {
  private customers: Map<string, Customer> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private chatSessions: Map<string, ChatSession> = new Map();
  private agents: Map<string, Agent> = new Map();
  private analytics: Map<string, AnalyticsData> = new Map();

  // Customer operations
  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async getCustomer(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const customer = this.customers.get(id);
    if (!customer) return null;

    const updatedCustomer = { ...customer, ...updates, updatedAt: new Date() };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Ticket operations
  async createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTicket: Ticket = {
      ...ticket,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tickets.set(id, newTicket);

    // Auto-assign agent based on priority and availability
    await this.autoAssignAgent(newTicket);

    return newTicket;
  }

  async getTicket(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) || null;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;

    const updatedTicket = { ...ticket, ...updates, updatedAt: new Date() };
    this.tickets.set(id, updatedTicket);

    // Log status changes
    if (updates.status && updates.status !== ticket.status) {
      await this.logTicketStatusChange(id, ticket.status, updates.status);
    }

    return updatedTicket;
  }

  async getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedAgentId?: string;
    customerId?: string;
  }): Promise<Ticket[]> {
    let tickets = Array.from(this.tickets.values());

    if (filters) {
      if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
      if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
      if (filters.category) tickets = tickets.filter(t => t.category === filters.category);
      if (filters.assignedAgentId) tickets = tickets.filter(t => t.assignedAgentId === filters.assignedAgentId);
      if (filters.customerId) tickets = tickets.filter(t => t.customerId === filters.customerId);
    }

    return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Chat operations
  async createChatSession(session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<ChatSession> {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      ...session,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    this.chatSessions.set(id, newSession);
    return newSession;
  }

  async addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const session = this.chatSessions.get(message.sessionId);
    if (!session) throw new Error('Chat session not found');

    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date()
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date();
    this.chatSessions.set(message.sessionId, session);

    // Auto-create ticket if this is a new customer issue
    if (message.senderType === 'customer' && !session.ticketId) {
      await this.createTicketFromChat(session.id, message.content);
    }

    return newMessage;
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    return this.chatSessions.get(id) || null;
  }

  // Agent operations
  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'lastActive'>): Promise<Agent> {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAgent: Agent = {
      ...agent,
      id,
      createdAt: new Date(),
      lastActive: new Date()
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async getAvailableAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'online' && agent.currentChats < agent.maxChats)
      .sort((a, b) => a.currentChats - b.currentChats);
  }

  async assignAgentToTicket(ticketId: string, agentId: string): Promise<boolean> {
    const ticket = await this.getTicket(ticketId);
    const agent = this.agents.get(agentId);

    if (!ticket || !agent) return false;

    await this.updateTicket(ticketId, { assignedAgentId: agentId });
    agent.currentChats++;
    this.agents.set(agentId, agent);

    return true;
  }

  // Analytics operations
  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<AnalyticsData[]> {
    const analytics = Array.from(this.analytics.values());

    if (dateRange) {
      return analytics.filter(a =>
        a.date >= dateRange.start && a.date <= dateRange.end
      );
    }

    return analytics;
  }

  async updateAnalytics(date: Date, metrics: Partial<AnalyticsData['metrics']>): Promise<void> {
    const dateKey = date.toDateString();
    let existing = this.analytics.get(dateKey);

    if (!existing) {
      existing = {
        id: dateKey,
        date,
        metrics: {
          totalTickets: 0,
          resolvedTickets: 0,
          avgResolutionTime: 0,
          customerSatisfaction: 0,
          agentUtilization: 0,
          firstResponseTime: 0,
          chatVolume: 0,
          peakHours: []
        },
        trends: {
          ticketVolume: [],
          responseTimes: [],
          satisfaction: []
        }
      };
    }

    existing.metrics = { ...existing.metrics, ...metrics };
    this.analytics.set(dateKey, existing);
  }

  // Helper methods
  private async autoAssignAgent(ticket: Ticket): Promise<void> {
    const availableAgents = await this.getAvailableAgents();

    if (availableAgents.length > 0) {
      // Assign based on priority and skills
      const suitableAgent = availableAgents.find(agent =>
        agent.skills.includes(ticket.category.toLowerCase())
      ) || availableAgents[0];

      await this.assignAgentToTicket(ticket.id, suitableAgent.id);
    }
  }

  private async logTicketStatusChange(ticketId: string, oldStatus: string, newStatus: string): Promise<void> {
    console.log(`Ticket ${ticketId} status changed from ${oldStatus} to ${newStatus}`);
    // In a real system, this would log to a proper logging system
  }

  private async createTicketFromChat(sessionId: string, firstMessage: string): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) return;

    // Auto-categorize based on message content
    const category = this.categorizeMessage(firstMessage);

    const ticket = await this.createTicket({
      title: `Chat Support: ${firstMessage.substring(0, 50)}...`,
      description: firstMessage,
      status: 'open',
      priority: this.determinePriority(firstMessage),
      category,
      tags: this.extractTags(firstMessage),
      customerId: session.customerId,
      slaHours: this.getSLAHours(category),
      source: 'chat',
      metadata: { chatSessionId: sessionId }
    });

    // Update session with ticket ID
    session.ticketId = ticket.id;
    this.chatSessions.set(sessionId, session);
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('account')) {
      return 'Account & Access';
    } else if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || lowerMessage.includes('charge')) {
      return 'Billing & Payments';
    } else if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('not working')) {
      return 'Technical Issues';
    } else {
      return 'General Inquiry';
    }
  }

  private determinePriority(message: string): 'low' | 'medium' | 'high' | 'urgent' {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('critical')) {
      return 'urgent';
    } else if (lowerMessage.includes('broken') || lowerMessage.includes('cannot') || lowerMessage.includes('stuck')) {
      return 'high';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private extractTags(message: string): string[] {
    const tags: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('login')) tags.push('login');
    if (lowerMessage.includes('password')) tags.push('password');
    if (lowerMessage.includes('billing')) tags.push('billing');
    if (lowerMessage.includes('bug')) tags.push('bug');
    if (lowerMessage.includes('feature')) tags.push('feature-request');

    return tags;
  }

  private getSLAHours(category: string): number {
    switch (category) {
      case 'Account & Access': return 4;
      case 'Billing & Payments': return 8;
      case 'Technical Issues': return 2;
      default: return 24;
    }
  }
}

// Export singleton instance
export const db = new Database();
