"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  name: string;
  key: string;
}

export default function CreateProject() {
  const router = useRouter();
  const [project, setProject] = useState({
    name: "",
    description: "",
    leader: "",
    githublink: "",
    startDate: "",
    endDate: "",
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Generate unique ID for API keys
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add new API key
  const addApiKey = () => {
    setApiKeys([...apiKeys, { id: generateId(), name: "", key: "" }]);
  };

  // Remove API key
  const removeApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  // Update API key
  const updateApiKey = (id: string, field: 'name' | 'key', value: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, [field]: value } : key
    ));
  };

  // Copy API key to clipboard
  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      // You could add a toast notification here
      alert("API key copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy API key:", err);
      alert("Failed to copy API key");
    }
  };

  // Mask API key for display
  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "*".repeat(key.length);
    return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    // Validate API keys
    const validApiKeys = apiKeys.filter(key => key.name.trim() && key.key.trim());
    
    // Check for duplicate API key names within this project
    const apiKeyNames = validApiKeys.map(key => key.name.trim().toLowerCase());
    const duplicateNames = apiKeyNames.filter((name, index) => apiKeyNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      setError("Duplicate API key names are not allowed within the same project.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await axios.post("/api/projects", {
        ...project,
        startDate: project.startDate || null,
        endDate: project.endDate || null,
        apiKeys: validApiKeys.map(({ id, ...key }) => key), // Remove temporary ID
      });
      console.log("Create Project - Response:", response.data);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to create project:", error);
      
      // Handle specific duplicate API key error from backend
      if (error.response?.data?.message?.includes("API key already exists")) {
        setError("One or more API keys are already in use by another project. Please use unique API keys.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to create project. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">
            Set up a new project to start tracking issues and managing development
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Project Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Project Information
              </h2>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                  placeholder="Enter your project name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={project.description}
                  onChange={(e) =>
                    setProject({ ...project, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 resize-none"
                  placeholder="Describe your project (optional)"
                />
              </div>

              {/* Project Leader */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Project Leader *
                </label>
                <input
                  type="text"
                  value={project.leader}
                  onChange={(e) => setProject({ ...project, leader: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                  placeholder="Enter leader name or email"
                  required
                />
              </div>

              {/* GitHub Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  GitHub Repository *
                </label>
                <input
                  type="url"
                  value={project.githublink}
                  onChange={(e) =>
                    setProject({ ...project, githublink: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                  placeholder="https://github.com/username/repository"
                  required
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={project.startDate}
                    onChange={(e) =>
                      setProject({ ...project, startDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={project.endDate}
                    onChange={(e) =>
                      setProject({ ...project, endDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* API Keys Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  API Keys
                </h2>
                <button
                  type="button"
                  onClick={addApiKey}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add API Key
                </button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-2c0-1.1.9-2 2-2h.5a.5.5 0 00.5-.5V9a2 2 0 012-2h2M7 7V5a2 2 0 012-2m0 0V2a2 2 0 012-2h2a2 2 0 012 2v1m0 0a2 2 0 012 2v1" />
                  </svg>
                  <p>No API keys added yet</p>
                  <p className="text-sm">Click "Add API Key" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Key Name
                          </label>
                          <input
                            type="text"
                            value={apiKey.name}
                            onChange={(e) => updateApiKey(apiKey.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="e.g., OpenAI API Key"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="password"
                                value={apiKey.key}
                                onChange={(e) => updateApiKey(apiKey.id, 'key', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Enter API key"
                              />
                              {apiKey.key && (
                                <button
                                  type="button"
                                  onClick={() => copyApiKey(apiKey.key)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy API key"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeApiKey(apiKey.id)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors duration-200"
                              title="Remove API key"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          {apiKey.key && (
                            <p className="text-xs text-gray-500 mt-1">
                              Preview: {maskApiKey(apiKey.key)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Project
                  </>
                )}
              </button>
              <Link href="/dashboard">
                <button
                  type="button"
                  className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-lg border border-gray-300 shadow-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            * Required fields must be filled out to create your project
          </p>
        </div>
      </div>
    </div>
  );
}