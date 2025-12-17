/**
 * Block types for the rich text editor.
 *
 * Used by: le-rich-text-editor, le-editor-block, le-block-menu
 */

/**
 * Available block types for the editor.
 * Start with essential types, expand in future versions.
 */
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet-list'
  | 'numbered-list'
  | 'quote'
  | 'code'
  | 'divider';

/**
 * A single block in the editor.
 *
 * @example Paragraph block
 * ```typescript
 * const block: LeBlock = {
 *   id: 'block-1',
 *   type: 'paragraph',
 *   content: 'Hello <strong>world</strong>!'
 * };
 * ```
 *
 * @example Code block with language
 * ```typescript
 * const block: LeBlock = {
 *   id: 'block-2',
 *   type: 'code',
 *   content: 'const x = 1;',
 *   attributes: { language: 'typescript' }
 * };
 * ```
 */
export interface LeBlock {
  /**
   * Unique identifier for the block.
   */
  id: string;

  /**
   * The type of block (paragraph, heading, list, etc.)
   */
  type: BlockType;

  /**
   * HTML content of the block.
   * For most blocks, this is the inner HTML.
   * For divider, this is empty.
   */
  content: string;

  /**
   * Block-specific attributes.
   */
  attributes?: LeBlockAttributes;
}

/**
 * Block-specific attributes
 */
export interface LeBlockAttributes {
  /**
   * Programming language for code blocks.
   */
  language?: string;

  /**
   * Placeholder text shown when block is empty.
   */
  placeholder?: string;

  /**
   * Custom CSS class for the block.
   */
  className?: string;

  /**
   * Additional custom attributes.
   */
  [key: string]: unknown;
}

/**
 * Configuration for a block type.
 * Used by the block registry to render and manage blocks.
 */
export interface BlockTypeConfig {
  /**
   * Block type identifier.
   */
  type: BlockType;

  /**
   * Display label for the block type (shown in block menu).
   */
  label: string;

  /**
   * Icon for the block type (emoji or icon name).
   */
  icon?: string;

  /**
   * HTML tag to render for this block type.
   */
  tag: string;

  /**
   * CSS class applied to the block element.
   */
  className?: string;

  /**
   * Placeholder text shown when block is empty.
   */
  placeholder?: string;

  /**
   * Whether the block content is editable.
   * Set to false for blocks like divider.
   */
  editable?: boolean;

  /**
   * Description shown in block menu.
   */
  description?: string;

  /**
   * Keyboard shortcut hint (e.g., "# " for heading).
   */
  shortcut?: string;
}

/**
 * Default block type configurations.
 */
export const DEFAULT_BLOCK_CONFIGS: BlockTypeConfig[] = [
  {
    type: 'paragraph',
    label: 'Text',
    icon: '¶',
    tag: 'p',
    placeholder: 'Type something...',
    editable: true,
    description: 'Plain text paragraph',
  },
  {
    type: 'heading1',
    label: 'Heading 1',
    icon: 'H1',
    tag: 'h1',
    placeholder: 'Heading 1',
    editable: true,
    description: 'Large section heading',
    shortcut: '# ',
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    icon: 'H2',
    tag: 'h2',
    placeholder: 'Heading 2',
    editable: true,
    description: 'Medium section heading',
    shortcut: '## ',
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    icon: 'H3',
    tag: 'h3',
    placeholder: 'Heading 3',
    editable: true,
    description: 'Small section heading',
    shortcut: '### ',
  },
  {
    type: 'bullet-list',
    label: 'Bulleted List',
    icon: '•',
    tag: 'li',
    placeholder: 'List item',
    editable: true,
    description: 'Unordered list',
    shortcut: '- ',
  },
  {
    type: 'numbered-list',
    label: 'Numbered List',
    icon: '1.',
    tag: 'li',
    placeholder: 'List item',
    editable: true,
    description: 'Ordered list',
    shortcut: '1. ',
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: '❝',
    tag: 'blockquote',
    placeholder: 'Quote',
    editable: true,
    description: 'Block quote',
    shortcut: '> ',
  },
  {
    type: 'code',
    label: 'Code',
    icon: '</>',
    tag: 'code',
    placeholder: 'Code',
    editable: true,
    description: 'Code block',
    shortcut: '``` ',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '—',
    tag: 'hr',
    editable: false,
    description: 'Horizontal line',
    shortcut: '---',
  },
];

/**
 * Event detail for block changes
 */
export interface LeBlockChangeDetail {
  blocks: LeBlock[];
  changedBlock?: LeBlock;
  action: 'add' | 'remove' | 'update' | 'move';
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new block with default values
 */
export function createBlock(type: BlockType, content: string = ''): LeBlock {
  return {
    id: generateBlockId(),
    type,
    content,
  };
}
