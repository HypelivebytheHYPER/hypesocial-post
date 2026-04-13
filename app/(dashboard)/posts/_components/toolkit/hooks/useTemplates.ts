"use client";

import { useState, useCallback, useMemo } from "react";
import type { PostTemplate, TemplateCategory } from "../types";

export function useTemplates(initialTemplates: PostTemplate[] = []) {
  const [templates, setTemplates] = useState<PostTemplate[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  const templatesByCategory = useMemo(() => {
    const grouped: Record<TemplateCategory, PostTemplate[]> = {
      promotional: [],
      engagement: [],
      educational: [],
      announcement: [],
      custom: [],
    };
    
    filteredTemplates.forEach(template => {
      grouped[template.category].push(template);
    });
    
    return grouped;
  }, [filteredTemplates]);

  const addTemplate = useCallback((template: Omit<PostTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => {
    const newTemplate: PostTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<PostTemplate>) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date().toISOString() }
          : template
      )
    );
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  }, []);

  const incrementUsage = useCallback((id: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id
          ? { ...template, usageCount: template.usageCount + 1 }
          : template
      )
    );
  }, []);

  const duplicateTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const duplicate: PostTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    setTemplates(prev => [duplicate, ...prev]);
    return duplicate;
  }, [templates]);

  return {
    templates: filteredTemplates,
    templatesByCategory,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    duplicateTemplate,
  };
}
