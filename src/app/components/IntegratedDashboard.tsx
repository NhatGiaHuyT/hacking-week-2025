"use client";

import { useState, useEffect, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  FaMountain,
  FaPaperPlane,
  FaCopy,
  FaChartBar,
  FaComments,
  FaSearch,
  FaTicketAlt,
  FaUsers,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaHeadset,
  FaRobot,
  FaFilter,
  FaSort,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
  FaPause,
  FaPlay,
  FaStop
} from "react-icons/fa";
import Modal from "./modal";
import Ragsubmit from "./ragsubmit";
import { IoSettingsSharp } from "react-icons/io5";
import { TaskContext } from "../context/taskContext";
import LanguageSelector from './languageSelector';
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedSearch from './AdvancedSearch';
import RealtimeChat from './RealtimeChat';

// Types
interface Ticket {
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

interface Customer {
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

interface ChatSession {
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

interface ChatMessage {
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

interface Agent {
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

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  activeChats: number;
  agentsOnline: number;
  urgentTickets: number;
}

const IntegratedDashboard = () => {
  // State management
  const [currentView, setCurrentView] = useState<"dashboard" | "tickets" | "chat" | "analytics" | "search">("dashboard");
  const [selectedLanguage, setSelectedLanguage] = useState("Vietnamese");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    customerSatisfaction: 0,
    activeChats: 0,
    agentsOnline: 0,
    urgentTickets: 0
  });

  // Filter and search states
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignedAgent: '',
    dateRange: 'today'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Context
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("TaskContext not within provider");
  }
  const { taskType } = context;

