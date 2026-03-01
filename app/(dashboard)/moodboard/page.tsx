"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  type MoodboardProject,
} from "@/lib/hooks/useMoodboard";

export default function MoodboardPage() {
  const router = useRouter();
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const projects = data?.projects || [];

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      const project = await createProject.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim(),
      });
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      router.push(`/moodboard/${project.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Moodboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Plan your weekly social content
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card-premium p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Moodboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Plan your weekly social content
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Create project dialog */}
      {showCreate && (
        <div className="card-premium p-6 border-2 border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Create New Project
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Brand Campaign Q1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowCreate(false);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || createProject.isPending}
              >
                {createProject.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setNewDescription("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 && !showCreate ? (
        <div className="card-premium p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            No projects yet
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Create your first project to start planning content
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/moodboard/${project.id}`)}
              className="card-premium p-6 text-left hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900">
                  {project.name}
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
              </div>
              {project.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>
                  {project.created_at
                    ? format(new Date(project.created_at), "MMM d, yyyy")
                    : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
