export function sanitizeExternalUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidImageSource(src?: string | null): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:image/")) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  return sanitizeExternalUrl(trimmed) !== null;
}

/**
 * Compresses a user-selected image file in the browser using an HTML5 Canvas
 * so it stays well within Firestore's document size limit (~320 KB max).
 */
export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Format d'image non pris en charge."));
    image.src = dataUrl;
  });

  const MAX_WIDTH = 1200;
  const MAX_HEIGHT = 900;
  let { width, height } = img;

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Erreur lors de la préparation de l'image.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fall back to JPEG if needed, and ensure size < 380,000 chars
  const qualities = [0.82, 0.65, 0.48];
  for (const quality of qualities) {
    const webp = canvas.toDataURL("image/webp", quality);
    if (webp.length <= 380000 && webp.startsWith("data:image/webp")) {
      return webp;
    }
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    if (jpeg.length <= 380000) {
      return jpeg;
    }
  }

  // Final resize pass if image is unusually dense
  canvas.width = Math.round(width * 0.65);
  canvas.height = Math.round(height * 0.65);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const compact = canvas.toDataURL("image/jpeg", 0.6);
  if (compact.length > 420000) {
    throw new Error("L'image reste trop volumineuse après compression. Essayez une image plus légère ou collez une URL.");
  }
  return compact;
}
