"use client";

import { useState, useEffect } from "react";
import axios from "axios";

type Issue = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
};

export default function IssuesForm({ projectId }: { projectId: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "low",
    status: "open",
  });

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const issuesRes = await axios.get(`/api/issues?projectId=${projectId}`);
        setIssues(issuesRes.data || []);
      } catch (error) {
        console.error("Failed to fetch issues:", error);
      }
    };
    fetchIssues();
  }, [projectId]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/issues", { ...newIssue, projectId });
      setNewIssue({ title: "", description: "", priority: "low", status: "open" });
      const issuesRes = await axios.get(`/api/issues?projectId=${projectId}`);
      setIssues(issuesRes.data);
    } catch (error) {
      console.error("Failed to create issue:", error);
      alert("Failed to create issue.");
    }
  };

  const handlePriorityChange = async (issueId: number, priority: string) => {
    try {
      await axios.put("/api/issues", { issueId, priority });
      setIssues(
        issues.map((issue) =>
          issue.id === issueId ? { ...issue, priority } : issue
        )
      );
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    try {
      await axios.delete("/api/issues", { data: { issueId } });
      setIssues(issues.filter((issue) => issue.id !== issueId));
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  return (
    <>
      <form onSubmit={handleIssueSubmit} className="bg-white p-4 rounded shadow mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium">Issue Title</label>
          <input
            type="text"
            value={newIssue.title}
            onChange={(e) =>
              setNewIssue({ ...newIssue, title: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={newIssue.description}
            onChange={(e) =>
              setNewIssue({ ...newIssue, description: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Priority</label>
          <select
            value={newIssue.priority}
            onChange={(e) =>
              setNewIssue({ ...newIssue, priority: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          + Add Issue
        </button>
      </form>

      <div className="grid gap-4">
        {issues.length === 0 ? (
          <p>No issues found.</p>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{issue.title}</h3>
              <p className="text-gray-600">
                {issue.description || "No description"}
              </p>
              <p className="text-sm">Status: {issue.status}</p>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm">Priority:</label>
                <select
                  value={issue.priority}
                  onChange={(e) =>
                    handlePriorityChange(issue.id, e.target.value)
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={() => handleDeleteIssue(issue.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}