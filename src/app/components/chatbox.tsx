"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { FaMountain, FaPaperPlane, FaCopy, FaChartBar, FaComments, FaSearch } from "react-icons/fa";
import Modal from "./modal";
import Ragsubmit from "./ragsubmit";
import { IoSettingsSharp } from "react-icons/io5";
import { TaskContext } from "../context/taskContext";
import { useContext } from "react";
import LanguageSelector from './languageSelector';
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedSearch from './AdvancedSearch';
import RealtimeChat from './RealtimeChat';
import Logo from '.../public/Icon.jpeg';
import Image from 'next/image';


// Define ticket interface
interface Ticket {
  id: string;
  title: string;
  snippet: string;
  date: string;
  priority: "high" | "medium" | "low";
  relevance: number;
}

// Fetching response from gen ai endpoint
const GetResponse = async (
  messageToSend: string,
  taskType: string,
  language: string
): Promise<{ success: boolean; body?: { message: string } }> => {
  const data = { message: messageToSend, taskType: taskType, language: language };
  const headers = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  return await fetch("/api/genMsg", headers)
    .then((response) => response.json())
    .catch((e) => {
      console.log(e);
      return { success: false };
    });
};

const Chatbox = () => {
  const [issueDescription, setIssueDescription] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [relatedTickets, setRelatedTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Vietnamese");
  const [currentView, setCurrentView] = useState<"main" | "analytics" | "search" | "chat">("main");

  // states for tasks selection
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("TaskContext not within provider");
  }
  const { taskType } = context;

  // Mock data for related tickets
  const mockTickets: Ticket[] = [
    {
      id: "#1234",
      title: "Issue with login",
      snippet: "Customer unable to access account after password reset",
      date: "2 days ago",
      priority: "high",
      relevance: 95
    },
    {
      id: "#1256",
      title: "Password reset problem",
      snippet: "Reset email not received, account locked",
      date: "1 week ago",
      priority: "medium",
      relevance: 87
    },
    {
      id: "#1290",
      title: "Login error",
      snippet: "Invalid credentials error on multiple attempts",
      date: "3 months ago",
      priority: "low",
      relevance: 76
    },
    {
      id: "#1301",
      title: "Account verification issue",
      snippet: "Email verification link expired",
      date: "5 days ago",
      priority: "medium",
      relevance: 82
    },
    {
      id: "#1287",
      title: "Two-factor authentication",
      snippet: "2FA code not being received via SMS",
      date: "1 month ago",
      priority: "high",
      relevance: 91
    }
  ];

  // Handle Query AI submission
  const handleQueryAI = async (e: FormEvent) => {
    e.preventDefault();
    if (issueDescription.trim()) {
      setIsLoading(true);
      setAiSummary("");
      setRelatedTickets([]);

      try {
        // Get AI response
        const response = await GetResponse(issueDescription, taskType, selectedLanguage);

        if (response.success && response.body) {
          setAiSummary(response.body.message);
          // Simulate related tickets (in real app, this would come from RAG API)
          setRelatedTickets(mockTickets.slice(0, 5));
        } else {
          setAiSummary("There was an error generating the AI response. Please try again.");
        }
      } catch (error) {
        setAiSummary("An error occurred while processing your request.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Copy AI summary to clipboard
  const copyToClipboard = async () => {
    if (aiSummary) {
      try {
        await navigator.clipboard.writeText(aiSummary);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  // Get relevance color
  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 90) return "border-l-4 border-l-green-500";
    if (relevance >= 80) return "border-l-4 border-l-yellow-500";
    return "border-l-4 border-l-gray-300";
  };

  // Render Analytics Dashboard
  if (currentView === "analytics") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
          <img src="/images/Icon.jpeg" alt="fireSpot" width={40} height={40} />
            <h2 className="text-xl font-medium">CS AI Assistant - Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("main")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaComments size={16} />
              Back to Tool
            </button>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
            />
            <button
              onClick={() => setOpenModal(true)}
              className="p-2 hover:bg-brand-primary rounded-lg transition-colors"
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
        <AnalyticsDashboard />
      </div>
    );
  }

  // Render Advanced Search
  if (currentView === "search") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">CS AI Assistant - Advanced Search</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("main")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaComments size={16} />
              Back to Tool
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
        <AdvancedSearch />
      </div>
    );
  }

  // Render Real-time Chat
  if (currentView === "chat") {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">CS AI Assistant - Live Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("main")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaComments size={16} />
              Back to Tool
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
        <RealtimeChat />
      </div>
    );
  }

  // Render Main CS AI Tool
  return (
    <div className="flex flex-col h-screen bg-gray-50 w-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-primary text-white px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <FaMountain size={30} />
          <h2 className="text-xl font-medium">CS AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView("chat")}
            className="flex items-center gap-2 px-4 py-2 bg- bg-brand-secondary text-black rounded-lg transition-colors"
          >
            <FaComments size={16} />
            Chat
          </button>
          <button
            onClick={() => setCurrentView("search")}
            className="flex items-center gap-2 px-4 py-2 bg-brand-secondary text-black rounded-lg transition-colors"
          >
            <FaSearch size={16} />
            Search
          </button>
          <button
            onClick={() => setCurrentView("analytics")}
            className="flex items-center gap-2 px-4 py-2 bg-brand-secondary text-black rounded-lg transition-colors"
          >
            <FaChartBar size={16} />
            Analytics
          </button>
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
          <button
            onClick={() => setOpenModal(true)}
            className="p-2 bg-brand-secondary text-black rounded-lg transition-colors"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column - Input Section */}
        <div className="flex-1 lg:flex-[1] p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
          <form onSubmit={handleQueryAI} className="h-full flex flex-col">
            <div className="mb-4">
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Describe customer issue:
              </label>
              <textarea
                value={issueDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setIssueDescription(e.target.value);
                }}
                placeholder="Enter detailed description of the customer issue..."
                className="w-full h-64 lg:h-80 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={8}
              />
            </div>
            <div className="mt-auto">
              <button
                type="submit"
                disabled={isLoading || !issueDescription.trim()}
                className="w-full lg:w-auto px-6 py-3 bg-brand-primary hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={16} />
                    Query AI
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Output Sections */}
        <div className="flex-1 lg:flex-[1] flex flex-col">
          {/* AI Summary Section */}
          <div className="flex-1 p-4 lg:p-6 border-b border-gray-200">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Suggested Resolution</h3>
                {aiSummary && (
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <FaCopy size={16} />
                  </button>
                )}
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : aiSummary ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{aiSummary}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    AI-generated resolution will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Past Tickets Section */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Related Past Tickets</h3>
              <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-y-auto">
                {relatedTickets.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {relatedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getRelevanceColor(ticket.relevance)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-600">{ticket.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{ticket.date}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{ticket.title}</h4>
                        <p className="text-sm text-gray-600">{ticket.snippet}</p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">
                            Relevance: {ticket.relevance}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Related tickets will appear here after querying AI
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
