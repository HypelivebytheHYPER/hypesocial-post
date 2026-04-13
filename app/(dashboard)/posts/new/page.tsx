"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NewPostRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    // Redirect to the unified posts page
    // The compose panel will be opened via URL params or can be opened manually
    const redirectUrl = editId 
      ? `/posts?compose=open&edit=${editId}` 
      : `/posts?compose=open`;
    
    // Small delay for better UX
    const timer = setTimeout(() => {
      router.replace(redirectUrl);
    }, 100);

    return () => clearTimeout(timer);
  }, [router, editId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center h-[60vh]"
    >
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-slate-500">Opening composer...</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/posts")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Posts
        </Button>
      </div>
    </motion.div>
  );
}
