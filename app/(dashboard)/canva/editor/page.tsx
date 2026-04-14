"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, LayoutTemplate, Palette, FileUp, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useCanvaToken,
  useConnectCanva,
  useCanvaCampaigns,
  useCreateCanvaCampaign,
  useCanvaProducts,
  useCreateCanvaProducts,
  useUpdateCanvaProducts,
  useDeleteCanvaProducts,
  useCanvaPages,
  useCreateCanvaPage,
  useUpdateCanvaPage,
  type Campaign,
  type Product,
  type Page,
} from "@/lib/hooks";
import { PageBuilder } from "@/components/canva/page-builder";

export default function CanvaEditorPage() {
  const { data: tokenData, isLoading: isTokenLoading } = useCanvaToken();
  const connected = tokenData?.connected ?? false;
  const configured = tokenData?.configured ?? true;

  const { data: campaignsRes, isLoading: isCampaignsLoading } = useCanvaCampaigns();
  const createCampaign = useCreateCanvaCampaign();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: productsRes, isLoading: isProductsLoading } = useCanvaProducts(selectedCampaignId ?? "");
  const createProducts = useCreateCanvaProducts();
  const updateProducts = useUpdateCanvaProducts();
  const deleteProducts = useDeleteCanvaProducts();

  const { data: pagesRes } = useCanvaPages(selectedCampaignId ?? "");
  const createPage = useCreateCanvaPage();
  const updatePage = useUpdateCanvaPage();

  const [mode, setMode] = useState<"campaigns" | "editor" | "page-builder">("campaigns");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const campaigns = campaignsRes?.data ?? [];
  const products = productsRes?.data ?? [];
  const pages = pagesRes?.data ?? [];

  const selectedCampaign = campaigns.find((c) => c.record_id === selectedCampaignId);

  useEffect(() => {
    if (selectedCampaignId && mode === "campaigns") {
      setMode("editor");
    }
  }, [selectedCampaignId, mode]);

  if (isTokenLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

function NotConfiguredView() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
        <Palette className="h-8 w-8 text-slate-500" />
      </div>
      <h1 className="text-lg font-semibold">Canva integration not configured</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Please ask your administrator to set up the Canva Connect API credentials.
      </p>
    </div>
  );
}

function DisconnectedView() {
  const connect = useConnectCanva();
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
        <Palette className="h-8 w-8 text-slate-500" />
      </div>
      <h1 className="text-lg font-semibold">Connect Canva</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Connect your Canva account to create campaigns, build pages, and autofill designs.
      </p>
      <Button
        className="mt-2 gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900"
        onClick={() => connect.mutate({ redirect_path: "/canva/editor" })}
        disabled={connect.isPending}
      >
        {connect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
        Connect Canva
      </Button>
    </div>
  );
}

  if (!configured) {
    return <NotConfiguredView />;
  }

  if (!connected) {
    return <DisconnectedView />;
  }

  if (mode === "campaigns") {
    return (
      <CampaignListView
        campaigns={campaigns}
        isLoading={isCampaignsLoading}
        onSelect={setSelectedCampaignId}
        onCreate={async (name) => {
          const res = await createCampaign.mutateAsync({ Name: name, Status: "draft" });
          if (res.record_id) setSelectedCampaignId(res.record_id);
        }}
      />
    );
  }

  if (mode === "page-builder" && selectedCampaignId && editingPageId) {
    const page = pages.find((p) => p.record_id === editingPageId);
    if (!page) return null;
    return (
      <PageBuilder
        campaignId={selectedCampaignId}
        page={page}
        products={products}
        onBack={() => setMode("editor")}
        onUpdatePage={updatePage.mutateAsync}
      />
    );
  }

  return (
    <EditorView
      campaign={selectedCampaign!}
      products={products}
      pages={pages}
      isProductsLoading={isProductsLoading}
      onBack={() => {
        setSelectedCampaignId(null);
        setMode("campaigns");
      }}
      onAddProduct={async (p) => {
        await createProducts.mutateAsync({ campaignId: selectedCampaignId!, products: [p] });
      }}
      onUpdateProduct={async (record_id, fields) => {
        await updateProducts.mutateAsync({ campaignId: selectedCampaignId!, updates: [{ record_id, fields }] });
      }}
      onDeleteProducts={async (recordIds) => {
        await deleteProducts.mutateAsync({ campaignId: selectedCampaignId!, recordIds });
      }}
      onCreatePage={async (page) => {
        const res = await createPage.mutateAsync({ campaignId: selectedCampaignId!, page });
        if (res.record_id) {
          setEditingPageId(res.record_id);
          setMode("page-builder");
        }
      }}
      onEditPage={(pageId) => {
        setEditingPageId(pageId);
        setMode("page-builder");
      }}
    />
  );
}

