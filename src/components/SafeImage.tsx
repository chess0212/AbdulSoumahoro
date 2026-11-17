import { useState } from "react";
import { ImageOff } from "lucide-react";

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackTitle,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-brand-blue via-[#00284d] to-slate-900 text-white p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-3 text-brand-orange">
          <ImageOff className="w-5 h-5" />
        </div>
        <p className="font-display font-bold text-sm text-white/90 line-clamp-2 max-w-xs">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
