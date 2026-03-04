"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Calendar, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  type MoodboardProject,
} from "@/lib/hooks/useMoodboard";

export default function MoodboardPage() {
  const router = useRouter();
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleRename = async (projectId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    try {
      await updateProject.mutateAsync({ projectId, data: { name: trimmed } });
      toast.success("เปลี่ยนชื่อแล้ว");
    } catch {
      toast.error("เปลี่ยนชื่อไม่สำเร็จ");
    }
    setRenamingId(null);
  };

  const handleDelete = async (project: MoodboardProject) => {
    if (!confirm(`ลบโปรเจกต์ "${project.name}"?`)) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("ลบโปรเจกต์แล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

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
            <div
              key={project.id}
              className="card-premium p-6 text-left hover:shadow-md transition-shadow group relative"
            >
              <div className="flex items-start justify-between mb-3">
                {renamingId === project.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(project.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="text-lg font-semibold text-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-0.5 outline-none ring-2 ring-blue-400 w-full"
                  />
                ) : (
                  <button
                    onClick={() => router.push(`/moodboard/${project.id}`)}
                    className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white text-left flex-1 min-w-0 truncate"
                  >
                    {project.name}
                  </button>
                )}
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(project.id);
                      setRenameValue(project.name);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title="เปลี่ยนชื่อ"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => router.push(`/moodboard/${project.id}`)}
                className="block w-full text-left"
              >
                {project.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {project.created_at
                        ? format(new Date(project.created_at), "MMM d, yyyy")
                        : ""}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
