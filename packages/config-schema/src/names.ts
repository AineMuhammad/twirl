/**
 * Turns a mesh node name into a readable label: "Black_Gloss_Trim_Mesh" → "Black Gloss Trim",
 * "pillow01" → "Pillow 01". Merchants rename parts in the editor; this keeps raw names readable.
 */
export function humanizeName(name: string): string {
  const words = name
    .replace(/[_\-.]+mesh$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ');
  if (!words) return name;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A config id from free text: "Black Gloss Trim" → "black-gloss-trim" (max 48 chars). */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
}
