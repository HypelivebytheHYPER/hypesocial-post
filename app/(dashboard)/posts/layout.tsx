"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Context for managing compose panel state
type PostsLayoutContextType = {
  isComposeOpen: boolean;
  openCompose: (postId?: string) => void;
  closeCompose: () => void;
  editingPostId: string | null;
  setEditingPostId: (id: string | null) => void;
};

const PostsLayoutContext = createContext<PostsLayoutContextType | null>(null);

export function usePostsLayout() {
  const context = useContext(PostsLayoutContext);
  if (!context) {
    throw new Error("usePostsLayout must be used within PostsLayout");
  }
  return context;
}

export default function PostsLayout({
  children,
  compose,
}: {
  children: ReactNode;
  compose: ReactNode;
}) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const openCompose = (postId?: string) => {
    setEditingPostId(postId || null);
    setIsComposeOpen(true);
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    setEditingPostId(null);
  };

  return (
    <PostsLayoutContext.Provider
      value={{ isComposeOpen, openCompose, closeCompose, editingPostId, setEditingPostId }}
    >
      <div className="h-[calc(100vh-6rem)] flex gap-2 md:gap-4 w-full">
        {/* Main Content - Post List */}
        <motion.div
          className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            isComposeOpen && "lg:mr-[420px]"
          )}
        >
          <div className="h-full overflow-hidden flex flex-col">
            {children}
          </div>
        </motion.div>

        {/* Compose Panel - Desktop Side Panel */}
        <AnimatePresence>
          {isComposeOpen && (
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden lg:block fixed right-4 top-20 bottom-4 w-[400px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-30"
            >
              {compose}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compose Panel - Mobile Full Screen */}
        <AnimatePresence>
          {isComposeOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 lg:hidden bg-white dark:bg-slate-900"
            >
              {compose}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        {!isComposeOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-6 right-6 z-30"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => openCompose()}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </div>
    </PostsLayoutContext.Provider>
  );
}
