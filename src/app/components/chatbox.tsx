import { FaMountain, FaPaperPlane, FaCopy, FaChartBar, FaComments, FaSearch } from "react-icons/fa";

import { useState, FormEvent, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "./modal";
import Ragsubmit from "./ragsubmit";
import { IoSettingsSharp } from "react-icons/io5";
import { TaskContext } from "../context/taskContext";
import { useContext } from "react";
import LanguageSelector from './languageSelector';
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedSearch from './AdvancedSearch';
import RealtimeChat from './RealtimeChat';
import { NextRequest } from 'next/server';

// Define ticket interface
interface Ticket {
  id: string;
  title: string;
  date: string;
  relevance: number;
  link: string;
  ticket_id: string;
  issueDesc: string;
  resolveCommentCS: string[];
}

// Convert file to base64
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Fetching response from gen ai endpoint
const GetResponse = async (
  messageToSend: string,
  taskType: string,
  language: string,
  media: string[]
): Promise<{ success: boolean; body?: { message: string } }> => {
  const data = { message: messageToSend, taskType: taskType, language: language, media: media };
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
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);

  // states for tasks selection
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("TaskContext not within provider");
  }
  const { taskType } = context;



  const router = useRouter();

  // Fetch related tickets from API
  const fetchRelatedTickets = async (): Promise<Ticket[]> => {
    try {
      const response = await fetch('/api/tickets?limit=5');
      const data = await response.json();
      if (data.success) {
        return data.data.map((ticket: any) => ({
          id: ticket.id,
          title: ticket.title,
          snippet: ticket.description.substring(0, 100) + '...',
          date: new Date(ticket.createdAt).toLocaleDateString(),
          priority: ticket.priority,
          relevance: Math.floor(Math.random() * 20) + 80, // Simulate relevance
          link: `/tickets/${ticket.id}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  };

  // Mock data for related tickets
  const mockTickets: Ticket[] = [
  {
    id: "#525",
    title: "ekyc_nfc",
    date: "2 days ago",
    relevance: 90,
    link: "",
    ticket_id: "525",
    issueDesc: "Xác thực gương mặt xoay/ đơ/ văng khỏi app",
    resolveCommentCS: [
      "Bước 1: CS_TN tư vấn User thoát app, update lên phiên bản mới nhất (nếu có) và thử lại. \n- Nếu thành công: Đóng case\n- Nếu User đã thực hiện theo hướng dẫn nhưng vẫn không thao tác được => CS TN thông tin User thông cảm quay lại sau 48h và chuyển CS XL.\n\nBước 2: CS_XL chuyển Dev KYC hỗ trợ.\nPIC: hieu.le7\nSLA xử lý: 48h"
    ]
  },
  {
    id: "#415",
    title: "ekyc_nfc",
    date: "1 week ago",
    relevance: 66,
    link: "https://happyuser.mservice.com.vn/browse/HAPPYUSER-702482",
    ticket_id: "415",
    issueDesc: "sao tôi k xác thực được?",
    resolveCommentCS: [
      "Nhờ người thân quét NFC hoặc ra cửa hàng TGDD để được hỗ trợ - SYSTEM"
    ]
  },
  {
    id: "#404",
    title: "ekyc_nfc_result",
    date: "3 months ago",
    relevance: 66,
    link: "https://happyuser.mservice.com.vn/browse/HAPPYUSER-711391",
    ticket_id: "404",
    issueDesc: "hỗ trợ tôi để xác thực tài khoản",
    resolveCommentCS: ["User update lại thông tin kyc - SYSTEM"]
  },
  {
    id: "#411",
    title: "ekyc_extracted_info",
    date: "5 days ago",
    relevance: 64,
    link: "https://happyuser.mservice.com.vn/browse/HAPPYUSER-636454",
    ticket_id: "411",
    issueDesc: "ko xác thực được",
    resolveCommentCS: [
      "User bị đứng ở màn hình face và đã xác thực lại thành công - null"
    ]
  },
  {
    id: "#375",
    title: "ekyc_input_phone_nfc_by_friend",
    date: "1 month ago",
    relevance: 62,
    link: "https://happyuser.mservice.com.vn/browse/HAPPYUSER-646454",
    ticket_id: "375",
    issueDesc:
      "mình đã xác thực trên điện thoại khác nhưng không có sim giờ vào máy đang sài thì thấy chưa xác thực",
    resolveCommentCS: [
      "User nhờ người khác hoặc ra TGDD để hỗ trợ NFC - SYSTEM"
    ]
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
        // Check for specific mock query
          const mockQuery = "Xác thực gương mặt xoay/đơ/văng khỏi app thì xử lý thế nào?";
        if (issueDescription.trim() === mockQuery) {
          // Return mock response for the specific query
          const mockResponse = "Nếu bạn đang gặp sự cố với xác minh khuôn mặt, chẳng hạn như màn hình bị xoay, đơ, hoặc ứng dụng bị văng ra (như được mô tả trong Tài liệu 1), vui lòng làm theo các bước sau:\n\n1. Thoát ứng dụng.\n2. Cập nhật ứng dụng lên phiên bản mới nhất (nếu có).\n3. Thử xác minh khuôn mặt lại.\n\nNếu sự cố vẫn tiếp diễn sau khi thực hiện các bước trên, vui lòng thử lại sau 48 giờ.\n\nCác bước bổ sung:\n- Thoát và khởi động lại ứng dụng.\n- Cập nhật ứng dụng ngân hàng lên phiên bản mới nhất.\n- Nếu sự cố vẫn còn, hãy thử lại quy trình xác minh khuôn mặt sau 48 giờ.";
          setAiSummary(mockResponse);
          setRelatedTickets(mockTickets.slice(0, 5));
        } else {
          // Get AI response for other queries
          const mediaBase64 = await Promise.all(selectedMedia.map(toBase64));
          const response = await GetResponse(issueDescription, taskType, selectedLanguage, mediaBase64);

          if (response.success && response.body) {
            setAiSummary(response.body.message);
            // Fetch related tickets from API
            const fetchedTickets = await fetchRelatedTickets();
            setRelatedTickets(fetchedTickets.length > 0 ? fetchedTickets : mockTickets.slice(0, 5));
          } else {
            setAiSummary("There was an error generating the AI response. Please try again.");
          }
        }
      } catch (error) {
        setAiSummary("An error occurred while processing your request.");
      } finally {
        setIsLoading(false);
        setSelectedMedia([]);
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

  // Get relevance style
  const getRelevanceStyle = (relevance: number) => {
    console.log(`getRelevanceStyle called with relevance: ${relevance}`);
    if (typeof relevance !== 'number' || isNaN(relevance)) {
      console.log('Relevance is invalid, returning gray');
      return { borderLeft: '4px solid #d1d5db' }; // gray-300
    }
    if (relevance >= 90) {
      console.log('Relevance >=90, returning green');
      return { borderLeft: '4px solid #10b981' }; // green-500
    }
    if (relevance >= 80) {
      console.log('Relevance >=80, returning yellow');
      return { borderLeft: '4px solid #f59e0b' }; // yellow-500
    }
    console.log('Relevance <80, returning gray');
    return { borderLeft: '4px solid #d1d5db' }; // gray-300
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
            <img
            src="/images/Icon.jpeg"
            alt="logo"
            width={40}
            height={40}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
          />
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
            <img
            src="/images/Icon.jpeg"
            alt="logo"
            width={40}
            height={40}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
          />
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
          <img
            src="/images/Icon.jpeg"
            alt="logo"
            width={40}
            height={40}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
          />
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
                className="w-full h-64 lg:h-30 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                rows={8}
              />
            </div>
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                📎 Upload Media (optional)
              </label>

              {/* Drag and Drop Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files) {
                      setSelectedMedia(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Drop images or videos here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
                  </div>
                </label>
              </div>

              {/* Selected Media Preview */}
              {selectedMedia.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Selected Files ({selectedMedia.length})</h4>
                    <button
                      onClick={() => setSelectedMedia([])}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedMedia.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`preview-${index}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-purple-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs text-gray-600 font-medium">Video</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
                          <button
                            onClick={() => {
                              const newMedia = selectedMedia.filter((_, i) => i !== index);
                              setSelectedMedia(newMedia);
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate px-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-auto">
              <button
                type="submit"
                disabled={isLoading || !issueDescription.trim()}
                className="w-full lg:w-auto px-8 py-4 bg-brand-primary  disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <div                 className="w-full lg:w-auto px-6 py-3 bg-brand-primary hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 bg-white bg-opacity-20 rounded-lg">
                      <FaPaperPlane size={18} />
                    </div>
                    <span>Query AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Output Sections */}
        <div className="flex-1 lg:flex-[1] flex flex-col overflow-y-auto">
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
              <div className="flex-1 bg-white border-2 border-gray-200 rounded-xl p-6 overflow-y-auto shadow-sm hover:shadow-md transition-all duration-300">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                      <p className="text-gray-500 font-medium">Generating AI response...</p>
                    </div>
                  </div>
                ) : aiSummary ? (
                  <div className="prose max-w-none">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="font-medium">AI-generated resolution will appear here</p>
                      <p className="text-sm text-gray-300 mt-1">Describe your issue and click "Query AI" to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Past Tickets Section */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Related Past Tickets</h3>
              <div className="flex-1 bg-white border-2 border-gray-200 rounded-xl overflow-y-auto shadow-sm hover:shadow-md transition-all duration-300">
                {relatedTickets.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {relatedTickets.map((ticket, index) => {
                      console.log(`Ticket ${index}: relevance = ${ticket.relevance}, style = ${JSON.stringify(getRelevanceStyle(ticket.relevance))}`);
                      return (
                        <div
                          key={ticket.id}
                          className="p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-sm"
                          style={{ animationDelay: `${index * 100}ms`, ...getRelevanceStyle(ticket.relevance) }}
                          onClick={() => router.push(ticket.link)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs">{ticket.id}</span>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${ticket.relevance >= 90 ? 'bg-green-500' : ticket.relevance >= 80 ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-gray-500 font-medium">{ticket.relevance}% match</span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{ticket.date}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">{ticket.title}</h4>
                          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg mb-3">
                            <p className="text-xs text-red-700 font-medium">Issue: {ticket.issueDesc}</p>
                          </div>
                          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg">
                            <p className="text-xs text-green-700 font-medium">Resolution: {ticket.resolveCommentCS.join(', ')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-medium">Related tickets will appear here after querying AI</p>
                      <p className="text-sm text-gray-300 mt-1">AI will find similar past issues to help you</p>
                    </div>
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