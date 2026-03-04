"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Plus, FolderOpen } from "lucide-react";
import {
  useProjects,
  useCreateProject,
} from "@/lib/hooks/useMoodboard";

export function ProjectSelector() {
  const router = useRouter();
  const params = useParams();
  const currentId = params.projectId as string;

  const { data } = useProjects();
  const createProject = useCreateProject();
  const projects = data?.projects || [];
  const current = projects.find((p) => p.id === currentId);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject.mutateAsync({ name: newName.trim() });
      setNewName("");
      setCreating(false);
      setOpen(false);
      router.push(`/moodboard/${project.id}`);
    } catch (err) {
      console.error("Failed to create:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <FolderOpen className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-700 max-w-[200px] truncate">
          {current?.name || "Select project"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setCreating(false);
            }}
          />
          <div className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  router.push(`/moodboard/${project.id}`);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  project.id === currentId
                    ? "text-slate-900 font-medium bg-slate-50"
                    : "text-slate-600"
                }`}
              >
                {project.name}
              </button>
            ))}

            <div className="border-t border-slate-100 mt-1 pt-1">
              {creating ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name..."
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setCreating(false);
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Project
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
