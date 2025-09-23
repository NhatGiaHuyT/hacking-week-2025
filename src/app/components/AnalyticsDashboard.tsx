"use client";

import { useState, useEffect } from "react";
import { FaChartLine, FaUsers, FaClock, FaStar, FaArrowUp, FaArrowDown, FaFilter, FaDownload } from "react-icons/fa";

// Analytics data interfaces
interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  agentPerformance: AgentPerformance[];
  ticketTrends: TicketTrend[];
  topIssues: TopIssue[];
}

interface AgentPerformance {
  id: string;
  name: string;
  ticketsResolved: number;
  avgResponseTime: number;
  satisfaction: number;
  status: "online" | "offline" | "busy";
}

interface TicketTrend {
  date: string;
  tickets: number;
  resolved: number;
}

interface TopIssue {
  category: string;
  count: number;
  percentage: number;
}

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
        const result = await response.json();

        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          console.error("Failed to fetch analytics data:", result.error);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-600 bg-green-100";
      case "busy": return "text-yellow-600 bg-yellow-100";
      case "offline": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const exportData = () => {
    // In real app, this would generate and download a report
    console.log("Exporting analytics data...");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const resolutionRate = (analyticsData.resolvedTickets / analyticsData.totalTickets * 100).toFixed(1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your customer support performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaDownload size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalTickets.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaArrowUp className="text-green-600 mr-1" size={12} />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-600 ml-2">from last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">{resolutionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaStar className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaArrowUp className="text-green-600 mr-1" size={12} />
            <span className="text-green-600">+3.2%</span>
            <span className="text-gray-600 ml-2">from last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.avgResponseTime}h</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaClock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaArrowDown className="text-green-600 mr-1" size={12} />
            <span className="text-green-600">-0.5h</span>
            <span className="text-gray-600 ml-2">improvement</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.customerSatisfaction}/5</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaUsers className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaArrowUp className="text-green-600 mr-1" size={12} />
            <span className="text-green-600">+0.3</span>
            <span className="text-gray-600 ml-2">from last period</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ticket Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Trends</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.ticketTrends.map((trend, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-blue-200 rounded-t" style={{ height: `${(trend.tickets / 70) * 100}%` }}>
                  <div className="bg-blue-600 h-full rounded-t" style={{ height: `${(trend.resolved / trend.tickets) * 100}%` }}></div>
                </div>
                <span className="text-xs text-gray-600 mt-2">{trend.date.split('-')[2]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Total</span>
            </div>
          </div>
        </div>

        {/* Top Issues */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
          <div className="space-y-3">
            {analyticsData.topIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{issue.category}</span>
                    <span className="text-sm text-gray-600">{issue.count} ({issue.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${issue.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Agent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Tickets Resolved</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Avg Response</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.agentPerformance.map((agent) => (
                <tr key={agent.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{agent.ticketsResolved}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{agent.avgResponseTime}h</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-1" size={12} />
                      <span className="text-sm text-gray-900">{agent.satisfaction}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
