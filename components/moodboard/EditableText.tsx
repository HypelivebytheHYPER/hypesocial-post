"use client";

import { useState, useEffect, useRef } from "react";

export function EditableText({
  content,
  onSave,
  className = "",
  isNote = false,
  placeholder = "Click to edit...",
}: {
  content: string;
  onSave: (text: string) => void;
  className?: string;
  isNote?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setText(content);
    }
  }, [content, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== content) {
      onSave(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setText(content);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent resize-none outline-none ${className}`}
        rows={isNote ? 4 : 2}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-slate-50/50 rounded transition-colors ${className}`}
    >
      {content || <span className="text-slate-300 italic">{placeholder}</span>}
    </div>
  );
}
