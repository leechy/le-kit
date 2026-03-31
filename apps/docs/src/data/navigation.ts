export interface NavItem {
  label: string;
  href?: string;
  id?: string;
  open?: boolean;
  children?: NavItem[];
  part?: string;
  iconEnd?: string;
}

export const mainNavigationItems: NavItem[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Components', href: '/components' },
  // { label: "Blueprints", href: "/blueprints" },
  { label: 'Blog', href: '/blog' },
  {
    label: 'Get Started',
    href: '/docs/start',
    iconEnd: '→',
    part: 'get-started',
  },
];

export const docsNavigationItems: NavItem[] = [
  {
    label: 'Getting Started',
    id: 'getting-started',
    open: true,
    children: [
      { label: 'Installation', href: '/docs/start' },
      { label: 'Assets Setup', href: '/docs/assets' },
    ],
  },
  {
    label: 'Core Concepts',
    id: 'core-concepts',
    open: true,
    children: [
      // { label: 'Admin Mode', href: '/docs/admin-mode' },
      { label: 'Styling & Theming', href: '/docs/theming' },
    ],
  },
  { label: 'Contributing', href: '/docs/contributing' },
  // { label: 'Changelog', href: '/docs/changelog' },
];

export const componentsNavigationItems: NavItem[] = [
  {
    label: 'Form Controls',
    id: 'form-controls',
    open: true,
    children: [
      { label: 'Button', href: '/components/le-button' },
      { label: 'Checkbox', href: '/components/le-checkbox' },
      {
        label: 'Inputs',
        id: 'form-inputs',
        open: true,
        children: [
          { label: 'String Input', href: '/components/le-string-input' },
          { label: 'Number Input', href: '/components/le-number-input' },
          { label: 'Code Input', href: '/components/le-code-input' },
        ],
      },
      {
        label: 'Dropdowns',
        id: 'form-dropdowns',
        open: true,
        children: [
          { label: 'Select', href: '/components/le-select' },
          { label: 'Combo Box', href: '/components/le-combobox' },
          { label: 'Multi Select', href: '/components/le-multiselect' },
        ],
      },
    ],
  },
  {
    label: 'Layout & Navigation',
    id: 'layout-navigation',
    open: true,
    children: [
      { label: 'Header', href: '/components/le-header' },
      { label: 'Scroll Progress', href: '/components/le-scroll-progress' },
      { label: 'Side Panel', href: '/components/le-side-panel' },
      { label: 'Bar', href: '/components/le-bar' },
      { label: 'Navigation', href: '/components/le-navigation' },
      {
        label: 'Tabs',
        id: 'tabs-group',
        open: true,
        children: [
          {
            label: 'Tabs',
            href: '/components/le-tabs',
            id: 'tabs-component',
            open: true,
          },
          { label: 'Tab', href: '/components/le-tab' },
          { label: 'Tab Bar', href: '/components/le-tab-bar' },
          { label: 'Tab Panel', href: '/components/le-tab-panel' },
        ],
      },
      { label: 'Breadcrumbs', href: '/components/le-breadcrumbs' },
      { label: 'Tag', href: '/components/le-tag' },
    ],
  },
  {
    label: 'Overlays',
    id: 'overlays',
    open: true,
    children: [
      { label: 'Popover', href: '/components/le-popover' },
      { label: 'Popup', href: '/components/le-popup' },
    ],
  },
  {
    label: 'Admin',
    id: 'admin-components',
    open: true,
    children: [
      { label: 'Component', href: '/components/le-component' },
      { label: 'Slot', href: '/components/le-slot' },
    ],
  },
  {
    label: 'Legacy',
    id: 'legacy-components',
    open: true,
    children: [
      { label: 'Round Progress', href: '/components/le-round-progress' },
      { label: 'Turntable', href: '/components/le-turntable' },
    ],
  },
];
