"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  Download,
  ChevronLeft,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Sticker,
  ZoomIn,
  ZoomOut,
  Maximize,
  Layers,
  LayoutTemplate,
  Sparkles,
  Package,
  Share,
  X,
  CheckCircle2,
  BoxSelect,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useCanvaBrandTemplates,
  useCanvaTemplateDataset,
  useCreateAutofillJob,
  useAutofillJob,
  useCreateResizeJob,
  useCreateExportJob,
  useCreateAssetUploadJob,
  type Product,
  type Page,
} from "@/lib/hooks";
import { apiClient } from "@/lib/api-client";
import { TemplatePicker, type CanvaTemplate } from "./template-picker";
import { ResizeResultRow, ExportResultRow } from "./resize-export-rows";
import { type OverlayLayer, downloadComposedImage, createDefaultLayer } from "@/lib/canva-layer";
import { LayerListPanel, LayerOverlayPreview, type DeviceType, LAYOUT_PRESETS } from "./layer-editor";

const SOCIAL_SIZES = [
  { name: "Instagram Post", width: 1080, height: 1080 },
  { name: "Instagram Story", width: 1080, height: 1920 },
  { name: "Facebook Post", width: 1200, height: 630 },
  { name: "LinkedIn Post", width: 1200, height: 627 },
  { name: "TikTok In-Feed", width: 1080, height: 1920 },
  { name: "TikTok Image Ad", width: 1200, height: 628 },
  { name: "YouTube Thumbnail", width: 1280, height: 720 },
  { name: "YouTube Banner", width: 2560, height: 1440 },
  { name: "Shopee / Lazada 1:1", width: 800, height: 800 },
  { name: "Shopee / Lazada 2:1", width: 1200, height: 600 },
  { name: "Shopee / Lazada 16:9", width: 1200, height: 675 },
  { name: "Shop Banner", width: 1200, height: 300 },
  { name: "Web Hero", width: 1920, height: 600 },
  { name: "LINE Rich Menu", width: 1040, height: 1040 },
  { name: "LINE Flex Hero", width: 1040, height: 520 },
  { name: "LINE Coupon", width: 960, height: 396 },
  { name: "LINE OA Message", width: 1200, height: 630 },
  { name: "Google Medium Rect", width: 300, height: 250 },
  { name: "Google Leaderboard", width: 728, height: 90 },
  { name: "Google Mobile Banner", width: 320, height: 50 },
  { name: "Google Billboard", width: 970, height: 250 },
];

const PREVIEW_ASPECTS = [
  { label: "Original", value: "4 / 3" },
  { label: "Square", value: "1 / 1" },
  { label: "Story", value: "9 / 16" },
  { label: "Social", value: "120 / 63" },
  { label: "TikTok / Reels", value: "9 / 16" },
  { label: "YouTube Thumb", value: "16 / 9" },
  { label: "E-com 1:1", value: "1 / 1" },
  { label: "E-com 2:1", value: "2 / 1" },
  { label: "E-com 16:9", value: "16 / 9" },
  { label: "Shop Banner", value: "4 / 1" },
  { label: "Web Hero", value: "16 / 5" },
  { label: "LINE Rich Menu", value: "1 / 1" },
  { label: "LINE Flex", value: "2 / 1" },
  { label: "LINE Coupon", value: "960 / 396" },
  { label: "LINE OA", value: "120 / 63" },
  { label: "Google 300×250", value: "6 / 5" },
  { label: "Google Leaderboard", value: "728 / 90" },
  { label: "Google Mobile", value: "32 / 5" },
  { label: "Google Billboard", value: "97 / 25" },
];

const DEVICES: { label: string; value: DeviceType }[] = [
  { label: "Freeform", value: "none" },
  { label: "iPhone 16 Pro", value: "iphone-16-pro" },
  { label: "iPhone 16 Pro Max", value: "iphone-16-pro-max" },
  { label: "iPad Pro", value: "ipad-pro" },
  { label: "Desktop", value: "desktop" },
  { label: "YouTube Thumb", value: "youtube" },
];

type Tool = "select" | "text" | "image" | "badge";
type LeftTab = "templates" | "assets";
type RightTab = "design" | "layers";

interface SnapGuide {
  direction: "h" | "v";
  position: number;
}

