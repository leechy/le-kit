/**
 * Utility functions for icon composition — position parsing, transform computation,
 * and viewBox parsing for the le-icon composable layers/badges feature.
 */

export interface ParsedViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface LayerConfig {
  name: string;
  position?: string;
  scale?: number;
  opacity?: number;
  color?: string;
  rounded?: boolean;
  sharp?: boolean;
  filled?: boolean;
  outlined?: boolean;
  thin?: boolean;
}

/**
 * Parses a viewBox string like "0 0 16 16" into its components.
 */
export function parseViewBox(viewBoxStr: string): ParsedViewBox {
  const parts = viewBoxStr.trim().split(/\s+/).map(Number);
  return {
    x: parts[0] || 0,
    y: parts[1] || 0,
    width: parts[2] || 0,
    height: parts[3] || 0,
  };
}

/**
 * Parses a single position value (e.g., "5", "-3", "5px", "50%")
 * into an absolute viewBox coordinate (center of the layer).
 *
 * Rules:
 * - Positive number (or with px suffix): units from start/top
 * - Negative number (or with px suffix): units from end/bottom
 * - Percentage: works like CSS background-position — 0% aligns the layer's
 *   near edge with the container's near edge, 100% aligns the far edges,
 *   50% centers the layer. Formula: center = percent * (container - layer) + layer / 2
 */
function parsePositionValue(value: string, viewBoxDimension: number, layerSize: number): number {
  const trimmed = value.trim();

  if (trimmed.endsWith('%')) {
    // CSS background-position formula:
    // offset = percent * (containerSize - elementSize)
    // center = offset + elementSize / 2
    const percent = parseFloat(trimmed) / 100;
    return percent * (viewBoxDimension - layerSize) + layerSize / 2;
  }

  // Strip optional 'px' suffix — values are always in viewBox units
  const numeric = parseFloat(trimmed.replace(/px$/i, ''));

  if (isNaN(numeric)) {
    return 0;
  }

  if (numeric < 0) {
    // Negative = from end/bottom edge
    return viewBoxDimension + numeric;
  }

  // Positive = from start/top
  return numeric;
}

/**
 * Keyword-to-percentage mappings for position values.
 */
const POSITION_KEYWORDS: Record<string, string> = {
  'left': '0%',
  'start': '0%',
  'right': '100%',
  'end': '100%',
  'top': '0%',
  'bottom': '100%',
  'center': '50%',
};

/** Keywords that are inherently vertical (y-axis only). */
const Y_KEYWORDS = new Set(['top', 'bottom']);

/** Keywords that are inherently horizontal (x-axis only). */
const X_KEYWORDS = new Set(['left', 'right']);

/**
 * Resolves a keyword to its percentage equivalent, or returns the value unchanged.
 */
function resolveKeyword(value: string): string {
  return POSITION_KEYWORDS[value.trim().toLowerCase()] ?? value;
}

/**
 * Parses a position string like "-2, 50%" or "top, right" into absolute viewBox coordinates.
 * The position defines where the center of the overlay layer is placed.
 *
 * Supports:
 * - Numbers (viewBox units): "5", "-3"
 * - Percentages (CSS background-position style): "50%", "100%"
 * - Keywords: "top", "bottom", "left", "right", "start", "end", "center"
 *
 * Keywords are auto-swapped to the correct axis, so "top, right" and "right, top"
 * both produce the same top-right position.
 *
 * @param positionStr - Comma-separated x,y values (e.g., "-5, -5" or "top, right")
 * @param viewBoxWidth - Width of the parent viewBox
 * @param viewBoxHeight - Height of the parent viewBox
 * @param layerWidth - Effective width of the layer (layerViewBox.width * scale)
 * @param layerHeight - Effective height of the layer (layerViewBox.height * scale)
 */
export function parsePosition(
  positionStr: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
  layerWidth: number = 0,
  layerHeight: number = 0,
): Position {
  const parts = positionStr.split(',');
  let xStr = (parts[0] || '0').trim();
  let yStr = (parts[1] || parts[0] || '0').trim();

  // Auto-swap if axis-specific keywords are in the wrong position
  // e.g., "top, right" → swap → x=right, y=top
  const xLower = xStr.toLowerCase();
  const yLower = yStr.toLowerCase();
  if (Y_KEYWORDS.has(xLower) || X_KEYWORDS.has(yLower)) {
    [xStr, yStr] = [yStr, xStr];
  }

  // Resolve keywords to percentages
  xStr = resolveKeyword(xStr);
  yStr = resolveKeyword(yStr);

  return {
    x: parsePositionValue(xStr, viewBoxWidth, layerWidth),
    y: parsePositionValue(yStr, viewBoxHeight, layerHeight),
  };
}

/**
 * Computes the SVG transform attribute string for a layer.
 * Places the layer's center at (posX, posY) in the parent viewBox
 * and scales around that center point.
 *
 * @param posX - Absolute x position in parent viewBox coordinates
 * @param posY - Absolute y position in parent viewBox coordinates
 * @param scale - Scale factor (1.0 = no scaling)
 * @param layerViewBox - The layer icon's own viewBox
 */
export function computeLayerTransform(
  posX: number,
  posY: number,
  scale: number,
  layerViewBox: ParsedViewBox,
): string {
  const tx = posX - (layerViewBox.width / 2) * scale;
  const ty = posY - (layerViewBox.height / 2) * scale;

  if (scale === 1) {
    return `translate(${tx}, ${ty})`;
  }
  return `translate(${tx}, ${ty}) scale(${scale})`;
}

/**
 * Parses the layers JSON string prop into an array of LayerConfig objects.
 * Returns an empty array if the input is falsy or invalid.
 */
export function parseLayers(layersStr: string | undefined): LayerConfig[] {
  if (!layersStr) {
    return [];
  }
  try {
    const parsed = JSON.parse(layersStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    console.error('le-icon: Invalid layers JSON:', layersStr);
    return [];
  }
}
