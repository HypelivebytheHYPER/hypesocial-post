"use client";

export interface ImageBlockProps {
  src?: string;
  alt?: string;
  caption?: string;
  aspectRatio?: "auto" | "video" | "square" | "portrait";
  rounded?: boolean;
  shadow?: "none" | "sm" | "lg";
  objectFit?: "cover" | "contain";
}

export function ImageBlock({ props }: { props: ImageBlockProps }) {
  const {
    src = "",
    alt = "Image",
    caption = "",
    aspectRatio = "auto",
    rounded = true,
    shadow = "sm",
    objectFit = "cover",
  } = props;

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "portrait"
      ? "aspect-[3/4]"
      : "";

  const shadowClass =
    shadow === "sm"
      ? "shadow-sm"
      : shadow === "lg"
      ? "shadow-lg"
      : "";

  return (
    <section className="w-full bg-background py-8 lg:py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className={`overflow-hidden ${rounded ? "rounded-xl" : ""} ${shadowClass} bg-muted ${aspectClass}`}>
          {src ? (
             
            <img
              src={src}
              alt={alt}
              className={`h-full w-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
            />
          ) : (
            <div className="flex h-full min-h-[200px] w-full items-center justify-center text-muted-foreground">
              <span className="text-sm">No image selected</span>
            </div>
          )}
        </div>
        {caption && (
          <p className="mt-3 text-center text-sm text-muted-foreground">{caption}</p>
        )}
      </div>
    </section>
  );
}
