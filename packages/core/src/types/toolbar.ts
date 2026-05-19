// Toolbar collapse meta interface for universal overflow/collapse handling
import type { LeOption } from './options';

export type LeCollapseKind = 'item' | 'stepping' | 'variable';

export interface LeCollapseMeta {
  kind: LeCollapseKind;
  /** For stepping/variable: supported collapse values (e.g., [3,2,1] for button-group stages) */
  collapseValues?: string[];
  /** For variable: min/max width in px (optional) */
  minWidth?: number;
  maxWidth?: number;
  /** True if the component manages its own <le-visibility> or equivalent */
  managesVisibility?: boolean;
  /** Optionally, overflow menu representation */
  overflowOption?: LeOption;
}