  // Session
  const { data: session } = useSession();

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load tickets
      const ticketsResponse = await fetch('/api/tickets');
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.data || []);
      }

      // Load chat sessions
      const chatResponse = await fetch('/api/chat');
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChatSessions(chatData.data || []);
      }

      // Load analytics
      const analyticsResponse = await fetch('/api/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const current = analyticsData.data.current;
        setStats({
          totalTickets: current.week.tickets,
          openTickets: current.week.tickets - current.week.resolved,
          resolvedToday: current.today.resolved,
          avgResponseTime: current.today.avgResponseTime,
          customerSatisfaction: current.today.satisfaction,
          activeChats: chatSessions.filter(s => s.status === 'active').length,
          agentsOnline: current.agents.online,
          urgentTickets: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length
        });
      }

      // Load agents (mock data for now)
      setAgents([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@company.com',
          role: 'agent',
          status: 'online',
          skills: ['technical', 'billing'],
          currentChats: 3,
          maxChats: 5,
          performance: {
            avgResponseTime: 2.1,
            resolutionRate: 0.85,
            satisfactionScore: 4.3,
            ticketsResolved: 127
          },
          createdAt: new Date(),
          lastActive: new Date()
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@company.com',
          role: 'supervisor',
          status: 'online',
          skills: ['technical', 'account', 'billing'],
          currentChats: 2,
          maxChats: 4,
          performance: {
            avgResponseTime: 1.8,
            resolutionRate: 0.92,
            satisfactionScore: 4.7,
            ticketsResolved: 203
          },
          createdAt: new Date(),
          lastActive: new Date()
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort tickets
  const filteredTickets = tickets
    .filter(ticket => {
      if (ticketFilters.status && ticket.status !== ticketFilters.status) return false;
      if (ticketFilters.priority && ticket.priority !== ticketFilters.priority) return false;
      if (ticketFilters.category && ticket.category !== ticketFilters.category) return false;
      if (ticketFilters.assignedAgent && ticket.assignedAgentId !== ticketFilters.assignedAgent) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return ticket.title.toLowerCase().includes(query) ||
               ticket.description.toLowerCase().includes(query) ||
               ticket.id.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-blue-600 bg-blue-50 border-blue-200";
      case "in_progress": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "pending": return "text-orange-600 bg-orange-50 border-orange-200";
      case "resolved": return "text-green-600 bg-green-50 border-green-200";
      case "closed": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Format time ago
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Dashboard View
  if (currentView === "dashboard") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">AI Customer Support</h2>
            <nav className="flex space-x-4 ml-8">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("tickets")}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Tickets
              </button>
              <button
                onClick={() => setCurrentView("chat")}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Chat
              </button>
              <button
                onClick={() => setCurrentView("search")}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => setCurrentView("analytics")}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Analytics
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white">Welcome, {session?.user?.name || session?.user?.email || 'User'}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-white hover:text-gray-200 transition-colors"
            >
              Sign out
            </button>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
            />
            <button
              onClick={() => setOpenModal(true)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <IoSettingsSharp size={24} />
            </button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <div className="px-2 py-6">
                <Ragsubmit />
              </div>
            </Modal>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                    </div>
                    <FaTicketAlt className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium">{stats.openTickets} open</span>
                    <span className="text-gray-500 mx-2">•</span>
                    <span className="text-gray-500">{stats.resolvedToday} resolved today</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.avgResponseTime.toFixed(1)}h</p>
                    </div>
                    <FaClock className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-4">
                    <span className="text-green-600 font-medium">↓ 12% from yesterday</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.customerSatisfaction.toFixed(1)}/5</p>
                    </div>
                    <FaStar className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="mt-4">
                    <span className="text-green-600 font-medium">↑ 5% from last week</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Agents</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.agentsOnline}</p>
                    </div>
                    <FaHeadset className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500">{stats.activeChats} active chats</span>
                  </div>
                </div>
              </div>

              {/* Urgent Tickets Alert */}
              {stats.urgentTickets > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        {stats.urgentTickets} Urgent Ticket{stats.urgentTickets > 1 ? 's' : ''} Require Immediate Attention
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        These tickets need to be addressed within the next hour
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tickets */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {filteredTickets.slice(0, 10).map((ticket) => (
                      <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-blue-600">{ticket.id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{ticket.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{ticket.category}</span>
                              <span>•</span>
                              <span>{timeAgo(ticket.createdAt)}</span>
                              <span>•</span>
                              <span>{ticket.source}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Chat Sessions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Active Chat Sessions</h3>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {chatSessions.filter(s => s.status === 'active').slice(0, 10).map((session) => (
                      <div key={session.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-green-600">{session.id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(session.priority)}`}>
                                {session.priority}
                              </span>
                              <span className="text-xs text-gray-500">
                                {session.messages.length} messages
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {session.messages.length > 0
                                ? session.messages[session.messages.length - 1].content.substring(0, 100) + '...'
                                : 'No messages yet'
                              }
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{timeAgo(session.updatedAt)}</span>
                              <span>•</span>
                              <span>{session.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Performance */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Agent Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Active Chats
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Response
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resolution Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satisfaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {agent.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                <div className="text-sm text-gray-500">{agent.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              agent.status === 'online' ? 'text-green-600 bg-green-50' :
                              agent.status === 'away' ? 'text-yellow-600 bg-yellow-50' :
                              'text-gray-600 bg-gray-50'
                            }`}>
                              {agent.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {agent.currentChats}/{agent.maxChats}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {agent.performance.avgResponseTime.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(agent.performance.resolutionRate * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {agent.performance.satisfactionScore.toFixed(1)}/5
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tickets View
  if (currentView === "tickets") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">CS AI Assistant - Ticket Management</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaMountain size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("chat")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaComments size={16} />
              Live Chat
            </button>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
            />
            <button
              onClick={() => setOpenModal(true)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <IoSettingsSharp size={24} />
            </button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
              <div className="px-2 py-6">
                <Ragsubmit />
              </div>
            </Modal>
          </div>
        </div>

        {/* Ticket Management */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={ticketFilters.status}
                    onChange={(e) => setTicketFilters({...ticketFilters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={ticketFilters.priority}
                    onChange={(e) => setTicketFilters({...ticketFilters, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={ticketFilters.category}
                    onChange={(e) => setTicketFilters({...ticketFilters, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Account & Access">Account & Access</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Technical Issues">Technical Issues</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as any);
                      setSortOrder(order as any);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="priority-desc">Priority (High to Low)</option>
                    <option value="priority-asc">Priority (Low to High)</option>
                    <option value="updatedAt-desc">Recently Updated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Tickets ({filteredTickets.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">{ticket.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {timeAgo(ticket.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <FaEye size={16} />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <FaEdit size={16} />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat View
  if (currentView === "chat") {
    return <RealtimeChat />;
  }

  // Analytics View
  if (currentView === "analytics") {
    return <AnalyticsDashboard />;
  }

  // Search View
  if (currentView === "search") {
    return <AdvancedSearch />;
  }

  return null;
};

export default IntegratedDashboard;
