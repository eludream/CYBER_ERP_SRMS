import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cacheBustedUrl(url?: string | null) {
  if (!url) return null;
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}
