export interface OverlayLayer {
  id: string;
  name: string;
  type: "badge" | "text" | "image";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  opacity?: number;
  radius?: number;
  visible: boolean;
  locked: boolean;
  // smart layering additions
  objectFit?: "cover" | "contain" | "fill" | "none";
  textAlign?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold" | "black";
  fontFamily?: string;
  paddingX?: number;
  paddingY?: number;
  shadow?: "none" | "sm" | "md" | "lg";
  borderWidth?: number;
  borderColor?: string;
  rotation?: number;
  backdropBlur?: boolean;
  overflowVisible?: boolean;
}

export async function downloadComposedImage(
  baseImageUrl: string,
  layers: OverlayLayer[],
  fileName: string,
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = baseImageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(img, 0, 0);

  const visibleLayers = layers.filter((l) => l.visible);
  for (const layer of visibleLayers) {
    const x = (layer.x / 100) * canvas.width;
    const y = (layer.y / 100) * canvas.height;
    const w = (layer.width / 100) * canvas.width;
    const h = (layer.height / 100) * canvas.height;

    ctx.save();

    // rotation around center
    if (layer.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    // opacity
    ctx.globalAlpha = (layer.opacity ?? 100) / 100;

    // clip to layer bounds if not overflow visible
    if (!layer.overflowVisible) {
      ctx.beginPath();
      const r = Math.min(w, h) * ((layer.radius ?? 0) / 100);
      (ctx as unknown as { roundRect(x: number, y: number, w: number, h: number, r: number | number[]): void }).roundRect(x, y, w, h, r);
      ctx.clip();
    }

    // backdrop blur not supported on canvas export (skip)

    // shadow
    const shadow = layer.shadow ?? "none";
    if (shadow !== "none") {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = shadow === "sm" ? 4 : shadow === "md" ? 12 : 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = shadow === "sm" ? 1 : shadow === "md" ? 3 : 6;
    }

    // border
    if ((layer.borderWidth ?? 0) > 0) {
      ctx.lineWidth = layer.borderWidth!;
      ctx.strokeStyle = layer.borderColor || "#ffffff";
      const r = Math.min(w, h) * ((layer.radius ?? 0) / 100);
      (ctx as unknown as { roundRect(x: number, y: number, w: number, h: number, r: number | number[]): void }).roundRect(x, y, w, h, r);
      ctx.stroke();
    }

    if (layer.type === "badge" || layer.type === "text") {
      ctx.fillStyle = layer.backgroundColor || "#f59e0b";
      const radius = Math.min(w, h) * ((layer.radius ?? 0) / 100);
      ctx.beginPath();
      (ctx as unknown as { roundRect(x: number, y: number, w: number, h: number, r: number | number[]): void }).roundRect(x, y, w, h, radius);
      ctx.fill();

      ctx.fillStyle = layer.color || "#ffffff";
      const fontSize = (layer.fontSize || 14) * (canvas.width / 800);
      const weight = layer.fontWeight === "black" ? "900" : layer.fontWeight === "bold" ? "700" : "400";
      const fontFamily = layer.fontFamily || "sans-serif";
      ctx.font = `${weight} ${fontSize}px "${fontFamily}", sans-serif`;
      ctx.textAlign = layer.textAlign === "left" ? "left" : layer.textAlign === "right" ? "right" : "center";
      ctx.textBaseline = "middle";

      const padX = (layer.paddingX ?? 0) * (canvas.width / 100);
      const padY = (layer.paddingY ?? 0) * (canvas.height / 100);
      let tx = x + w / 2;
      if (layer.textAlign === "left") tx = x + padX;
      if (layer.textAlign === "right") tx = x + w - padX;
      const ty = y + h / 2;
      ctx.fillText(layer.content, tx, ty, w - padX * 2);
    } else if (layer.type === "image" && layer.content) {
      const layerImg = new Image();
      layerImg.crossOrigin = "anonymous";
      layerImg.src = layer.content;
      await new Promise<void>((resolve) => {
        layerImg.onload = () => resolve();
        layerImg.onerror = () => resolve();
      });
      if (layerImg.complete && layerImg.naturalWidth) {
        // simple fill for canvas export (object-fit approximation)
        ctx.drawImage(layerImg, x, y, w, h);
      }
    }

    ctx.restore();
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function createDefaultLayer(type: OverlayLayer["type"]): OverlayLayer {
  const id = `layer-${Date.now()}`;
  return {
    id,
    name: type === "badge" ? "Promo Badge" : type === "text" ? "Text" : "Image",
    type,
    content: type === "badge" ? "2 แถม 1" : type === "text" ? "New" : "",
    x: 10,
    y: 10,
    width: type === "badge" ? 20 : type === "text" ? 30 : 25,
    height: type === "badge" ? 10 : type === "text" ? 8 : 25,
    color: "#ffffff",
    backgroundColor: "#f59e0b",
    fontSize: 14,
    opacity: 100,
    radius: type === "badge" ? 50 : 0,
    visible: true,
    locked: false,
    objectFit: "cover",
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Inter",
    paddingX: 2,
    paddingY: 1,
    shadow: "none",
    borderWidth: 0,
    borderColor: "#ffffff",
    rotation: 0,
    backdropBlur: false,
    overflowVisible: false,
  };
}
