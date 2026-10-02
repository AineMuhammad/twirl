/**
 * Turns a mesh node name into a readable label: "Black_Gloss_Trim_Mesh" → "Black Gloss Trim",
 * "pillow01" → "Pillow 01". Merchants will name parts themselves in the editor (M4); until then
 * this keeps raw 3D-file names readable.
 */
export function prettyPartName(name: string): string {
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
