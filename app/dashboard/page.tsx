"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";

type ApiKey = {
  id: string;
  projectId: string;
  name: string;
  key: string;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  githublink: string;
  leader: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  apiKeys: ApiKey[];
};

export default function Dashboard() {
  const { userId, getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (showLoading = true) => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);

      const token = await getToken();
      console.log("Fetch /api/projects - userId:", userId);
      console.log("Fetch /api/projects - Token:", token);

      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      const response = await axios.get("/api/projects", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Dashboard - Fetched projects:", response.data);
      setProjects(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch projects:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Failed to fetch projects");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userId, getToken]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      console.log("Auto-refreshing projects...");
      fetchProjects(false); // Don't show loading spinner for auto-refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId, fetchProjects]);

  // Refetch projects when the component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log("Page became visible, refetching projects...");
        fetchProjects(false);
      }
    };

    const handleFocus = () => {
      if (userId) {
        console.log("Window focused, refetching projects...");
        fetchProjects(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, fetchProjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Loading Projects
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-0">
      <div className="container mx-auto px-4 pt-4 pb-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage and track your development projects
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/create-project">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Project
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first project to track issues and manage development.
                </p>
                <Link href="/dashboard/create-project">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200">
                    Create Your First Project
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            projects.map((project) => (
              <Link href={`/dashboard/project/${project.id}`} key={project.id}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {project.name}
                    </h2>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {project.description || "No description provided"}
                  </p>
                  
                  {/* API Keys Info */}
                  {project.apiKeys && project.apiKeys.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-2c0-1.1.9-2 2-2h.5a.5.5 0 00.5-.5V9a2 2 0 012-2h2M7 7V5a2 2 0 012-2m0 0V2a2 2 0 012-2h2a2 2 0 012 2v1m0 0a2 2 0 012 2v1" />
                        </svg>
                        <span>
                          {project.apiKeys.length} API key{project.apiKeys.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {project.apiKeys.slice(0, 2).map((apiKey) => (
                          <div key={apiKey.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-700">{apiKey.name}</span>
                            <span className="text-gray-500 font-mono">
                              ************
                            </span>
                          </div>
                        ))}
                        {project.apiKeys.length > 2 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{project.apiKeys.length - 2} more API keys
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">{project.leader}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}