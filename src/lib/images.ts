/** Unsplash CDN helper: requests a right-sized, auto-formatted image (free, no API key). */
export function unsplash(id: string, w = 900, h?: number): string {
  const size = h ? `&h=${h}&fit=crop` : '';
  return `https://images.unsplash.com/photo-${id}?auto=format&q=75&w=${w}${size}`;
}

export function avatar(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&q=70&w=240&h=240&fit=crop&crop=faces`;
}

/** Feed thumbnails are requested at a fraction of full size to keep grids light. */
export function thumbnail(url: string, w = 320): string {
  return url.includes('images.unsplash.com') ? url.replace(/w=\d+/, `w=${w}`) : url;
}
