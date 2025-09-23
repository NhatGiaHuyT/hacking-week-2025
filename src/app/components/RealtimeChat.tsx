"use client";

import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaFileUpload, FaDownload, FaUser, FaRobot, FaPhone, FaVideo, FaTimes, FaSmile, FaPaperclip } from "react-icons/fa";

// Chat message interface
interface ChatMessage {
  id: string;
  sender: "agent" | "customer" | "system";
  content: string;
  timestamp: Date;
  type: "text" | "file" | "image";
  fileUrl?: string;
  fileName?: string;
  isTyping?: boolean;
}

// Customer interface
interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
}

// Chat session interface
interface ChatSession {
  id: string;
  customer: Customer;
  messages: ChatMessage[];
  status: "active" | "waiting" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  updatedAt: Date;
}

const RealtimeChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for demonstration
  const mockSessions: ChatSession[] = [
    {
      id: "chat_001",
      customer: {
        id: "cust_001",
        name: "John Doe",
        email: "john.doe@example.com",
        status: "online",
        lastSeen: new Date()
      },
      messages: [
        {
          id: "msg_001",
          sender: "customer",
          content: "Hi, I'm having trouble with my login. I keep getting an error message.",
          timestamp: new Date(Date.now() - 300000),
          type: "text"
        },
        {
          id: "msg_002",
          sender: "agent",
          content: "Hello John! I'd be happy to help you with your login issue. Can you tell me what error message you're seeing?",
          timestamp: new Date(Date.now() - 240000),
          type: "text"
        },
        {
          id: "msg_003",
          sender: "customer",
          content: "It says 'Invalid credentials' even though I'm sure I'm using the right password.",
          timestamp: new Date(Date.now() - 180000),
          type: "text"
        }
      ],
      status: "active",
      priority: "medium",
      createdAt: new Date(Date.now() - 300000),
      updatedAt: new Date(Date.now() - 180000)
    },
    {
      id: "chat_002",
      customer: {
        id: "cust_002",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        status: "away",
        lastSeen: new Date(Date.now() - 600000)
      },
      messages: [
        {
          id: "msg_004",
          sender: "customer",
          content: "I need help with my billing statement. There seems to be an error in the charges.",
          timestamp: new Date(Date.now() - 900000),
          type: "text"
        }
      ],
      status: "waiting",
      priority: "high",
      createdAt: new Date(Date.now() - 900000),
      updatedAt: new Date(Date.now() - 900000)
    },
    {
      id: "chat_003",
      customer: {
        id: "cust_003",
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        status: "offline",
        lastSeen: new Date(Date.now() - 3600000)
      },
      messages: [
        {
          id: "msg_005",
          sender: "customer",
          content: "Thank you for your help earlier! The issue has been resolved.",
          timestamp: new Date(Date.now() - 7200000),
          type: "text"
        },
        {
          id: "msg_006",
          sender: "agent",
          content: "You're very welcome, Mike! I'm glad we could resolve your issue. Feel free to reach out if you need any further assistance.",
          timestamp: new Date(Date.now() - 7200000),
          type: "text"
        }
      ],
      status: "closed",
      priority: "low",
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000)
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setSessions(mockSessions);
    setActiveSession(mockSessions[0]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!message.trim() || !activeSession) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "agent",
      content: message,
      timestamp: new Date(),
      type: "text"
    };

    // Update active session with new message
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, newMessage],
      updatedAt: new Date()
    };

    setActiveSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
    setMessage("");

    // Simulate customer response after 2-5 seconds
    setTimeout(() => {
      const responses = [
        "Thank you for your help!",
        "That makes sense. Let me try that.",
        "I see. Can you explain that again?",
        "Perfect! That worked.",
        "I'm still having issues. Can you help me further?"
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const customerMessage: ChatMessage = {
        id: `msg_${Date.now()}_customer`,
        sender: "customer",
        content: randomResponse,
        timestamp: new Date(),
        type: "text"
      };

      const updatedSessionWithResponse = {
        ...updatedSession,
        messages: [...updatedSession.messages, customerMessage],
        updatedAt: new Date()
      };

      setActiveSession(updatedSessionWithResponse);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSessionWithResponse : s));
    }, Math.random() * 3000 + 2000);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeSession) {
      const fileMessage: ChatMessage = {
        id: `msg_${Date.now()}_file`,
        sender: "agent",
        content: `Shared file: ${file.name}`,
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? "image" : "file",
        fileUrl: URL.createObjectURL(file),
        fileName: file.name
      };

      const updatedSession = {
        ...activeSession,
        messages: [...activeSession.messages, fileMessage],
        updatedAt: new Date()
      };

      setActiveSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSession : s));
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "away": return "text-yellow-500";
      case "offline": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Sessions Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Live Chat</h2>
          <p className="text-sm text-gray-500">
            {sessions.filter(s => s.status === "active").length} active conversations
          </p>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeSession?.id === session.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {session.customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{session.customer.name}</p>
                    <p className="text-xs text-gray-500">{session.customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(session.customer.status)}`}></span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(session.priority)}`}>
                    {session.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {session.messages[session.messages.length - 1]?.content || "No messages yet"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatTime(session.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {activeSession.customer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{activeSession.customer.name}</h3>
                  <p className="text-sm text-gray-500">{activeSession.customer.email}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(activeSession.customer.status)}`}></span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <FaPhone size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <FaVideo size={16} />
                </button>
                <button
                  onClick={() => setActiveSession(null)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === "agent"
                        ? "bg-blue-600 text-white"
                        : msg.sender === "system"
                        ? "bg-gray-100 text-gray-600 text-center"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    {msg.type === "text" && (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    {msg.type === "file" && (
                      <div className="flex items-center gap-2">
                        <FaFileUpload size={16} />
                        <span className="text-sm">{msg.fileName}</span>
                        <button
                          onClick={() => msg.fileUrl && window.open(msg.fileUrl)}
                          className="text-blue-200 hover:text-white"
                        >
                          <FaDownload size={12} />
                        </button>
                      </div>
                    )}
                    {msg.type === "image" && (
                      <div>
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName}
                          className="max-w-full h-auto rounded"
                        />
                        <p className="text-xs mt-1">{msg.fileName}</p>
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${
                      msg.sender === "agent" ? "text-blue-200" : "text-gray-400"
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <FaSmile size={16} />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <FaPaperclip size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaPaperPlane size={16} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FaUser className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat session from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeChat;
