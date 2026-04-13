"use client";

import Link from "next/link";
import { FileEdit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          No posts found
        </h3>
        <p className="text-sm text-slate-500 mb-4 max-w-sm">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <FileEdit className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        No posts yet
      </h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">
        Create your first post to get started with scheduling and publishing.
      </p>
      <Link href="/posts/new">
        <Button>Create Post</Button>
      </Link>
    </div>
  );
}
