/**
 * HypeSocial MCP Tool Definitions
 *
 * Exposes existing app APIs (Canva, Lark Catalog, Figma, Media) as MCP tools.
 */

import { ToolBuilder, SchemaHelpers, type MCPTool, type MCPToolResult } from "./mcp-tools";
import {
  listCanvaDesigns,
  getCanvaDesign,
  listCanvaBrandTemplates,
  getBrandTemplateDataset,
  createAutofillJob,
  getAutofillJob,
  createExportJob,
  getExportJob,
  createResizeJob,
  getResizeJob,
  createUrlAssetUploadJob,
  getUrlAssetUploadJob,
  searchCanvaFolders,
  createCanvaFolder,
  listCanvaFolderItems,
  moveCanvaItemToFolder,
} from "./canva-client";
import {
  listCampaigns,
  listProducts,
  listPages,
  createCampaign,
  createPage,
  updatePage,
  deletePage,
  type Campaign,
  type Product,
  type Page,
} from "./canva-catalog-lark";
import { callChatAgentJSON } from "@/lib/ai";

// ============================================================================
// Canva Tools
// ============================================================================

const CanvaTools = {
  list_designs(): MCPTool {
    return ToolBuilder.create("canva_list_designs")
      .withTitle("List Canva Designs")
      .withDescription("List Canva designs with optional pagination")
      .withInputSchema({
        type: "object",
        properties: {
          limit: SchemaHelpers.number("Maximum designs to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          continuation: SchemaHelpers.string("Continuation token for pagination"),
          sort_by: SchemaHelpers.enum("Sort order", ["relevance", "modified_descending"], "modified_descending"),
        },
      })
      .asReadOnly()
      .build();
  },

  get_design(): MCPTool {
    return ToolBuilder.create("canva_get_design")
      .withTitle("Get Canva Design")
      .withDescription("Get details of a specific Canva design")
      .withInputSchema({
        type: "object",
        properties: {
          design_id: SchemaHelpers.string("Canva design ID"),
        },
        required: ["design_id"],
      })
      .asReadOnly()
      .build();
  },

  list_brand_templates(): MCPTool {
    return ToolBuilder.create("canva_list_brand_templates")
      .withTitle("List Canva Brand Templates")
      .withDescription("List available Canva brand templates")
      .withInputSchema({
        type: "object",
        properties: {
          limit: SchemaHelpers.number("Maximum templates to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          continuation: SchemaHelpers.string("Continuation token"),
          query: SchemaHelpers.string("Search query"),
        },
      })
      .asReadOnly()
      .build();
  },

  create_autofill_job(): MCPTool {
    return ToolBuilder.create("canva_create_autofill_job")
      .withTitle("Create Canva Autofill Job")
      .withDescription("Create an autofill job to generate a design from a brand template and dataset")
      .withInputSchema({
        type: "object",
        properties: {
          brand_template_id: SchemaHelpers.string("Brand template ID"),
          title: SchemaHelpers.string("Design title"),
          data: SchemaHelpers.object("Dataset key-value mappings", {}, ["data"]),
        },
        required: ["brand_template_id", "title", "data"],
      })
      .asCreate()
      .build();
  },

  get_autofill_job(): MCPTool {
    return ToolBuilder.create("canva_get_autofill_job")
      .withTitle("Get Canva Autofill Job")
      .withDescription("Check the status of a Canva autofill job")
      .withInputSchema({
        type: "object",
        properties: {
          job_id: SchemaHelpers.string("Autofill job ID"),
        },
        required: ["job_id"],
      })
      .asReadOnly()
      .build();
  },

  create_export_job(): MCPTool {
    return ToolBuilder.create("canva_create_export_job")
      .withTitle("Create Canva Export Job")
      .withDescription("Export a Canva design to PNG, JPG, PDF, etc.")
      .withInputSchema({
        type: "object",
        properties: {
          design_id: SchemaHelpers.string("Canva design ID"),
          format: SchemaHelpers.enum("Export format", ["png", "jpg", "pdf", "pptx"], "png"),
          pages: SchemaHelpers.array("Page indices to export", SchemaHelpers.number("Page index", { integer: true })),
        },
        required: ["design_id"],
      })
      .asCreate()
      .build();
  },

  get_export_job(): MCPTool {
    return ToolBuilder.create("canva_get_export_job")
      .withTitle("Get Canva Export Job")
      .withDescription("Check the status of a Canva export job")
      .withInputSchema({
        type: "object",
        properties: {
          export_id: SchemaHelpers.string("Export job ID"),
        },
        required: ["export_id"],
      })
      .asReadOnly()
      .build();
  },

  create_resize_job(): MCPTool {
    return ToolBuilder.create("canva_create_resize_job")
      .withTitle("Create Canva Resize Job")
      .withDescription("Resize a Canva design to new dimensions")
      .withInputSchema({
        type: "object",
        properties: {
          design_id: SchemaHelpers.string("Canva design ID"),
          width: SchemaHelpers.number("Target width in pixels", { integer: true }),
          height: SchemaHelpers.number("Target height in pixels", { integer: true }),
        },
        required: ["design_id", "width", "height"],
      })
      .asCreate()
      .build();
  },

  get_resize_job(): MCPTool {
    return ToolBuilder.create("canva_get_resize_job")
      .withTitle("Get Canva Resize Job")
      .withDescription("Check the status of a Canva resize job")
      .withInputSchema({
        type: "object",
        properties: {
          job_id: SchemaHelpers.string("Resize job ID"),
        },
        required: ["job_id"],
      })
      .asReadOnly()
      .build();
  },

  create_asset_upload(): MCPTool {
    return ToolBuilder.create("canva_create_asset_upload")
      .withTitle("Upload Canva Asset from URL")
      .withDescription("Upload an image asset to Canva from a public URL")
      .withInputSchema({
        type: "object",
        properties: {
          url: SchemaHelpers.string("Public image URL", { format: "uri" }),
          name: SchemaHelpers.string("Asset name"),
        },
        required: ["url", "name"],
      })
      .asCreate()
      .build();
  },

  get_asset_upload(): MCPTool {
    return ToolBuilder.create("canva_get_asset_upload")
      .withTitle("Get Canva Asset Upload Job")
      .withDescription("Check the status of a Canva asset upload job")
      .withInputSchema({
        type: "object",
        properties: {
          job_id: SchemaHelpers.string("Asset upload job ID"),
        },
        required: ["job_id"],
      })
      .asReadOnly()
      .build();
  },

  get_brand_template_dataset(): MCPTool {
    return ToolBuilder.create("canva_get_brand_template_dataset")
      .withTitle("Get Brand Template Dataset")
      .withDescription("Retrieve the dataset fields for a Canva brand template")
      .withInputSchema({
        type: "object",
        properties: {
          brand_template_id: SchemaHelpers.string("Brand template ID"),
        },
        required: ["brand_template_id"],
      })
      .asReadOnly()
      .build();
  },

  search_folders(): MCPTool {
    return ToolBuilder.create("canva_search_folders")
      .withTitle("Search Canva Folders")
      .withDescription("Search Canva folders by query or list root folders")
      .withInputSchema({
        type: "object",
        properties: {
          query: SchemaHelpers.string("Search query"),
          parent_folder_id: SchemaHelpers.string("Parent folder ID"),
          limit: SchemaHelpers.number("Maximum folders to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          continuation: SchemaHelpers.string("Continuation token"),
        },
      })
      .asReadOnly()
      .build();
  },

  create_folder(): MCPTool {
    return ToolBuilder.create("canva_create_folder")
      .withTitle("Create Canva Folder")
      .withDescription("Create a new folder in Canva")
      .withInputSchema({
        type: "object",
        properties: {
          name: SchemaHelpers.string("Folder name"),
          parent_folder_id: SchemaHelpers.string("Parent folder ID"),
        },
        required: ["name"],
      })
      .asCreate()
      .build();
  },

  list_folder_items(): MCPTool {
    return ToolBuilder.create("canva_list_folder_items")
      .withTitle("List Folder Items")
      .withDescription("List designs and subfolders inside a Canva folder")
      .withInputSchema({
        type: "object",
        properties: {
          folder_id: SchemaHelpers.string("Folder ID"),
          limit: SchemaHelpers.number("Maximum items to return", { minimum: 1, maximum: 100, default: 20, integer: true }),
          continuation: SchemaHelpers.string("Continuation token"),
        },
        required: ["folder_id"],
      })
      .asReadOnly()
      .build();
  },

  move_item_to_folder(): MCPTool {
    return ToolBuilder.create("canva_move_item_to_folder")
      .withTitle("Move Item to Folder")
      .withDescription("Move a design or folder into another Canva folder")
      .withInputSchema({
        type: "object",
        properties: {
          folder_id: SchemaHelpers.string("Destination folder ID"),
          item_type: SchemaHelpers.enum("Item type", ["design", "folder"]),
          item_id: SchemaHelpers.string("Item ID to move"),
        },
        required: ["folder_id", "item_type", "item_id"],
      })
      .asUpdate()
      .build();
  },
};

// ============================================================================
// Lark Catalog Tools
// ============================================================================

const LarkCatalogTools = {
  list_campaigns(): MCPTool {
    return ToolBuilder.create("lark_list_campaigns")
      .withTitle("List Campaigns")
      .withDescription("List all Canva catalog campaigns from Lark Base")
      .withInputSchema({ type: "object", properties: {} })
      .asReadOnly()
      .build();
  },

  list_products(): MCPTool {
    return ToolBuilder.create("lark_list_products")
      .withTitle("List Products")
      .withDescription("List products for a specific campaign")
      .withInputSchema({
        type: "object",
        properties: {
          campaign_id: SchemaHelpers.string("Campaign record ID"),
        },
        required: ["campaign_id"],
      })
      .asReadOnly()
      .build();
  },

  list_pages(): MCPTool {
    return ToolBuilder.create("lark_list_pages")
      .withTitle("List Pages")
      .withDescription("List Canva pages for a specific campaign")
      .withInputSchema({
        type: "object",
        properties: {
          campaign_id: SchemaHelpers.string("Campaign record ID"),
        },
        required: ["campaign_id"],
      })
      .asReadOnly()
      .build();
  },

  create_campaign(): MCPTool {
    return ToolBuilder.create("lark_create_campaign")
      .withTitle("Create Campaign")
      .withDescription("Create a new campaign in Lark Base")
      .withInputSchema({
        type: "object",
        properties: {
          name: SchemaHelpers.string("Campaign name"),
          date_start: SchemaHelpers.string("Start date (ISO 8601)"),
          date_end: SchemaHelpers.string("End date (ISO 8601)"),
          status: SchemaHelpers.enum("Status", ["draft", "active", "completed"], "draft"),
        },
        required: ["name"],
      })
      .asCreate()
      .build();
  },

  update_page(): MCPTool {
    return ToolBuilder.create("lark_update_page")
      .withTitle("Update Page")
      .withDescription("Update a Canva page in Lark Base (e.g., layers, design ID)")
      .withInputSchema({
        type: "object",
        properties: {
          page_id: SchemaHelpers.string("Page record ID"),
          page_name: SchemaHelpers.string("Page name"),
          template_id: SchemaHelpers.string("Canva template ID"),
          design_id: SchemaHelpers.string("Canva design ID"),
          layers_json: SchemaHelpers.string("Layers JSON string"),
          mappings_json: SchemaHelpers.string("Mappings JSON string"),
          resize_jobs_json: SchemaHelpers.string("Resize jobs JSON string"),
          export_jobs_json: SchemaHelpers.string("Export jobs JSON string"),
          sort_order: SchemaHelpers.number("Sort order", { integer: true }),
        },
        required: ["page_id"],
      })
      .asUpdate()
      .build();
  },

  delete_page(): MCPTool {
    return ToolBuilder.create("lark_delete_page")
      .withTitle("Delete Page")
      .withDescription("Delete a Canva page from Lark Base")
      .withInputSchema({
        type: "object",
        properties: {
          page_id: SchemaHelpers.string("Page record ID"),
        },
        required: ["page_id"],
      })
      .asDestructive()
      .build();
  },
};

// ============================================================================
// Figma Tools
// ============================================================================

const FigmaTools = {
  get_file(): MCPTool {
    return ToolBuilder.create("figma_get_file")
      .withTitle("Get Figma File")
      .withDescription("Retrieve a Figma file's document, components, and styles")
      .withInputSchema({
        type: "object",
        properties: {
          file_key: SchemaHelpers.string("Figma file key from URL"),
        },
        required: ["file_key"],
      })
      .asReadOnly()
      .build();
  },

  get_file_nodes(): MCPTool {
    return ToolBuilder.create("figma_get_file_nodes")
      .withTitle("Get Figma File Nodes")
      .withDescription("Retrieve specific nodes from a Figma file")
      .withInputSchema({
        type: "object",
        properties: {
          file_key: SchemaHelpers.string("Figma file key"),
          node_ids: SchemaHelpers.array("Node IDs to retrieve", SchemaHelpers.string("Node ID")),
        },
        required: ["file_key", "node_ids"],
      })
      .asReadOnly()
      .build();
  },

  get_comments(): MCPTool {
    return ToolBuilder.create("figma_get_comments")
      .withTitle("Get Figma Comments")
      .withDescription("List all comments on a Figma file")
      .withInputSchema({
        type: "object",
        properties: {
          file_key: SchemaHelpers.string("Figma file key"),
        },
        required: ["file_key"],
      })
      .asReadOnly()
      .build();
  },

  post_comment(): MCPTool {
    return ToolBuilder.create("figma_post_comment")
      .withTitle("Post Figma Comment")
      .withDescription("Post a new comment on a Figma file or reply to an existing comment")
      .withInputSchema({
        type: "object",
        properties: {
          file_key: SchemaHelpers.string("Figma file key"),
          message: SchemaHelpers.string("Comment message"),
          comment_id: SchemaHelpers.string("Comment ID to reply to (optional)"),
          node_id: SchemaHelpers.string("Node ID to attach the comment to (optional)"),
        },
        required: ["file_key", "message"],
      })
      .asCreate()
      .build();
  },

  design_to_code(): MCPTool {
    return ToolBuilder.create("figma_design_to_code")
      .withTitle("Figma Design to Code")
      .withDescription("Convert a Figma frame or design into React + Tailwind CSS component code")
      .withInputSchema({
        type: "object",
        properties: {
          file_key: SchemaHelpers.string("Figma file key"),
          node_id: SchemaHelpers.string("Specific frame/node ID to convert (optional)"),
        },
        required: ["file_key"],
      })
      .asReadOnly()
      .build();
  },
};

// ============================================================================
// Media Tools
// ============================================================================

const MediaTools = {
  remove_background(): MCPTool {
    return ToolBuilder.create("media_remove_background")
      .withTitle("Remove Image Background")
      .withDescription("Remove the background from an image URL using remove.bg")
      .withInputSchema({
        type: "object",
        properties: {
          url: SchemaHelpers.string("Public image URL", { format: "uri" }),
        },
        required: ["url"],
      })
      .asCreate()
      .build();
  },

  transform_image(): MCPTool {
    return ToolBuilder.create("media_transform_image")
      .withTitle("Transform Image")
      .withDescription("Smart crop/resize an image via Cloudinary transform proxy")
      .withInputSchema({
        type: "object",
        properties: {
          url: SchemaHelpers.string("Source image URL", { format: "uri" }),
          width: SchemaHelpers.number("Target width", { integer: true }),
          height: SchemaHelpers.number("Target height", { integer: true }),
          crop: SchemaHelpers.enum("Crop mode", ["fill", "fit", "limit", "pad", "scale"], "fill"),
          gravity: SchemaHelpers.enum("Gravity", ["auto", "center", "face"], "auto"),
          format: SchemaHelpers.enum("Output format", ["auto", "webp", "jpg", "png"], "auto"),
        },
        required: ["url"],
      })
      .asReadOnly()
      .build();
  },

  generate_image(): MCPTool {
    return ToolBuilder.create("media_generate_image")
      .withTitle("Generate Image with AI")
      .withDescription("Generate an image from a text prompt using OpenAI DALL-E 3 or a generic OpenAI-compatible provider")
      .withInputSchema({
        type: "object",
        properties: {
          prompt: SchemaHelpers.string("Image description / prompt"),
          size: SchemaHelpers.enum("Image size", ["1024x1024", "1792x1024", "1024x1792"], "1024x1024"),
        },
        required: ["prompt"],
      })
      .asCreate()
      .build();
  },
};

// ============================================================================
// All Tools Registry
// ============================================================================

export function getAllHypeSocialTools(): MCPTool[] {
  return [
    CanvaTools.list_designs(),
    CanvaTools.get_design(),
    CanvaTools.list_brand_templates(),
    CanvaTools.create_autofill_job(),
    CanvaTools.get_autofill_job(),
    CanvaTools.create_export_job(),
    CanvaTools.get_export_job(),
    CanvaTools.create_resize_job(),
    CanvaTools.get_resize_job(),
    CanvaTools.create_asset_upload(),
    CanvaTools.get_asset_upload(),
    CanvaTools.get_brand_template_dataset(),
    CanvaTools.search_folders(),
    CanvaTools.create_folder(),
    CanvaTools.list_folder_items(),
    CanvaTools.move_item_to_folder(),
    LarkCatalogTools.list_campaigns(),
    LarkCatalogTools.list_products(),
    LarkCatalogTools.list_pages(),
    LarkCatalogTools.create_campaign(),
    LarkCatalogTools.update_page(),
    LarkCatalogTools.delete_page(),
    FigmaTools.get_file(),
    FigmaTools.get_file_nodes(),
    FigmaTools.get_comments(),
    FigmaTools.post_comment(),
    FigmaTools.design_to_code(),
    MediaTools.remove_background(),
    MediaTools.transform_image(),
    MediaTools.generate_image(),
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

function textResult(data: unknown): MCPToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string): MCPToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export async function handleHypeSocialTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
  try {
    switch (name) {
      // Canva
      case "canva_list_designs":
        return textResult(await listCanvaDesigns({ limit: Number(args.limit || 20), continuation: args.continuation as string | undefined, sort_by: args.sort_by as string | undefined }));
      case "canva_get_design":
        return textResult(await getCanvaDesign(String(args.design_id)));
      case "canva_list_brand_templates":
        return textResult(await listCanvaBrandTemplates({ limit: Number(args.limit || 20), continuation: args.continuation as string | undefined, query: args.query as string | undefined }));
      case "canva_create_autofill_job":
        return textResult(await createAutofillJob({
          brand_template_id: String(args.brand_template_id),
          title: String(args.title),
          data: args.data as Record<string, unknown>,
        }));
      case "canva_get_autofill_job":
        return textResult(await getAutofillJob(String(args.job_id)));
      case "canva_create_export_job":
        return textResult(await createExportJob(String(args.design_id), {
          type: args.type || String(args.format || "png"),
          pages: args.pages as number[] | undefined,
        }));
      case "canva_get_export_job":
        return textResult(await getExportJob(String(args.export_id)));
      case "canva_create_resize_job":
        return textResult(await createResizeJob({
          design_id: String(args.design_id),
          design_type: { type: "custom", width: Number(args.width), height: Number(args.height) },
        }));
      case "canva_get_resize_job":
        return textResult(await getResizeJob(String(args.job_id)));
      case "canva_create_asset_upload":
        return textResult(await createUrlAssetUploadJob({
          url: String(args.url),
          name: String(args.name),
        }));
      case "canva_get_asset_upload":
        return textResult(await getUrlAssetUploadJob(String(args.job_id)));
      case "canva_get_brand_template_dataset":
        return textResult(await getBrandTemplateDataset(String(args.brand_template_id)));
      case "canva_search_folders":
        return textResult(await searchCanvaFolders({
          query: args.query as string | undefined,
          parent_folder_id: args.parent_folder_id as string | undefined,
          limit: Number(args.limit || 20),
          continuation: args.continuation as string | undefined,
        }));
      case "canva_create_folder":
        return textResult(await createCanvaFolder({
          name: String(args.name),
          parent_folder_id: args.parent_folder_id as string | undefined,
        }));
      case "canva_list_folder_items":
        return textResult(await listCanvaFolderItems(String(args.folder_id), {
          limit: Number(args.limit || 20),
          continuation: args.continuation as string | undefined,
        }));
      case "canva_move_item_to_folder":
        return textResult(await moveCanvaItemToFolder(String(args.folder_id), {
          item_type: String(args.item_type) as "design" | "folder",
          item_id: String(args.item_id),
        }));

      // Lark
      case "lark_list_campaigns":
        return textResult(await listCampaigns());
      case "lark_list_products":
        return textResult(await listProducts(String(args.campaign_id)));
      case "lark_list_pages":
        return textResult(await listPages(String(args.campaign_id)));
      case "lark_create_campaign": {
        const recordId = await createCampaign({
          Name: String(args.name),
          ...(args.date_start ? { "Date Start": String(args.date_start) } : {}),
          ...(args.date_end ? { "Date End": String(args.date_end) } : {}),
          ...(args.status ? { Status: String(args.status) } : {}),
        } as Campaign);
        return textResult({ success: true, record_id: recordId });
      }
      case "lark_update_page": {
        const fields: Partial<Page> = {};
        if (args.page_name) fields["Page Name"] = String(args.page_name);
        if (args.template_id) fields["Template ID"] = String(args.template_id);
        if (args.design_id) fields["Design ID"] = String(args.design_id);
        if (args.layers_json) fields["Layers JSON"] = String(args.layers_json);
        if (args.mappings_json) fields["Mappings JSON"] = String(args.mappings_json);
        if (args.resize_jobs_json) fields["Resize Jobs JSON"] = String(args.resize_jobs_json);
        if (args.export_jobs_json) fields["Export Jobs JSON"] = String(args.export_jobs_json);
        if (args.sort_order !== undefined) fields["Sort Order"] = Number(args.sort_order);
        await updatePage(String(args.page_id), fields);
        return textResult({ success: true });
      }
      case "lark_delete_page":
        await deletePage(String(args.page_id));
        return textResult({ success: true });

      // Figma
      case "figma_get_file": {
        const token = process.env.FIGMA_ACCESS_TOKEN;
        if (!token) return errorResult("FIGMA_ACCESS_TOKEN not configured");
        const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}`, { headers: { "X-Figma-Token": token } });
        if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
        return textResult(await res.json());
      }
      case "figma_get_file_nodes": {
        const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
        if (!figmaToken) return errorResult("FIGMA_ACCESS_TOKEN not configured");
        const nodeIds = Array.isArray(args.node_ids) ? args.node_ids.join(",") : String(args.node_ids);
        const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}/nodes?ids=${encodeURIComponent(nodeIds)}`, { headers: { "X-Figma-Token": figmaToken } });
        if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
        return textResult(await res.json());
      }
      case "figma_get_comments": {
        const figmaToken2 = process.env.FIGMA_ACCESS_TOKEN;
        if (!figmaToken2) return errorResult("FIGMA_ACCESS_TOKEN not configured");
        const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}/comments`, { headers: { "X-Figma-Token": figmaToken2 } });
        if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
        return textResult(await res.json());
      }
      case "figma_post_comment": {
        const figmaToken3 = process.env.FIGMA_ACCESS_TOKEN;
        if (!figmaToken3) return errorResult("FIGMA_ACCESS_TOKEN not configured");
        const payload: Record<string, unknown> = { message: String(args.message) };
        if (args.comment_id) payload.comment_id = String(args.comment_id);
        if (args.node_id) {
          payload.client_meta = { node_id: String(args.node_id), node_offset: { x: 0, y: 0 } };
        }
        const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}/comments`, {
          method: "POST",
          headers: {
            "X-Figma-Token": figmaToken3,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
        return textResult(await res.json());
      }
      case "figma_design_to_code": {
        const figmaToken4 = process.env.FIGMA_ACCESS_TOKEN;
        if (!figmaToken4) return errorResult("FIGMA_ACCESS_TOKEN not configured");

        let figmaData: unknown;
        if (args.node_id) {
          const nodeIds = Array.isArray(args.node_id) ? (args.node_id as string[]).join(",") : String(args.node_id);
          const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}/nodes?ids=${encodeURIComponent(nodeIds)}`, { headers: { "X-Figma-Token": figmaToken4 } });
          if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
          figmaData = await res.json();
        } else {
          const res = await fetch(`https://api.figma.com/v1/files/${args.file_key}`, { headers: { "X-Figma-Token": figmaToken4 } });
          if (!res.ok) return errorResult(`Figma API error: ${await res.text()}`);
          figmaData = await res.json();
        }

        // Simplify Figma data to reduce token count before sending to AI
        const simplified = JSON.stringify(figmaData).slice(0, 12000);

        const systemPrompt = `You are an expert frontend developer. Convert the provided Figma design JSON into a single React component using Tailwind CSS classes.

Rules:
- Output ONLY the code inside a markdown \`tsx\` code block.
- Use functional component syntax with default export.
- Use Tailwind CSS for all styling (layout, spacing, colors, typography, rounded corners, shadows).
- Use placeholder images from \`https://via.placeholder.com/{width}x{height}\` for image layers.
- Use logical color names based on the Figma fills (e.g., bg-blue-600, text-white).
- Keep it responsive with max-w and w-full where appropriate.
- Do not use arbitrary Tailwind values like w-[123px]; round to nearest standard value.
- Include TypeScript props interface if the design looks like a reusable component.
- Do not add any explanatory text outside the code block.`;

        try {
          const aiRes = await callChatAgentJSON([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here is the Figma design data:\n\n${simplified}\n\nGenerate the React + Tailwind component.` },
          ]);
          return textResult({ generated_code: aiRes.response, model: aiRes.model });
        } catch (err: any) {
          return errorResult(err?.message || "AI code generation failed");
        }
      }

      // Media
      case "media_remove_background": {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${appUrl}/api/media/remove-bg?url=${encodeURIComponent(String(args.url))}`);
        if (!res.ok) return errorResult(`remove.bg failed: ${await res.text()}`);
        return textResult(await res.json());
      }
      case "media_transform_image": {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const params = new URLSearchParams();
        params.set("url", String(args.url));
        if (args.width) params.set("w", String(args.width));
        if (args.height) params.set("h", String(args.height));
        if (args.crop) params.set("c", String(args.crop));
        if (args.gravity) params.set("g", String(args.gravity));
        if (args.format) params.set("f", String(args.format));
        return textResult({ transform_url: `${baseUrl}/api/media/transform?${params.toString()}` });
      }
      case "media_generate_image": {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${appUrl}/api/media/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: String(args.prompt), size: args.size }),
        });
        if (!res.ok) return errorResult(`Image generation failed: ${await res.text()}`);
        return textResult(await res.json());
      }

      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return errorResult(err?.message || String(err));
  }
}
