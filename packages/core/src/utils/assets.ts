import { getAssetPath } from '@stencil/core';

const ABSOLUTE_URL_RE = /^(?:https?:)?\/\//i;

/**
 * Resolve a Le-Kit asset URL from either absolute URL, root-relative path,
 * or plain file name.
 */
export function resolveLeKitAssetUrl(path: string): string {
  const normalizedPath = (path || '').trim();
  if (!normalizedPath) {
    return getAssetPath('./assets/custom-elements.json');
  }

  if (ABSOLUTE_URL_RE.test(normalizedPath)) {
    return normalizedPath;
  }

  const withoutPrefix = normalizedPath.replace(/^\.?\/+/, '');
  const relativePath = withoutPrefix.startsWith('assets/')
    ? `./${withoutPrefix}`
    : `./assets/${withoutPrefix}`;

  return getAssetPath(relativePath);
}

/**
 * Resolve URL for the custom elements manifest file.
 */
export function resolveManifestUrl(manifestFile: string): string {
  return resolveLeKitAssetUrl(manifestFile);
}