export function PageBuilder({
  campaignId,
  page,
  products,
  onBack,
  onUpdatePage,
}: {
  campaignId: string;
  page: Page;
  products: Product[];
  onBack: () => void;
  onUpdatePage: (vars: { campaignId: string; pageId: string; fields: Partial<Page> }) => Promise<{ success: boolean }>;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(page["Template ID"] || "");
  const [mappings, setMappings] = useState<Record<string, string>>(page["Mappings JSON"] ? JSON.parse(page["Mappings JSON"]) : {});
  const [layers, setLayers] = useState<OverlayLayer[]>(page["Layers JSON"] ? JSON.parse(page["Layers JSON"]) : []);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [previewAspect, setPreviewAspect] = useState("4 / 3");
  const [device, setDevice] = useState<DeviceType>("none");
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [leftTab, setLeftTab] = useState<LeftTab>("templates");
  const [rightTab, setRightTab] = useState<RightTab>("layers");
  const [showPublishDrawer, setShowPublishDrawer] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(SOCIAL_SIZES.map((s) => s.name));
  const [outlineMode, setOutlineMode] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState<string>("");
  const [bgGeneratePrompt, setBgGeneratePrompt] = useState("");
  const [bgGenerating, setBgGenerating] = useState(false);
  const [autoComposing, setAutoComposing] = useState(false);
  const [composeBgPrompt, setComposeBgPrompt] = useState("");
  const [composePreset, setComposePreset] = useState<string>("Catalog Grid 2×2");
  const canvasRef = useRef<HTMLDivElement>(null);

  // Undo/redo history for layers
  const [layersHistory, setLayersHistory] = useState<{ states: OverlayLayer[][]; index: number }>({
    states: [page["Layers JSON"] ? JSON.parse(page["Layers JSON"]) : []],
    index: 0,
  });

  const { data: templatesData, isLoading: isTemplatesLoading } = useCanvaBrandTemplates({ limit: 20 });
  const { data: datasetData } = useCanvaTemplateDataset(selectedTemplateId || "");

  const [autofillJobId, setAutofillJobId] = useState<string | null>(null);
  const { data: autofillData } = useAutofillJob(autofillJobId ?? "", { refetchInterval: autofillJobId ? 3000 : false });

  const generatedDesignId = useMemo(() => {
    const job = autofillData as { status?: string; design?: { id?: string } } | undefined;
    return job?.status === "success" && job?.design?.id ? job.design.id : null;
  }, [autofillData]);

  const [resizeJobs, setResizeJobs] = useState<{ name: string; jobId: string }[]>(page["Resize Jobs JSON"] ? JSON.parse(page["Resize Jobs JSON"]) : []);
  const [exportJobs, setExportJobs] = useState<{ name: string; exportId: string }[]>(page["Export Jobs JSON"] ? JSON.parse(page["Export Jobs JSON"]) : []);

  const createAutofill = useCreateAutofillJob();
  const createResize = useCreateResizeJob();
  const createExport = useCreateExportJob();
  const createAssetUpload = useCreateAssetUploadJob();
  const [assetIdCache, setAssetIdCache] = useState<Record<string, string>>({});
  const [uploadingAssets, setUploadingAssets] = useState(false);

  useEffect(() => {
    if (generatedDesignId && resizeJobs.length === 0) {
      const toResize = SOCIAL_SIZES.filter((s) => selectedSizes.includes(s.name));
      if (toResize.length === 0) return;
      Promise.all(
        toResize.map(async (size) => {
          try {
            const res = (await createResize.mutateAsync({
              design_id: generatedDesignId,
              design_type: { type: "custom", width: size.width, height: size.height },
            })) as { job?: { id?: string } };
            if (res?.job?.id) return { name: size.name, jobId: res.job.id };
            return null;
          } catch {
            return null;
          }
        }),
      ).then((results) => {
        const valid = results.filter((r): r is { name: string; jobId: string } => !!r);
        setResizeJobs(valid);
        onUpdatePage({
          campaignId,
          pageId: page.record_id,
          fields: { "Design ID": generatedDesignId, "Resize Jobs JSON": JSON.stringify(valid) },
        });
      });
    }
  }, [generatedDesignId, resizeJobs.length, createResize, campaignId, page.record_id, onUpdatePage, selectedSizes]);

  const templates = useMemo<CanvaTemplate[]>(() => {
    const items = (templatesData as { items?: { id: string; name?: string; thumbnail?: { url: string } }[] } | undefined)?.items;
    return items ?? [];
  }, [templatesData]);

  const templateThumb = templates.find((t) => t.id === selectedTemplateId)?.thumbnail?.url;
  const previewImage = exportJobs.find((e) => e.exportId)?.exportId
    ? undefined
    : customBgUrl || templateThumb;

  const datasetFields = useMemo(() => {
    if (!datasetData) return [];
    const ds = datasetData as { fields?: Record<string, { type: string }> } | undefined;
    if (!ds?.fields) return [];
    return Object.entries(ds.fields).map(([name, info]) => ({ name, type: (info as { type: string }).type }));
  }, [datasetData]);

  const handleSave = async () => {
    await onUpdatePage({
      campaignId,
      pageId: page.record_id,
      fields: {
        "Template ID": selectedTemplateId,
        "Mappings JSON": JSON.stringify(mappings),
        "Layers JSON": JSON.stringify(layers),
        "Design ID": customBgUrl || undefined,
      },
    });
    toast.success("Saved");
  };

  const handleGenerateBackground = async () => {
    if (!bgGeneratePrompt.trim()) return;
    setBgGenerating(true);
    try {
      const res = await fetch("/api/media/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: bgGeneratePrompt.trim(), size: "1024x1024" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.url) {
        setCustomBgUrl(data.url);
        setBgGeneratePrompt("");
        toast.success("Background generated");
      }
    } catch {
      toast.error("Failed to generate background");
    } finally {
      setBgGenerating(false);
    }
  };

  const handleAutoCompose = async () => {
    if (!selectedTemplateId) {
      toast.error("Select a template first");
      return;
    }
    setAutoComposing(true);
    try {
      // 1. Generate background if prompt provided
      if (composeBgPrompt.trim()) {
        const res = await fetch("/api/media/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: composeBgPrompt.trim(), size: "1024x1024" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) setCustomBgUrl(data.url);
        }
      }

      // 2. Apply layout preset
      const preset = LAYOUT_PRESETS.find((p) => p.name === composePreset);
      if (preset) {
        const updates = preset.apply(layers);
        const nextLayers = layers.map((l) => {
          const u = updates.find((up) => up.id === l.id);
          return u ? { ...l, ...u } : l;
        });
        commitLayers(nextLayers);
      }

      // 3. Push to Canva autofill
      await handleGenerate();
    } catch {
      toast.error("Auto compose failed");
    } finally {
      setAutoComposing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) return;
    const imageUrlsToUpload = new Set<string>();
    datasetFields.forEach((field) => {
      if (field.type !== "image") return;
      const val = mappings[field.name];
      if (!val) return;
      const prod = products.find((p) => p.record_id === val);
      const url = prod?.["Image URL"] || val;
      if (url && !assetIdCache[url] && url.startsWith("http")) {
        imageUrlsToUpload.add(url);
      }
    });

    let currentCache = { ...assetIdCache };

    if (imageUrlsToUpload.size > 0) {
      setUploadingAssets(true);
      toast.info(`Uploading ${imageUrlsToUpload.size} image(s)...`);
      try {
        const jobs: { url: string; jobId: string }[] = [];
        await Promise.all(
          Array.from(imageUrlsToUpload).map(async (url) => {
            const prod = products.find((p) => p["Image URL"] === url);
            const res = (await createAssetUpload.mutateAsync({
              name: prod?.Name || `${page["Page Name"] || "asset"}`,
              url,
            })) as { job?: { id?: string } };
            if (res?.job?.id) jobs.push({ url, jobId: res.job.id });
          }),
        );

        const pending = new Set(jobs.map((j) => j.jobId));
        const failedUrls: string[] = [];
        let pollCount = 0;
        const MAX_POLLS = 30;

        while (pending.size > 0 && pollCount < MAX_POLLS) {
          await new Promise((r) => setTimeout(r, 2000));
          pollCount++;
          await Promise.all(
            Array.from(pending).map(async (jobId) => {
              const res = (await apiClient(`/api/canva/asset-uploads/${jobId}`)) as {
                job?: { status?: string; asset?: { id?: string } };
              };
              if (res?.job?.status === "success" && res?.job?.asset?.id) {
                const url = jobs.find((j) => j.jobId === jobId)?.url;
                if (url) currentCache[url] = res.job.asset.id;
                pending.delete(jobId);
              } else if (res?.job?.status === "failed") {
                const url = jobs.find((j) => j.jobId === jobId)?.url;
                if (url) failedUrls.push(url);
                pending.delete(jobId);
              }
            }),
          );
        }

        if (pending.size > 0) {
          toast.error("Asset upload timed out.");
          setUploadingAssets(false);
          return;
        }
        if (failedUrls.length > 0) {
          toast.error(`Failed to upload ${failedUrls.length} image(s).`);
          setUploadingAssets(false);
          return;
        }
        setAssetIdCache(currentCache);
      } catch {
        toast.error("Asset upload failed");
        setUploadingAssets(false);
        return;
      }
      setUploadingAssets(false);
    }

    const data: Record<string, unknown> = {};
    datasetFields.forEach((field) => {
      const val = mappings[field.name];
      if (field.type === "image") {
        const prod = products.find((p) => p.record_id === val);
        const url = prod?.["Image URL"] || val || "";
        const assetId = currentCache[url] || url;
        data[field.name] = { type: "image", asset_id: assetId };
      } else if (field.type === "text") {
        const prod = products.find((p) => p.record_id === val);
        data[field.name] = prod ? prod.Name : val || "";
      } else {
        data[field.name] = val || "";
      }
    });

    try {
      const res = (await createAutofill.mutateAsync({
        brand_template_id: selectedTemplateId,
        title: page["Page Name"],
        data,
      })) as { job?: { id?: string } };
      if (res?.job?.id) {
        setAutofillJobId(res.job.id);
        toast.success("Design generation started");
      }
    } catch {
      // handled
    }
  };

  const handleExportSize = async (designId: string, name: string) => {
    try {
      const res = (await createExport.mutateAsync({
        designId,
        format: { type: "png", pages: ["1"] },
      })) as { job?: { id?: string } };
      if (res?.job?.id) {
        const next = [...exportJobs, { name, exportId: res.job.id }];
        setExportJobs(next);
        await onUpdatePage({ campaignId, pageId: page.record_id, fields: { "Export Jobs JSON": JSON.stringify(next) } });
        toast.success(`Export started for ${name}`);
      }
    } catch {
      // handled
    }
  };

  useEffect(() => {
    const state = layersHistory.states[layersHistory.index];
    if (state) setLayers(state);
  }, [layersHistory.index, layersHistory.states]);

  const commitLayers = useCallback((updater: React.SetStateAction<OverlayLayer[]>) => {
    setLayers((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: OverlayLayer[]) => OverlayLayer[])(prev) : updater;
      setLayersHistory((h) => {
        const newStates = h.states.slice(0, h.index + 1);
        if (JSON.stringify(newStates[newStates.length - 1]) !== JSON.stringify(next)) {
          newStates.push(next);
          if (newStates.length > 50) {
            newStates.shift();
            return { states: newStates, index: newStates.length - 1 };
          }
        }
        return { states: newStates, index: newStates.length - 1 };
      });
      return next;
    });
  }, []);

  const addLayer = useCallback((type: OverlayLayer["type"]) => {
    const newLayer = createDefaultLayer(type);
    commitLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTool("select");
  }, [commitLayers]);

  const updateLayer = (id: string, updates: Partial<OverlayLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLayer = (id: string) => {
    commitLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const moveLayer = (id: string, dir: -1 | 1) => {
    commitLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      const [item] = next.splice(idx, 1);
      if (item) next.splice(newIdx, 0, item);
      return next;
    });
  };

  const duplicateLayer = useCallback((id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const copy: OverlayLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} Copy`,
      x: Math.min(layer.x + 2, 100 - layer.width),
      y: Math.min(layer.y + 2, 100 - layer.height),
    };
    commitLayers((prev) => [...prev, copy]);
    setSelectedLayerId(copy.id);
  }, [layers, commitLayers]);

  const undo = useCallback(() => {
    setLayersHistory((h) => {
      if (h.index <= 0) return h;
      return { ...h, index: h.index - 1 };
    });
  }, []);

  const redo = useCallback(() => {
    setLayersHistory((h) => {
      if (h.index >= h.states.length - 1) return h;
      return { ...h, index: h.index + 1 };
    });
  }, []);

  const handleDownloadComposed = async () => {
    const baseUrl = previewImage;
    if (!baseUrl) {
      toast.error("No image available to compose");
      return;
    }
    await downloadComposedImage(baseUrl, layers, `${page["Page Name"] || "export"}.png`);
  };

  useHotkeys(
    [
      { hotkey: "V", callback: () => setActiveTool("select"), options: { enabled: !showPublishDrawer } },
      { hotkey: "T", callback: () => setActiveTool("text"), options: { enabled: !showPublishDrawer } },
      { hotkey: "I", callback: () => setActiveTool("image"), options: { enabled: !showPublishDrawer } },
      { hotkey: "B", callback: () => setActiveTool("badge"), options: { enabled: !showPublishDrawer } },
      {
        hotkey: "Delete",
        callback: () => {
          if (selectedLayerId) deleteLayer(selectedLayerId);
        },
        options: { enabled: !showPublishDrawer },
      },
      {
        hotkey: "Backspace",
        callback: () => {
          if (selectedLayerId) deleteLayer(selectedLayerId);
        },
        options: { enabled: !showPublishDrawer },
      },
      {
        hotkey: "ArrowUp",
        callback: (e) => {
          if (!selectedLayerId) return;
          const delta = e.shiftKey ? 10 : 1;
          commitLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, y: Math.max(0, l.y - delta) } : l))
          );
        },
        options: { enabled: !showPublishDrawer },
      },
      {
        hotkey: "ArrowDown",
        callback: (e) => {
          if (!selectedLayerId) return;
          const delta = e.shiftKey ? 10 : 1;
          commitLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, y: Math.min(100, l.y + delta) } : l))
          );
        },
        options: { enabled: !showPublishDrawer },
      },
      {
        hotkey: "ArrowLeft",
        callback: (e) => {
          if (!selectedLayerId) return;
          const delta = e.shiftKey ? 10 : 1;
          commitLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, x: Math.max(0, l.x - delta) } : l))
          );
        },
        options: { enabled: !showPublishDrawer },
      },
      {
        hotkey: "ArrowRight",
        callback: (e) => {
          if (!selectedLayerId) return;
          const delta = e.shiftKey ? 10 : 1;
          commitLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? { ...l, x: Math.min(100, l.x + delta) } : l))
          );
        },
        options: { enabled: !showPublishDrawer },
      },
      { hotkey: "Mod+=", callback: () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2))), options: { enabled: !showPublishDrawer } },
      { hotkey: "Mod+-", callback: () => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2))), options: { enabled: !showPublishDrawer } },
      { hotkey: "Mod+0", callback: () => setZoom(1), options: { enabled: !showPublishDrawer } },
      {
        hotkey: "Mod+D",
        callback: () => {
          if (selectedLayerId) duplicateLayer(selectedLayerId);
        },
        options: { enabled: !showPublishDrawer },
      },
      { hotkey: "Mod+Z", callback: () => undo(), options: { requireReset: true, enabled: !showPublishDrawer } },
      { hotkey: "Mod+Shift+Z", callback: () => redo(), options: { requireReset: true, enabled: !showPublishDrawer } },
      { hotkey: "Mod+Y", callback: () => redo(), options: { requireReset: true, enabled: !showPublishDrawer } },
      { hotkey: "Escape", callback: () => setShowPublishDrawer(false), options: { enabled: showPublishDrawer } },
    ],
    { ignoreInputs: true }
  );

  useEffect(() => {
    if (activeTool === "text") addLayer("text");
    if (activeTool === "image") addLayer("image");
    if (activeTool === "badge") addLayer("badge");
  }, [activeTool, addLayer]);

  useEffect(() => {
    const onUp = () => setSnapGuides([]);
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.role === "canvas-surface") {
      setSelectedLayerId(null);
    }
  };

  const ToolButton = ({ tool, icon: Icon, label }: { tool: Tool; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all ${
        activeTool === tool
          ? "border-blue-500 bg-blue-500/10 text-blue-500"
          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
      }`}
      title={`${label} (${tool === "select" ? "V" : tool === "text" ? "T" : tool === "image" ? "I" : "B"})`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#09090b]">
      {/* Left Panel */}
      <AnimatePresence initial={false}>
        {showLeftPanel && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2 }}
            className="flex w-72 flex-shrink-0 flex-col border-r border-slate-800 bg-[#0f0f11]"
          >
            {/* Left header */}
            <div className="flex items-center gap-2 border-b border-slate-800 p-3">
              <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-100">{page["Page Name"]}</p>
                <p className="truncate text-[10px] text-slate-500">Canva Smart Catalog</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 px-2 py-2">
              <button
                onClick={() => setLeftTab("templates")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                  leftTab === "templates" ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Templates
              </button>
              <button
                onClick={() => setLeftTab("assets")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                  leftTab === "assets" ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Package className="h-3.5 w-3.5" /> Assets
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {leftTab === "templates" && (
                <div className="space-y-3">
                  {!selectedTemplateId ? (
                    <TemplatePicker
                      templates={templates}
                      isLoading={isTemplatesLoading}
                      selectedTemplateId={selectedTemplateId}
                      onSelect={setSelectedTemplateId}
                      onClear={() => setSelectedTemplateId("")}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="group relative overflow-hidden rounded-lg border border-slate-700">
                        {templateThumb ? (
                          <img src={templateThumb} alt="" className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-800">
                            <LayoutTemplate className="h-6 w-6 text-slate-500" />
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedTemplateId("")}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Template selected</p>

                      {datasetFields.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Mappings</p>
                          {datasetFields.map((field) => (
                            <div key={field.name}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs text-slate-200">{field.name}</span>
                                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{field.type}</span>
                              </div>
                              {field.type === "image" ? (
                                <select
                                  value={mappings[field.name] || ""}
                                  onChange={(e) => setMappings((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                  className="h-7 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none"
                                >
                                  <option value="">Select product</option>
                                  {products.map((p) => (
                                    <option key={p.record_id} value={p.record_id}>
                                      {p.Name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={mappings[field.name] || ""}
                                  onChange={(e) => setMappings((prev) => ({ ...prev, [field.name]: e.target.value }))}
                                  placeholder={`Enter ${field.type}`}
                                  className="h-7 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">AI Background</p>
                    {customBgUrl && (
                      <div className="group relative overflow-hidden rounded-lg border border-slate-700">
                        <img src={customBgUrl} alt="Generated background" className="aspect-[4/3] w-full object-cover" />
                        <button
                          onClick={() => setCustomBgUrl("")}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <input
                        value={bgGeneratePrompt}
                        onChange={(e) => setBgGeneratePrompt(e.target.value)}
                        placeholder="Describe background..."
                        className="h-8 flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                      />
                      <button
                        onClick={handleGenerateBackground}
                        disabled={bgGenerating || !bgGeneratePrompt.trim()}
                        className="flex h-8 items-center justify-center gap-1 rounded-md bg-purple-600 px-2.5 text-xs text-white hover:bg-purple-500 disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {bgGenerating ? "…" : "Gen"}
                      </button>
                    </div>
                    {customBgUrl && (
                      <button
                        onClick={() => setCustomBgUrl("")}
                        className="w-full text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        Clear custom background
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Auto Compose</p>
                    <div className="space-y-1.5">
                      <select
                        value={composePreset}
                        onChange={(e) => setComposePreset(e.target.value)}
                        className="h-8 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none"
                      >
                        {LAYOUT_PRESETS.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        value={composeBgPrompt}
                        onChange={(e) => setComposeBgPrompt(e.target.value)}
                        placeholder="Optional background prompt"
                        className="h-8 w-full rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      onClick={handleAutoCompose}
                      disabled={autoComposing || !selectedTemplateId}
                      className="flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {autoComposing ? "Composing…" : "1-Click Compose → Canva"}
                    </button>
                  </div>
                </div>
              )}

              {leftTab === "assets" && (
                <div className="grid grid-cols-2 gap-2">
                  {products.map((p) => (
                    <div
                      key={p.record_id}
                      className="group relative overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
                    >
                      <img src={p["Image URL"]} alt={p.Name} className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[10px] font-medium text-white">{p.Name}</p>
                        <p className="text-[10px] text-white/80">{p.Promo || p.Price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Center Canvas */}
      <main className="relative flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 p-1.5 shadow-lg backdrop-blur">
              <ToolButton tool="select" icon={MousePointer2} label="Select" />
              <ToolButton tool="text" icon={Type} label="Text" />
              <ToolButton tool="image" icon={ImageIcon} label="Image" />
              <ToolButton tool="badge" icon={Sticker} label="Badge" />
              <div className="mx-1 h-5 w-px bg-slate-600" />
              <select
                value={device}
                onChange={(e) => {
                  const d = e.target.value as DeviceType;
                  setDevice(d);
                  if (d === "iphone-16-pro" || d === "iphone-16-pro-max") setPreviewAspect("9 / 19.53");
                  else if (d === "ipad-pro") setPreviewAspect("3 / 4");
                  else if (d === "desktop" || d === "youtube") setPreviewAspect("16 / 9");
                }}
                className="h-8 rounded-md border-0 bg-slate-700 px-2 text-xs text-slate-200 outline-none ring-0"
              >
                {DEVICES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {device === "none" && (
                <select
                  value={previewAspect}
                  onChange={(e) => setPreviewAspect(e.target.value)}
                  className="h-8 rounded-md border-0 bg-slate-700 px-2 text-xs text-slate-200 outline-none ring-0"
                >
                  {PREVIEW_ASPECTS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-slate-600 bg-slate-800/90 text-slate-200 hover:bg-slate-700"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-blue-600 text-white hover:bg-blue-500"
              onClick={handleGenerate}
              disabled={createAutofill.isPending || uploadingAssets || !selectedTemplateId}
            >
              {uploadingAssets || createAutofill.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-slate-600 bg-slate-800/90 text-slate-200 hover:bg-slate-700"
              onClick={() => setShowPublishDrawer(true)}
            >
              <Share className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Toggle buttons on sides */}
        <button
          onClick={() => setShowLeftPanel((v) => !v)}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700"
          title="Toggle left panel"
        >
          {showLeftPanel ? <ChevronLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
        </button>
        <button
          onClick={() => setShowRightPanel((v) => !v)}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700"
          title="Toggle right panel"
        >
          {showRightPanel ? <ChevronLeft className="h-4 w-4 rotate-180" /> : <ArrowRight className="h-4 w-4" />}
        </button>

        {/* Canvas */}
        <div
          ref={canvasRef}
          data-role="canvas-surface"
          onClick={handleCanvasClick}
          className="relative flex h-full w-full items-center justify-center"
          style={{
            backgroundImage: "radial-gradient(circle, #27272a 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="relative transition-transform duration-150 ease-out" style={{ transform: `scale(${zoom})` }}>
            <LayerOverlayPreview
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={(id, updates) => {
                updateLayer(id, updates);
                if ("x" in updates || "y" in updates) {
                  const l = layers.find((layer) => layer.id === id);
                  if (!l) return;
                  const nx = (updates.x ?? l.x) as number;
                  const ny = (updates.y ?? l.y) as number;
                  const guides: SnapGuide[] = [];
                  const snap = (v: number) => Math.abs(v) < 1.5 || Math.abs(v - 50) < 1.5 || Math.abs(v - 100) < 1.5;
                  if (snap(nx)) guides.push({ direction: "v", position: Math.round(nx / 50) * 50 });
                  if (snap(nx + (updates.width ?? l.width))) guides.push({ direction: "v", position: Math.round((nx + (updates.width ?? l.width)) / 50) * 50 });
                  if (snap(ny)) guides.push({ direction: "h", position: Math.round(ny / 50) * 50 });
                  if (snap(ny + (updates.height ?? l.height))) guides.push({ direction: "h", position: Math.round((ny + (updates.height ?? l.height)) / 50) * 50 });
                  setSnapGuides(guides);
                }
              }}
              previewImage={previewImage}
              aspectRatio={previewAspect}
              device={device}
              outlineMode={outlineMode}
            />
            {snapGuides.map((g, i) => (
              <div
                key={`${g.direction}-${g.position}-${i}`}
                className="pointer-events-none absolute bg-blue-500/60"
                style={
                  g.direction === "h"
                    ? { left: 0, right: 0, top: `${g.position}%`, height: 1 }
                    : { top: 0, bottom: 0, left: `${g.position}%`, width: 1 }
                }
              />
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 p-1.5 shadow-lg backdrop-blur">
          <button
            onClick={() => setOutlineMode((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-700 ${outlineMode ? "bg-blue-600/20 text-blue-400" : ""}`}
            title="Toggle outline mode"
          >
            <BoxSelect className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-slate-600" />
          <button onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-700" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-medium text-slate-200">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-700" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-700" title="Fit 100%">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Right Panel */}
      <AnimatePresence initial={false}>
        {showRightPanel && (
          <motion.aside
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.2 }}
            className="flex w-72 flex-shrink-0 flex-col border-l border-slate-800 bg-[#0f0f11]"
          >
            <div className="flex items-center gap-1 border-b border-slate-800 px-2 py-2">
              <button
                onClick={() => setRightTab("layers")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                  rightTab === "layers" ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Layers
              </button>
              <button
                onClick={() => setRightTab("design")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
                  rightTab === "design" ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Page
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === "layers" ? (
                <LayerListPanel
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  onSelectLayer={setSelectedLayerId}
                  onUpdateLayer={updateLayer}
                  onDeleteLayer={deleteLayer}
                  onMoveLayer={moveLayer}
                  onAddLayer={addLayer}
                  onDuplicateLayer={duplicateLayer}
                  canUndo={layersHistory.index > 0}
                  canRedo={layersHistory.index < layersHistory.states.length - 1}
                  onUndo={undo}
                  onRedo={redo}
                />
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Page Settings</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Device</span>
                        <select
                          value={device}
                          onChange={(e) => {
                            const d = e.target.value as DeviceType;
                            setDevice(d);
                            if (d === "iphone-16-pro" || d === "iphone-16-pro-max") setPreviewAspect("9 / 19.53");
                            else if (d === "ipad-pro") setPreviewAspect("3 / 4");
                            else if (d === "desktop" || d === "youtube") setPreviewAspect("16 / 9");
                          }}
                          className="h-7 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none"
                        >
                          {DEVICES.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {device === "none" && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">Aspect ratio</span>
                          <select
                            value={previewAspect}
                            onChange={(e) => setPreviewAspect(e.target.value)}
                            className="h-7 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-100 outline-none"
                          >
                            {PREVIEW_ASPECTS.map((a) => (
                              <option key={a.value} value={a.value}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Background</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">Dot grid</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Actions</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" onClick={handleDownloadComposed} disabled={!previewImage}>
                        <Download className="mr-1 h-3.5 w-3.5" /> PNG
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" onClick={() => setShowPublishDrawer(true)}>
                        <Share className="mr-1 h-3.5 w-3.5" /> Export
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Publish / Export Drawer */}
      <AnimatePresence>
        {showPublishDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPublishDrawer(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-96 border-l border-slate-800 bg-[#0f0f11] p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">Publish & Export</h3>
                <button onClick={() => setShowPublishDrawer(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Generation Status</p>
                  {autofillJobId && !generatedDesignId && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-xs text-blue-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating design...
                    </div>
                  )}
                  {!autofillJobId && !generatedDesignId && (
                    <div className="mt-2 text-xs text-slate-400">No design generated yet. Click Generate to create.</div>
                  )}
                  {generatedDesignId && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-2 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Design ready
                    </div>
                  )}
                </div>

                {generatedDesignId && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Auto Resizes</p>
                    <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900/40 p-2">
                      {SOCIAL_SIZES.map((size) => {
                        const checked = selectedSizes.includes(size.name);
                        return (
                          <label key={size.name} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setSelectedSizes((prev) => (e.target.checked ? [...prev, size.name] : prev.filter((n) => n !== size.name)));
                              }}
                              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-blue-500"
                            />
                            <span className="text-xs text-slate-200">{size.name}</span>
                            <span className="ml-auto text-[10px] text-slate-500">{size.width}×{size.height}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      {SOCIAL_SIZES.map((size) => {
                        const job = resizeJobs.find((j) => j.name === size.name);
                        if (!job) return null;
                        return <ResizeResultRow key={size.name} name={size.name} jobId={job.jobId} onExport={(designId) => handleExportSize(designId, size.name)} />;
                      })}
                    </div>
                  </div>
                )}

                {exportJobs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Exports</p>
                    <div className="space-y-2">
                      {exportJobs.map((ej, idx) => (
                        <ExportResultRow key={`${ej.exportId}-${idx}`} name={ej.name} exportId={ej.exportId} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