function CampaignListView({
  campaigns,
  isLoading,
  onSelect,
  onCreate,
}: {
  campaigns: Campaign[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [newName, setNewName] = useState("");

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 lg:p-8 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Canva Catalog Campaigns</h1>
            <p className="text-sm text-slate-500">Select a campaign or create a new one</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
            <a href="/canva">
              <LayoutTemplate className="h-4 w-4" />
              View designs
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New campaign name" className="h-9 max-w-xs" />
          <Button
            size="sm"
            className="h-9 gap-1"
            onClick={() => {
              if (newName.trim()) {
                onCreate(newName.trim());
                setNewName("");
              }
            }}
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <LayoutTemplate className="h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">No campaigns yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <button
                key={c.record_id}
                onClick={() => onSelect(c.record_id)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{c.Name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {c.Status || "draft"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c["Date Start"] || "—"} → {c["Date End"] || "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorView({
  campaign,
  products,
  pages,
  isProductsLoading,
  onBack,
  onAddProduct,
  onUpdateProduct,
  onDeleteProducts,
  onCreatePage,
  onEditPage,
}: {
  campaign: Campaign;
  products: Product[];
  pages: Page[];
  isProductsLoading: boolean;
  onBack: () => void;
  onAddProduct: (p: Omit<Product, "record_id">) => Promise<void>;
  onUpdateProduct: (record_id: string, fields: Partial<Product>) => Promise<void>;
  onDeleteProducts: (recordIds: string[]) => Promise<void>;
  onCreatePage: (page: Omit<Page, "record_id">) => Promise<void>;
  onEditPage: (pageId: string) => void;
}) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productPromo, setProductPromo] = useState("");
  const [productImage, setProductImage] = useState("");

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const rows = text.split("\n").map((r) => r.trim()).filter(Boolean);
    if (rows.length < 2) {
      toast.error("CSV must have at least a header and one data row");
      return;
    }
    const headers = rows[0]!.split(",").map((h) => h.trim().toLowerCase());
    const skuIdx = headers.indexOf("sku");
    const nameIdx = headers.indexOf("name");
    const priceIdx = headers.indexOf("price");
    const promoIdx = headers.indexOf("promo");
    const imageIdx = headers.indexOf("image_url");
    const catIdx = headers.indexOf("category");

    const parsed: Omit<Product, "record_id">[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i]!.split(",").map((c) => c.trim());
      parsed.push({
        "Campaign ID": campaign.record_id,
        SKU: skuIdx >= 0 ? (cols[skuIdx] ?? "") : "",
        Name: nameIdx >= 0 ? (cols[nameIdx] ?? "") : "",
        Price: priceIdx >= 0 ? (cols[priceIdx] ?? "") : "",
        Promo: promoIdx >= 0 ? (cols[promoIdx] ?? "") : "",
        "Image URL": imageIdx >= 0 ? (cols[imageIdx] ?? "") : "",
        Category: catIdx >= 0 ? (cols[catIdx] ?? "") : "",
        "Sort Order": i,
      });
    }
    for (const p of parsed) {
      if (p.Name) await onAddProduct(p);
    }
    toast.success(`Imported ${parsed.length} products`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Products</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvImport(file);
                  e.currentTarget.value = "";
                }}
              />
              <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                <span>
                  <FileUp className="h-4 w-4" />
                </span>
              </Button>
            </label>
          </div>

          <div className="mb-4 space-y-2 rounded-xl border border-slate-100 p-3 dark:border-slate-900">
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Name" className="h-8 text-sm" />
            <div className="flex gap-2">
              <Input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="Price" className="h-8 text-sm" />
              <Input value={productPromo} onChange={(e) => setProductPromo(e.target.value)} placeholder="Promo" className="h-8 text-sm" />
            </div>
            <Input value={productImage} onChange={(e) => setProductImage(e.target.value)} placeholder="Image URL" className="h-8 text-sm" />
            <Button
              size="sm"
              className="w-full"
              onClick={async () => {
                if (!productName.trim()) return;
                await onAddProduct({
                  "Campaign ID": campaign.record_id,
                  Name: productName,
                  Price: productPrice,
                  Promo: productPromo,
                  "Image URL": productImage || "https://placehold.co/200x200/3b82f6/ffffff?text=Product",
                  Category: "",
                  SKU: "",
                  "Sort Order": products.length + 1,
                });
                setProductName("");
                setProductPrice("");
                setProductPromo("");
                setProductImage("");
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Product
            </Button>
          </div>

          <div className="space-y-3">
            {isProductsLoading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              products.map((product) => (
                <ProductCard key={product.record_id} product={product} onUpdate={onUpdateProduct} onDelete={() => onDeleteProducts([product.record_id])} />
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Campaigns
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{campaign.Name}</h1>
                <p className="text-sm text-slate-500">Build pages and export for social media</p>
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                <a href="/canva">
                  <LayoutTemplate className="h-4 w-4" />
                  View designs
                </a>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() =>
                  onCreatePage({
                    "Campaign ID": campaign.record_id,
                    "Page Name": `Page ${pages.length + 1}`,
                    "Template ID": "",
                    "Mappings JSON": "{}",
                    "Sort Order": pages.length + 1,
                  })
                }
                className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary/50 hover:text-primary dark:border-slate-800 dark:bg-slate-950"
              >
                <Plus className="h-8 w-8" />
                <span className="mt-2 text-sm font-medium">New Page</span>
              </button>

              {pages.map((page) => (
                <button
                  key={page.record_id}
                  onClick={() => onEditPage(page.record_id)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{page["Page Name"]}</h3>
                    {page["Design ID"] ? (
                      <Badge variant="secondary" className="text-[10px]">Ready</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Draft</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Template: {page["Template ID"] || "Not set"}</p>
                  <p className="text-xs text-slate-500">{page["Design ID"] ? `Design: ${page["Design ID"]}` : "No design generated yet"}</p>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onUpdate,
  onDelete,
}: {
  product: Product;
  onUpdate: (record_id: string, fields: Partial<Product>) => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-xl border border-slate-200 p-3 transition-colors hover:border-primary/50 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <img src={product["Image URL"]} alt={product.Name} className="h-14 w-14 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <Input value={product.Name} onChange={(e) => onUpdate(product.record_id, { Name: e.target.value })} className="h-7 border-0 px-0 text-sm focus-visible:ring-0" />
          <div className="mt-1 flex items-center gap-2">
            <Input value={product.Price} onChange={(e) => onUpdate(product.record_id, { Price: e.target.value })} className="h-6 w-20 border-0 px-0 text-xs focus-visible:ring-0" placeholder="Price" />
            <Input value={product.Promo || ""} onChange={(e) => onUpdate(product.record_id, { Promo: e.target.value })} className="h-6 flex-1 border-0 px-0 text-xs focus-visible:ring-0" placeholder="Promo" />
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
