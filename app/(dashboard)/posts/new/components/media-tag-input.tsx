"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { MediaTag } from "@/types/post-for-me-types";

export function MediaTagInput({
  tagPlatforms,
  onAdd,
}: {
  tagPlatforms: ("facebook" | "instagram")[];
  onAdd: (tag: MediaTag) => void;
}) {
  const [id, setId] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "instagram">(
    tagPlatforms[0] || "instagram",
  );
  const [type, setType] = useState<"user" | "product">("user");

  const handleAdd = () => {
    const trimmed = id.trim();
    if (!trimmed) return;
    onAdd({ id: trimmed, platform, type });
    setId("");
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={
          platform === "instagram" ? "@username or product ID" : "User ID"
        }
        className="flex-1 px-2.5 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:ring-2 focus:ring-slate-200 min-w-0"
      />
      {tagPlatforms.length > 1 && (
        <select
          value={platform}
          onChange={(e) =>
            setPlatform(e.target.value as "facebook" | "instagram")
          }
          className="px-2 py-1.5 bg-white rounded-lg text-[10px] border border-slate-200"
        >
          {tagPlatforms.map((p) => (
            <option key={p} value={p}>
              {p === "instagram" ? "IG" : "FB"}
            </option>
          ))}
        </select>
      )}
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "user" | "product")}
        className="px-2 py-1.5 bg-white rounded-lg text-[10px] border border-slate-200"
      >
        <option value="user">User</option>
        {platform === "instagram" && <option value="product">Product</option>}
      </select>
      <button
        onClick={handleAdd}
        disabled={!id.trim()}
        className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
