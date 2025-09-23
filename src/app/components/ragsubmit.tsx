"use client";

import { useState, FormEvent, useContext } from "react";
import { TaskContext } from "../context/taskContext";
import RealtimeChat from "./RealtimeChat";
import AdvancedSearch from "./AdvancedSearch";
import AnalyticsDashboard from "./AnalyticsDashboard";
import {
  FaTicketAlt,
  FaBrain,
  FaChartLine,
  FaLightbulb,
  FaDatabase,
  FaSearch,
  FaPlus,
  FaTags,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaComment,
  FaLink,
  FaComments,
  FaChartBar,
  FaMountain
} from "react-icons/fa";

interface TicketAnalysis {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  relatedTickets: RelatedTicket[];
  suggestedActions: string[];
  knowledgeGaps: string[];
  resolutionPatterns: ResolutionPattern[];
}

interface RelatedTicket {
  id: string;
  title: string;
  status: string;
  similarity: number;
  resolution: string;
  createdAt: string;
}

interface ResolutionPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  avgResolutionTime: number;
}

interface CustomerInsight {
  behavior: string;
  commonIssues: string[];
  satisfaction: number;
  preferredChannels: string[];
}

const Ragsubmit = () => {
  const [inputText, setInputText] = useState<string>("");
  const [analysisMode, setAnalysisMode] = useState<'ticket' | 'knowledge' | 'patterns' | 'insights'>('ticket');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TicketAnalysis | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight | null>(null);
  const [currentView, setCurrentView] = useState<'ragsubmit' | 'chat' | 'search' | 'analytics'>('ragsubmit');

  // Context for task selection
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("TaskContext not within provider");
  }
  const { taskType, setTaskType } = context;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setAnalysisResult(null);
    setCustomerInsights(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          mode: analysisMode,
          taskType: taskType
        }),
      });

      const result = await response.json();

      if (analysisMode === 'ticket') {
        setAnalysisResult(result.analysis);
      } else if (analysisMode === 'insights') {
        setCustomerInsights(result.insights);
      }
      // For other modes, handle accordingly

    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Render Chat View
  if (currentView === 'chat') {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">CS AI Assistant - Live Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('ragsubmit')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaBrain size={16} />
              Back to Analysis
            </button>
          </div>
        </div>
        <div className="flex-1">
          <RealtimeChat />
        </div>
      </div>
    );
  }

  // Render Search View
  if (currentView === 'search') {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-brand-primary text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">Customer Support AI Assistant - Tìm Kiếm Nâng Cao</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('ragsubmit')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaBrain size={16} />
              Back to Analysis
            </button>
          </div>
        </div>
        <div className="flex-1">
          <AdvancedSearch />
        </div>
      </div>
    );
  }

  // Render Analytics View
  if (currentView === 'analytics') {
    return (
      <div className="flex flex-col h-screen bg-gray-50 w-full">
        <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <FaMountain size={30} />
            <h2 className="text-xl font-medium">CS AI Assistant - Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('ragsubmit')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <FaBrain size={16} />
              Back to Analysis
            </button>
          </div>
        </div>
        <div className="flex-1">
          <AnalyticsDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-brand-primary text-white px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
          <img
            src="/images/Icon.jpeg"
            alt="logo"
            width={40}
            height={40}
            style={{ borderRadius: '8px', objectFit: 'cover' }}
          />
            <h2 className="text-xl font-medium">Intelligent Ticket Analysis & Knowledge System</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('chat')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-accent hover:text-black text-white rounded-lg transition-colors"
            >
              <FaComments size={16} />
              Chat
            </button>
            <button
              onClick={() => setCurrentView('search')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-accent hover:text-black text-white rounded-lg transition-colors"
            >
              <FaSearch size={16} />
              Search
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-accent hover:text-black text-white rounded-lg transition-colors"
            >
              <FaChartBar size={16} />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-brand-primary flex items-center justify-center gap-3">
            <FaBrain size={36} />
            Intelligent Ticket Analysis & Knowledge System
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Comprehensive AI-powered analysis tool for ticket processing, knowledge management,
            pattern recognition, and customer insights. Transform your support workflow with intelligent automation.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setAnalysisMode('ticket')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'ticket'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <FaTicketAlt className="mx-auto mb-2" size={24} />
            <div className="text-sm font-medium">Ticket Analysis</div>
          </button>

          <button
            onClick={() => setAnalysisMode('knowledge')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'knowledge'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <FaDatabase className="mx-auto mb-2" size={24} />
            <div className="text-sm font-medium">Knowledge Base</div>
          </button>

          <button
            onClick={() => setAnalysisMode('patterns')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'patterns'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <FaChartLine className="mx-auto mb-2" size={24} />
            <div className="text-sm font-medium">Pattern Analysis</div>
          </button>

          <button
            onClick={() => setAnalysisMode('insights')}
            className={`p-4 rounded-lg border-2 transition-all ${
              analysisMode === 'insights'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <FaLightbulb className="mx-auto mb-2" size={24} />
            <div className="text-sm font-medium">Customer Insights</div>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              {analysisMode === 'ticket' && 'Describe the customer issue or ticket details:'}
              {analysisMode === 'knowledge' && 'Enter information to add to knowledge base:'}
              {analysisMode === 'patterns' && 'Describe the pattern or issue to analyze:'}
              {analysisMode === 'insights' && 'Enter customer information or behavior data:'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                analysisMode === 'ticket'
                  ? 'Customer reports that they cannot access their account after password reset. Error message: "Invalid credentials" appears when trying to log in...'
                  : analysisMode === 'knowledge'
                  ? 'Document the solution for common login issues, including troubleshooting steps and escalation procedures...'
                  : analysisMode === 'patterns'
                  ? 'Customers frequently report login issues after password resets, especially with 2FA enabled accounts...'
                  : 'Customer prefers email communication, has reported 3 similar issues in the past month, satisfaction score: 4.2/5...'
              }
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Context:
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="customer_support">Customer Support</option>
                <option value="technical_support">Technical Support</option>
                <option value="billing_inquiry">Billing & Payments</option>
                <option value="account_issues">Account Management</option>
                <option value="general_inquiry">General Information</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2 min-w-[150px] justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <FaSearch size={16} />
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your input with AI...</p>
          </div>
        )}

        {/* Ticket Analysis Results */}
        {analysisResult && analysisMode === 'ticket' && (
          <div className="space-y-6">
            {/* Main Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FaTicketAlt className="text-blue-600" />
                Ticket Analysis Results
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Details */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Ticket Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900">{analysisResult.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {analysisResult.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Priority:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(analysisResult.priority)}`}>
                        {analysisResult.priority}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Confidence:</span>
                      <span className={`ml-2 font-bold ${getConfidenceColor(analysisResult.confidence)}`}>
                        {analysisResult.confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2">
                      <FaPlus size={16} />
                      Create Ticket
                    </button>
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                      <FaTags size={16} />
                      Add to KB
                    </button>
                    <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2">
                      <FaLink size={16} />
                      Link Related
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Tickets */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaComment className="text-green-600" />
                Related Past Tickets ({analysisResult.relatedTickets.length})
              </h3>
              <div className="space-y-3">
                {analysisResult.relatedTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{ticket.resolution}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">{ticket.similarity}% match</span>
                        <p className="text-xs text-gray-500">{ticket.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Status: {ticket.status}</span>
                      <span>•</span>
                      <span>ID: {ticket.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                Suggested Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysisResult.suggestedActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" size={16} />
                    <span className="text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Gaps */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-600" />
                Knowledge Gaps & Recommendations
              </h3>
              <div className="space-y-3">
                {analysisResult.knowledgeGaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <FaExclamationTriangle className="text-orange-600 mt-1 flex-shrink-0" size={16} />
                    <span className="text-gray-700">{gap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Patterns */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaChartLine className="text-purple-600" />
                Resolution Patterns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResult.resolutionPatterns.map((pattern, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{pattern.pattern}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium">{pattern.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium text-green-600">{pattern.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Time:</span>
                        <span className="font-medium">{pattern.avgResolutionTime}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Insights Results */}
        {customerInsights && analysisMode === 'insights' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaUser className="text-orange-600" />
              Customer Insights
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Behavior Analysis</h3>
                <p className="text-gray-700 mb-4">{customerInsights.behavior}</p>

                <h3 className="text-lg font-semibold mb-3">Preferred Channels</h3>
                <div className="flex flex-wrap gap-2">
                  {customerInsights.preferredChannels.map((channel, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
                <div className="space-y-2">
                  {customerInsights.commonIssues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FaExclamationTriangle className="text-yellow-600" size={14} />
                      <span className="text-gray-700">{issue}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Satisfaction Score</span>
                    <span className="text-2xl font-bold text-green-600">
                      {customerInsights.satisfaction}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Mode Results */}
        {analysisMode === 'knowledge' && !isLoading && inputText && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaDatabase className="text-green-600" />
              Knowledge Base Entry Created
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ Your knowledge base entry has been successfully processed and indexed.
                It will now be searchable for future ticket analysis and support queries.
              </p>
            </div>
          </div>
        )}

        {/* Pattern Analysis Mode Results */}
        {analysisMode === 'patterns' && !isLoading && inputText && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaChartLine className="text-purple-600" />
              Pattern Analysis Complete
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Pattern Detected</h3>
                <p className="text-purple-700">Similar patterns found in historical data</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
                <p className="text-blue-700">Preventive measures and process improvements suggested</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ragsubmit;
