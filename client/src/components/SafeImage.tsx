import type { ImgHTMLAttributes } from "react";
import { handleImageError, resolveImageUrl } from "@/lib/imageUtils";

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** When true (default), rewrite /manus-storage/ paths to local /images/ paths */
  resolve?: boolean;
};

export function SafeImage({
  src,
  resolve = true,
  onError,
  ...props
}: SafeImageProps) {
  const resolvedSrc = resolve && typeof src === "string" ? resolveImageUrl(src) : src;

  return (
    <img
      {...props}
      src={resolvedSrc}
      onError={(e) => {
        handleImageError(e);
        onError?.(e);
      }}
    />
  );
}
