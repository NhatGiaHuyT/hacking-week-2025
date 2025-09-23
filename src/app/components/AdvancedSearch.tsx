"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaTimes, FaSort, FaCalendarAlt, FaTag, FaUser, FaExclamationTriangle } from "react-icons/fa";

// Search and filter interfaces
interface SearchFilters {
  dateRange: {
    start: string;
    end: string;
  };
  priority: string[];
  status: string[];
  agent: string[];
  category: string[];
  tags: string[];
  customerName: string;
  ticketId: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  agent: string;
  customerName: string;
  createdDate: string;
  updatedDate: string;
  tags: string[];
  relevance: number;
}

const AdvancedSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: {
      start: "",
      end: ""
    },
    priority: [],
    status: [],
    agent: [],
    category: [],
    tags: [],
    customerName: "",
    ticketId: ""
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "priority">("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock data for demonstration
  const mockResults: SearchResult[] = [
    {
      id: "#1234",
      title: "Login issue after password reset",
      description: "Customer unable to access account after password reset. Error message: 'Invalid credentials'. Multiple failed attempts.",
      status: "open",
      priority: "high",
      category: "Authentication",
      agent: "Alice Johnson",
      customerName: "John Doe",
      createdDate: "2024-01-15",
      updatedDate: "2024-01-15",
      tags: ["login", "password", "urgent"],
      relevance: 95
    },
    {
      id: "#1235",
      title: "Billing discrepancy in monthly invoice",
      description: "Customer reports incorrect charges on monthly bill. Amount differs from agreed pricing plan.",
      status: "in-progress",
      priority: "medium",
      category: "Billing",
      agent: "Bob Smith",
      customerName: "Jane Smith",
      createdDate: "2024-01-14",
      updatedDate: "2024-01-15",
      tags: ["billing", "invoice", "discrepancy"],
      relevance: 87
    },
    {
      id: "#1236",
      title: "Feature request: Dark mode support",
      description: "Customer requesting dark mode feature for better accessibility and user experience.",
      status: "resolved",
      priority: "low",
      category: "Feature Request",
      agent: "Carol Davis",
      customerName: "Mike Johnson",
      createdDate: "2024-01-10",
      updatedDate: "2024-01-12",
      tags: ["feature", "ui", "accessibility"],
      relevance: 76
    },
    {
      id: "#1237",
      title: "API rate limiting issue",
      description: "Customer experiencing API rate limiting errors when making multiple requests per minute.",
      status: "closed",
      priority: "urgent",
      category: "Technical",
      agent: "David Wilson",
      customerName: "Tech Corp",
      createdDate: "2024-01-08",
      updatedDate: "2024-01-09",
      tags: ["api", "rate-limit", "technical"],
      relevance: 91
    }
  ];

  // Available filter options
  const filterOptions = {
    priority: ["low", "medium", "high", "urgent"],
    status: ["open", "in-progress", "resolved", "closed"],
    category: ["Authentication", "Billing", "Technical", "Feature Request", "General"],
    agent: ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson"]
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && !hasActiveFilters()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let results = [...mockResults];

      // Apply text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        results = results.filter(result =>
          result.title.toLowerCase().includes(query) ||
          result.description.toLowerCase().includes(query) ||
          result.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply filters
      results = applyFilters(results);

      // Apply sorting
      results = sortResults(results);

      setSearchResults(results);
      setIsLoading(false);
    }, 800);
  };

  // Apply filters to results
  const applyFilters = (results: SearchResult[]): SearchResult[] => {
    let filtered = [...results];

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.createdDate);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && resultDate < startDate) return false;
        if (endDate && resultDate > endDate) return false;
        return true;
      });
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(result => filters.priority.includes(result.priority));
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(result => filters.status.includes(result.status));
    }

    // Agent filter
    if (filters.agent.length > 0) {
      filtered = filtered.filter(result => filters.agent.includes(result.agent));
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(result => filters.category.includes(result.category));
    }

    // Customer name filter
    if (filters.customerName.trim()) {
      const customerQuery = filters.customerName.toLowerCase();
      filtered = filtered.filter(result =>
        result.customerName.toLowerCase().includes(customerQuery)
      );
    }

    // Ticket ID filter
    if (filters.ticketId.trim()) {
      filtered = filtered.filter(result =>
        result.id.toLowerCase().includes(filters.ticketId.toLowerCase())
      );
    }

    return filtered;
  };

  // Sort results
  const sortResults = (results: SearchResult[]): SearchResult[] => {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          break;
        case "priority":
          const priorityOrder = { "low": 1, "medium": 2, "high": 3, "urgent": 4 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "relevance":
        default:
          comparison = a.relevance - b.relevance;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return (
      filters.priority.length > 0 ||
      filters.status.length > 0 ||
      filters.agent.length > 0 ||
      filters.category.length > 0 ||
      filters.tags.length > 0 ||
      filters.customerName.trim() !== "" ||
      filters.ticketId.trim() !== "" ||
      filters.dateRange.start !== "" ||
      filters.dateRange.end !== ""
    );
  };

  // Update filter
  const updateFilter = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Toggle array filter
  const toggleArrayFilter = (filterType: keyof SearchFilters, value: string) => {
    const currentArray = filters[filterType] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    updateFilter(filterType, newArray);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      priority: [],
      status: [],
      agent: [],
      category: [],
      tags: [],
      customerName: "",
      ticketId: ""
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-red-600 bg-red-100";
      case "in-progress": return "text-yellow-600 bg-yellow-100";
      case "resolved": return "text-green-600 bg-green-100";
      case "closed": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
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

  // Auto-search when query or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Advanced Search</h1>
        <p className="text-gray-600">Search and filter through customer support tickets</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tickets by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <FaFilter size={16} />
            Filters
            {hasActiveFilters() && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {Object.values(filters).flat().filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => updateFilter("dateRange", { ...filters.dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => updateFilter("dateRange", { ...filters.dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-2">
                  {filterOptions.priority.map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => toggleArrayFilter("priority", priority)}
                        className="mr-2"
                      />
                      <span className="capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {filterOptions.status.map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => toggleArrayFilter("status", status)}
                        className="mr-2"
                      />
                      <span className="capitalize">{status.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Agent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
                <div className="space-y-2">
                  {filterOptions.agent.map(agent => (
                    <label key={agent} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.agent.includes(agent)}
                        onChange={() => toggleArrayFilter("agent", agent)}
                        className="mr-2"
                      />
                      <span>{agent}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => updateFilter("customerName", e.target.value)}
                  placeholder="Search by customer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ticket ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket ID</label>
                <input
                  type="text"
                  value={filters.ticketId}
                  onChange={(e) => updateFilter("ticketId", e.target.value)}
                  placeholder="e.g., #1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                >
                  <FaTimes size={16} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-2">
                <FaSort size={14} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "relevance" | "date" | "priority")}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="priority">Priority</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-blue-600">{result.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status.replace("-", " ")}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(result.priority)}`}>
                    {result.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaCalendarAlt size={12} />
                  <span>{new Date(result.createdDate).toLocaleDateString()}</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
              <p className="text-gray-600 mb-4">{result.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaUser size={12} />
                    <span>{result.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaTag size={12} />
                    <span>{result.agent}</span>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {result.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-400">
                    Relevance: {result.relevance}%
                  </span>
                </div>
              </div>

              {result.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && searchResults.length === 0 && (searchQuery.trim() || hasActiveFilters()) && (
        <div className="text-center py-12">
          <FaSearch className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
