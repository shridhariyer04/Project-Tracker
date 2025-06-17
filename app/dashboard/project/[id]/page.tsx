"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

type Project = {
  id: string;
  name: string;
  description: string | null;
  githublink: string;
  startDate: string | null;
  endDate: string | null;
  leader: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  apiKeys: ApiKey[];
};

type ApiKey = {
  id: string;
  projectId: string;
  name: string;
  key: string;
  createdAt: string;
  updatedAt: string;
};

type Issue = {
  id: number;
  projectId: string;
  title: string;
  description: string | null;
  userId: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function ProjectPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Added loading state
  const [editableProject, setEditableProject] = useState<Project | null>(null);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "low",
    status: "open",
  });
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [newApiKey, setNewApiKey] = useState({ name: "", key: "" });
  const [editingApiKeyId, setEditingApiKeyId] = useState<string | null>(null);
  const [editApiKey, setEditApiKey] = useState<ApiKey | null>(null);
  const [copiedApiKeyId, setCopiedApiKeyId] = useState<string | null>(null);

  useEffect(() => {
  if (!id) {
    setLoading(false);
    return;
  }

  const abortController = new AbortController();

  const fetchProjectAndIssues = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      // Fetch project directly by ID
      const projectRes = await axios.get(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal,
      });
      
      // Check if request was aborted before setting state
      if (!abortController.signal.aborted) {
        setProject(projectRes.data || null);
      }

      const issuesRes = await axios.get(`/api/issues?projectId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal,
      });
      
      // Check if request was aborted before setting state
      if (!abortController.signal.aborted) {
        setIssues(issuesRes.data || []);
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "canceled") {
        // Silently ignore abort errors - don't log or set state
        return;
      }
      console.error("Failed to fetch data:", error.response?.data || error.message);
      if (!abortController.signal.aborted) {
        if (error.response?.status === 404 || error.response?.status === 403) {
          setProject(null);
        }
      }
    } finally {
      // Only set loading to false if request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };
  
  fetchProjectAndIssues();

  return () => {
    abortController.abort(); // Cancel ongoing requests on cleanup
  };
}, [id, getToken]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      const response = await axios.post(
        "/api/apikey",
        {
          projectId: id,
          name: newApiKey.name,
          key: newApiKey.key,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (project) {
        const updatedProject = {
          ...project,
          apiKeys: [...(project.apiKeys || []), response.data],
        };
        setProject(updatedProject);
      }

      setNewApiKey({ name: "", key: "" });
      alert("API key created successfully");
    } catch (error: any) {
      console.error("Failed to create API key:", error.response?.data || error.message);
      alert(`Failed to create API key: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApiKey) return;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      const response = await axios.put(
        `/api/apikeys/${editApiKey.id}`,
        {
          name: editApiKey.name,
          key: editApiKey.key,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const projectRes = await axios.get(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(projectRes.data);

      setEditingApiKeyId(null);
      setEditApiKey(null);
      alert("API key updated successfully");
    } catch (error: any) {
      console.error("Failed to update API key:", error.response?.data || error.message);
      alert(`Failed to update API key: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      await axios.delete(`/api/apikey/${apiKeyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectRes = await axios.get(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(projectRes.data);

      alert("API key deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete API key:", error.response?.data || error.message);
      alert(`Failed to delete API key: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCopyApiKey = (apiKey: string, apiKeyId: string) => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopiedApiKeyId(apiKeyId);
      setTimeout(() => setCopiedApiKeyId(null), 2000);
    });
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      const issueData = { ...newIssue, projectId: id };
      const response = await axios.post("/api/issues", issueData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewIssue({ title: "", description: "", priority: "low", status: "open" });
      const issuesRes = await axios.get(`/api/issues?projectId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(issuesRes.data);
    } catch (error: any) {
      console.error("Failed to create issue:", error.response?.data || error.message);
      alert(`Failed to create issue: ${error.response?.data?.message || error.message}`);
    }
  };
  

  const handleProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token || !editableProject) {
        throw new Error("Missing token or project data");
      }

      const updateData = {
        name: editableProject.name,
        description: editableProject.description,
        githublink: editableProject.githublink,
        startDate: editableProject.startDate,
        endDate: editableProject.endDate,
        leader: editableProject.leader,
      };

      const response = await axios.put(`/api/projects/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProject(response.data);
      setEditableProject(null);
      alert("Project updated successfully");
    } catch (error: any) {
      console.error("Project update failed:", error.response?.data || error.message);
      if (error.response?.status === 404) {
        alert("Project not found or you don't have permission to update it.");
      } else if (error.response?.status === 401) {
        alert("Authorization failed. Please log in again.");
      } else if (error.response?.status === 400) {
        alert("Invalid data. Please check that all required fields are filled.");
      } else {
        alert(`Failed to update project: ${error.response?.data?.message || error.message}`);
      }
    }
  };
  const handleDeleteProject = async () => {
     if (!project) return;
  if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all associated issues and API keys.`)) {
    return;
  }

  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Failed to retrieve session token");
    }

    await axios.delete(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    alert("Project deleted successfully");
    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error: any) {
    console.error("Failed to delete project:", error.response?.data || error.message);
    alert(`Failed to delete project: ${error.response?.data?.message || error.message}`);
  }
};


  const handlePriorityChange = async (issueId: number, priority: string) => {
    try {
      const token = await getToken();
      await axios.put(
        "/api/issues",
        { issueId, priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIssues(
        issues.map((issue) =>
          issue.id === issueId ? { ...issue, priority } : issue
        )
      );
    } catch (error: any) {
      console.error("Failed to update priority:", error.response?.data || error.message);
    }
  };

  const handleIssueUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIssue) return;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to retrieve session token");
      }

      const response = await axios.put(
        "/api/issues",
        { issueId: editIssue.id, ...editIssue },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setIssues(
        issues.map((issue) =>
          issue.id === editIssue.id ? response.data : issue
        )
      );
      setEditingIssueId(null);
      setEditIssue(null);
      alert("Issue updated successfully");
    } catch (error: any) {
      console.error("Failed to update issue:", error.response?.data || error.message);
      alert(`Failed to update issue: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    try {
      const token = await getToken();
      await axios.delete("/api/issues", {
        data: { issueId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(issues.filter((issue) => issue.id !== issueId));
    } catch (error: any) {
      console.error("Failed to delete issue:", error.response?.data || error.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "closed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "********";
    return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
  };
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading project...</p>
      </div>
    </div>
  );
}

if (!loading && !project) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl text-gray-300 mb-4">📁</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-4">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// Add this additional check
if (!project) {
  return null; // or return a loading spinner
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {editableProject ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Edit Project</h2>
            </div>
            <form onSubmit={handleProjectUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={editableProject.name}
                    onChange={(e) =>
                      setEditableProject({ ...editableProject, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Link</label>
                  <input
                    type="url"
                    value={editableProject.githublink}
                    onChange={(e) =>
                      setEditableProject({ ...editableProject, githublink: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={
                      editableProject.startDate
                        ? new Date(editableProject.startDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditableProject({
                        ...editableProject,
                        startDate: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={
                      editableProject.endDate
                        ? new Date(editableProject.endDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditableProject({
                        ...editableProject,
                        endDate: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leader</label>
                  <input
                    type="text"
                    value={editableProject.leader}
                    onChange={(e) =>
                      setEditableProject({ ...editableProject, leader: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editableProject.description || ""}
                  onChange={(e) =>
                    setEditableProject({
                      ...editableProject,
                      description: e.target.value || null,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter project description..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditableProject(null)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 pr-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{project.name}</h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {project.description || "No description available"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setEditableProject(project)}
                    className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Project
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Project
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500">Leader:</span>
                    <span className="text-sm text-gray-900 font-medium">{project.leader}</span>
                  </div>
                  {project.startDate && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-500">Started:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <a
                    href={project.githublink}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    View on GitHub
                  </a>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.243a6 6 0 015.743-7.743L15 7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">API Keys</h3>
                </div>
                {!project.apiKeys || project.apiKeys.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L4.257 9.243a6 6 0 015.743-7.743L15 7z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No API keys available for this project.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.apiKeys.map((apiKey) => (
                      <div
                        key={apiKey.id}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">{apiKey.name}</span>
                            <div className="text-xs font-mono text-gray-500 mt-1">{maskApiKey(apiKey.key)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyApiKey(apiKey.key, apiKey.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {copiedApiKeyId === apiKey.id ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete the API key "${apiKey.name}"? This action cannot be undone.`
                                )
                              ) {
                                handleDeleteApiKey(apiKey.id);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {project.apiKeys?.length || 0} total
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Create New API Key</h3>
            </div>
            <form onSubmit={handleCreateApiKey} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key Name</label>
                  <input
                    type="text"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Production API Key"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key Value</label>
                  <input
                    type="text"
                    value={newApiKey.key}
                    onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter API key value..."
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create API Key
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Issues</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {issues.length} total
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Create New Issue</h3>
            </div>
            <form onSubmit={handleIssueSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
                  <input
                    type="text"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter issue title..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Describe the issue..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create Issue
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl text-gray-300 mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No issues yet</h3>
                <p className="text-gray-500">
                  Create your first issue to get started tracking work on this project.
                </p>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {editingIssueId === issue.id ? (
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Issue</h3>
                      <form onSubmit={handleIssueUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
                          <input
                            type="text"
                            value={editIssue?.title || ""}
                            onChange={(e) => setEditIssue({ ...editIssue!, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={editIssue?.description || ""}
                            onChange={(e) =>
                              setEditIssue({
                                ...editIssue!,
                                description: e.target.value || null,
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select
                              value={editIssue?.priority || "low"}
                              onChange={(e) => setEditIssue({ ...editIssue!, priority: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                              value={editIssue?.status || "open"}
                              onChange={(e) => setEditIssue({ ...editIssue!, status: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In Progress</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIssueId(null);
                              setEditIssue(null);
                            }}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.title}</h3>
                          <p className="text-gray-600 leading-relaxed">
                            {issue.description || "No description provided"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingIssueId(issue.id);
                              setEditIssue(issue);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                              issue.status
                            )}`}
                          >
                            {issue.status.charAt(0).toUpperCase() + issue.status.slice(1).replace("-", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-500">Priority:</label>
                          <select
                            value={issue.priority}
                            onChange={(e) => handlePriorityChange(issue.id, e.target.value)}
                            className={`px-2 py-1 border rounded-md text-xs font-medium ${getPriorityColor(
                              issue.priority
                            )}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}