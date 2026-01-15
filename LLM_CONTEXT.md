# Le-Kit Component Reference

This file is auto-generated and contains documentation for all Le-Kit web components. It is intended to be used as context for AI coding assistants.

## Table of Contents

- [le-bar](#le-bar)
- [le-box](#le-box)
- [le-button](#le-button)
- [le-card](#le-card)
- [le-checkbox](#le-checkbox)
- [le-code-input](#le-code-input)
- [le-collapse](#le-collapse)
- [le-combobox](#le-combobox)
- [le-component](#le-component)
- [le-current-heading](#le-current-heading)
- [le-dropdown-base](#le-dropdown-base)
- [le-header](#le-header)
- [le-header-placeholder](#le-header-placeholder)
- [le-icon](#le-icon)
- [le-multiselect](#le-multiselect)
- [le-navigation](#le-navigation)
- [le-number-input](#le-number-input)
- [le-popover](#le-popover)
- [le-popup](#le-popup)
- [le-round-progress](#le-round-progress)
- [le-scroll-progress](#le-scroll-progress)
- [le-segmented-control](#le-segmented-control)
- [le-select](#le-select)
- [le-side-panel](#le-side-panel)
- [le-side-panel-toggle](#le-side-panel-toggle)
- [le-slot](#le-slot)
- [le-stack](#le-stack)
- [le-string-input](#le-string-input)
- [le-tab](#le-tab)
- [le-tab-bar](#le-tab-bar)
- [le-tab-panel](#le-tab-panel)
- [le-tabs](#le-tabs)
- [le-tag](#le-tag)
- [le-text](#le-text)
- [le-turntable](#le-turntable)

---

## <le-bar>

A flexible bar component that handles overflow gracefully.

Items are slotted children. The bar measures which items fit on the first
row and handles overflow according to the `overflow` prop.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `overflow` | `'more' \| 'scroll' \| 'hamburger' \| 'wrap'` | `'more'` | Overflow behavior when items don't fit on one row. - `more`: Overflow items appear in a "more" dropdown - `scroll`: Items scroll horizontally with optional arrows - `hamburger`: All items go into a hamburger menu if any overflow - `wrap`: Items wrap to additional rows |
| `alignItems` | `'start' \| 'end' \| 'center' \| 'stretch'` | `'start'` | Alignment of items within the bar (maps to justify-content). |
| `arrows` | `boolean` | `false` | Show scroll arrows when overflow is "scroll". |
| `disablePopover` | `boolean` | `false` | Disable the internal overflow popover. When true, the bar still detects overflow and hides items, but doesn't render its own popover. Use this when providing custom overflow handling via the leBarOverflowChange event. |
| `minVisibleItems` | `number` | `0` | Minimum number of visible items required when using "more" overflow mode. If fewer items would be visible, the bar falls back to hamburger mode. Only applies when overflow is "more". |
| `showAllMenu` | `boolean \| 'start' \| 'end'` | `false` | Show an "all items" menu button. - `false`: Don't show - `true` or `'end'`: Show at end - `'start'`: Show at start |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leBarOverflowChange` | `EventEmitter<LeBarOverflowChangeDetail>` | Emitted when overflow state changes. |

### Slots

| Name | Description |
|------|-------------|
| Default | Bar items (children will be measured for overflow) |
| `"more"` | Custom "more" button content |
| `"hamburger"` | Custom hamburger button content |
| `"start-arrow"` | Custom left scroll arrow |
| `"end-arrow"` | Custom right scroll arrow |
| `"all-menu"` | Custom "show all" menu button |

---

## <le-box>

A flexible box component for use as a flex item within le-stack.

`le-box` wraps content and provides flex item properties like grow, shrink,
basis, and self-alignment. It can also control its internal content alignment.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `grow` | `number` | `0` | Flex grow factor - how much the item should grow relative to siblings |
| `shrink` | `number` | `1` | Flex shrink factor - how much the item should shrink relative to siblings |
| `basis` | `string` | `'auto'` | Flex basis - initial size before growing/shrinking (e.g., '200px', '25%', 'auto') |
| `width` | `string \| undefined` |  | Width of the box (CSS value like '100px', '50%', 'auto') |
| `height` | `string \| undefined` |  | Height of the box (CSS value) |
| `minWidth` | `string \| undefined` |  | Minimum width constraint |
| `maxWidth` | `string \| undefined` |  | Maximum width constraint |
| `minHeight` | `string \| undefined` |  | Minimum height constraint |
| `maxHeight` | `string \| undefined` |  | Maximum height constraint |
| `background` | `string \| undefined` |  | Background color or CSS value (e.g., '#f0f0f0', 'var(--le-color-primary-light)') |
| `borderRadius` | `string \| undefined` |  | Border radius (e.g., '8px', 'var(--le-radius-md)') |
| `border` | `string \| undefined` |  | Border style (e.g., '1px solid #ccc', '2px dashed var(--le-color-border)') |
| `alignSelf` | `'auto' \| 'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'auto'` | Self-alignment override for this item on the cross axis |
| `alignContent` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'stretch'` | Internal horizontal alignment of content |
| `justifyContent` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'start'` | Internal vertical alignment of content |
| `padding` | `string \| undefined` |  | Padding inside the box (CSS value like '8px', '1rem') |
| `order` | `number \| undefined` |  | Order in the flex container (lower values come first) |
| `displayFlex` | `boolean` | `false` | Whether to display box content as flex (for internal alignment) |
| `innerDirection` | `'horizontal' \| 'vertical'` | `'vertical'` | Direction of internal flex layout when displayFlex is true |
| `innerGap` | `string \| undefined` |  | Gap between internal flex items when displayFlex is true |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for box content |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-box-bg` | Background color |
| `--le-box-padding` | Padding inside the box |
| `--le-box-border-radius` | Border radius |

---

## <le-button>

A flexible button component with multiple variants and states.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `mode` | `'default' \| 'admin'` |  | Mode of the popover should be 'default' for internal use |
| `variant` | `'solid' \| 'outlined' \| 'clear' \| 'system'` | `'solid'` | Button variant style |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` | Button color theme (uses theme semantic colors) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `selected` | `boolean` | `false` | Whether the button is in a selected/active state |
| `fullWidth` | `boolean` | `false` | Whether the button takes full width of its container |
| `iconOnly` | `string \| Node \| undefined` |  | Icon only button image or emoji if this prop is set, the button will render only the icon slot |
| `iconStart` | `string \| Node \| undefined` |  | Start icon image or emoji |
| `iconEnd` | `string \| Node \| undefined` |  | End icon image or emoji |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | The button type attribute |
| `href` | `string \| undefined` |  | Optional href to make the button act as a link |
| `target` | `string \| undefined` |  | Link target when href is set |
| `align` | `'start' \| 'center' \| 'space-between' \| 'end'` | `'center'` | Alignment of the button label without the end icon |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `click` | `EventEmitter<MouseEvent>` | Emitted when the button is clicked. This is a custom event that wraps the native click but ensures the target is the le-button. |

### Slots

| Name | Description |
|------|-------------|
| Default | Button text content |
| `"icon-only"` | Icon for icon-only buttons |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-button-bg` | Button background color |
| `--le-button-color` | Button text color |
| `--le-button-border-radius` | Button border radius |
| `--le-button-padding-x` | Button horizontal padding |
| `--le-button-padding-y` | Button vertical padding |

---

## <le-card>

A flexible card component with header, content, and footer slots.

The card uses le-slot wrappers for each slot area. In admin mode,
le-slot shows placeholders for CMS editing. In default mode,
le-slot acts as a transparent passthrough.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Card variant style |
| `interactive` | `boolean` | `false` | Whether the card is interactive (clickable) |

### Slots

| Name | Description |
|------|-------------|
| `"header"` | Card header content (title, actions) |
| Default | Default slot for main card content |
| `"footer"` | Card footer content (buttons, links) |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-card-bg` | Card background color |
| `--le-card-border-radius` | Card border radius |
| `--le-card-shadow` | Card box shadow |
| `--le-card-padding` | Card content padding |

---

## <le-checkbox>

A checkbox component with support for labels, descriptions, and external IDs.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `checked` | `boolean` | `false` | Whether the checkbox is checked |
| `disabled` | `boolean` | `false` | Whether the checkbox is disabled |
| `name` | `string` |  | The name of the checkbox input |
| `value` | `string` |  | The value of the checkbox input |
| `externalId` | `string` |  | External ID for linking with external systems (e.g. database ID, PDF form field ID) |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `change` | `EventEmitter<{ checked: boolean; value: string; name: string; externalId: string }>` | Emitted when the checked state changes |

### Slots

| Name | Description |
|------|-------------|
| Default | The label text for the checkbox |
| `"description"` | Additional description text displayed below the label |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-checkbox-size` | Size of the checkbox input |
| `--le-checkbox-color` | Color of the checkbox when checked |
| `--le-checkbox-label-color` | Color of the label text |
| `--le-checkbox-desc-color` | Color of the description text |

---

## <le-code-input>

A one-time code input component with individual frames for each character.
Supports standard copy/paste and range selection behaviors.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `value` | `string` | `''` | The value of the input |
| `name` | `string` |  | The name of the input |
| `label` | `string` |  | Label for the input |
| `length` | `number` | `6` | Length of the code (number of characters) |
| `description` | `string \| undefined` |  | Description text displayed below the input in case there is a more complex markup, it can be provided via slot as well |
| `type` | `'text' \| 'number'` | `'text'` | The type of code (numeric or alphanumeric) This affects the keyboard layout on mobile devices. |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `readonly` | `boolean` | `false` | Whether the input is read-only |
| `externalId` | `string` |  | External ID for linking with external systems |
| `error` | `boolean` | `false` | Internal validation state (can be set externally manually or via simple check) |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leChange` | `EventEmitter<{ value: string; name: string; externalId: string }>` | Emitted when the value changes (on blur or Enter) |
| `leInput` | `EventEmitter<{ value: string; name: string; externalId: string }>` | Emitted when the input value changes (on keystroke) |
| `leFocus` | `EventEmitter<void>` | Emitted when the input is focused |
| `leBlur` | `EventEmitter<void>` | Emitted when the input is blurred |

### Slots

| Name | Description |
|------|-------------|
| `"description"` | Additional description text displayed below the input |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-code-box-size` | Size of each character box (default: 40px width, 48px height) |
| `--le-input-bg` | Input background color |
| `--le-input-color` | Input text color |
| `--le-input-border` | Input border style |
| `--le-input-border-focus` | Input border style when focused |
| `--le-input-border-error` | Input border style when invalid |
| `--le-input-radius` | Input border radius |

---

## <le-collapse>

Animated show/hide wrapper.

Supports height collapse (auto->0) and/or fading.
Can optionally listen to the nearest `le-header` shrink events.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `closed` | `boolean` | `false` | Since Stencil boolean props default to `false` when the attribute is missing. instead of `open` defaulting to `true`, using a `closed` prop. |
| `scrollDown` | `boolean` | `false` | Whether the content should scroll down from the top when open. |
| `noFading` | `boolean` | `false` | Stop fading the content when collapsing/expanding. |
| `collapseOnHeaderShrink` | `boolean` | `false` | If true, collapse/expand based on the nearest header shrink event. |

### Slots

| Name | Description |
|------|-------------|
| Default | Content to animate |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-collapse-duration` | Transition duration |

---

## <le-combobox>

A combobox component with searchable dropdown.

Combines a text input with a dropdown list, allowing users to
filter options by typing or select from the list.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `options` | `LeOption[] \| string` | `[]` | The options to display in the dropdown. |
| `value` | `LeOptionValue \| undefined` |  | The currently selected value. |
| `placeholder` | `string` | `'Type to search...'` | Placeholder text for the input. |
| `disabled` | `boolean` | `false` | Whether the combobox is disabled. |
| `required` | `boolean` | `false` | Whether selection is required. |
| `name` | `string \| undefined` |  | Name attribute for form submission. |
| `fullWidth` | `boolean` | `false` | Whether the multiselect should take full width of its container. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the combobox. |
| `allowCustom` | `boolean` | `false` | Whether to allow custom values not in the options list. |
| `minSearchLength` | `number` | `0` | Minimum characters before showing filtered results. |
| `emptyText` | `string` | `'No results found'` | Text to show when no options match the search. |
| `open` | `boolean` | `false` | Whether the dropdown is currently open. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leChange` | `EventEmitter<LeOptionSelectDetail>` | Emitted when the selected value changes. |
| `leInput` | `EventEmitter<{ value: string }>` | Emitted when the input value changes (for custom values). |
| `leOpen` | `EventEmitter<void>` | Emitted when the dropdown opens. |
| `leClose` | `EventEmitter<void>` | Emitted when the dropdown closes. |

---

## <le-component>

Component wrapper for admin mode editing.

This component is used internally by other components to provide admin-mode
editing capabilities. It wraps the component's rendered output and shows
a settings popover for editing properties.

In default mode, it acts as a simple passthrough (display: contents).
In admin mode, it shows a border, component name header, and settings popover.

The host element is found automatically by traversing up through the shadow DOM.

Usage inside a component's render method:
```tsx
render() {
  return (
    <le-component component="le-card">
      <Host>...</Host>
    </le-component>
  );
}
```

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `component` | `string` |  | The tag name of the component (e.g., 'le-card'). Used to look up property metadata and display the component name. |
| `displayName` | `string \| undefined` |  | Optional display name for the component. If not provided, the tag name will be formatted as the display name. |
| `hostClass` | `string \| undefined` |  | Classes to apply to the host element. Allows parent components to pass their styling classes. |
| `hostStyle` | `{ [key: string]: string } \| undefined` |  | Inline styles to apply to the host element. Allows parent components to pass dynamic styles (e.g., flex properties). |

### Slots

| Name | Description |
|------|-------------|
| Default | The component's rendered content |

---

## <le-current-heading>

Shows a "smart" header title based on what has scrolled out of view.

When `selector` matches multiple elements, the title becomes the last element
(top-to-bottom) that has fully scrolled out above the viewport.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `selector` | `string` | `''` | CSS selector for page title/headings to watch (e.g. `.page-title`, `main h2`). |

### Slots

| Name | Description |
|------|-------------|
| Default | Optional fallback content if no watched title is active |

---

## <le-dropdown-base>

Internal dropdown base component that provides shared functionality
for select, combobox, and multiselect components.

Wraps le-popover for positioning and provides:
- Option list rendering with groups
- Keyboard navigation (↑↓, Enter, Escape, Home/End)
- Option filtering support
- Single and multi-select modes

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `options` | `LeOption[]` | `[]` | The options to display in the dropdown. |
| `value` | `LeOptionValue \| LeOptionValue[] \| undefined` |  | Current value(s) - single value or array for multiselect. |
| `multiple` | `boolean` | `false` | Whether multiple selection is allowed. |
| `open` | `boolean` | `false` | Whether the dropdown is open. |
| `disabled` | `boolean` | `false` | Whether the dropdown is disabled. |
| `filterFn` | `(option: LeOption, query: string) => boolean \| undefined` |  | Filter function for options. Return true to include the option. |
| `filterQuery` | `string` | `''` | Current filter query string. |
| `emptyText` | `string` | `'No options'` | Placeholder text when no options match filter. |
| `showCheckboxes` | `boolean` | `true` | Whether to show checkboxes for multiselect mode. |
| `maxHeight` | `string` | `'300px'` | Maximum height of the dropdown list. |
| `width` | `string \| undefined` |  | Width of the dropdown. If not set, matches trigger width. |
| `fullWidth` | `boolean` | `false` | Sets the dropdown to full width of the trigger. |
| `closeOnClickOutside` | `boolean` | `true` | Whether to close the dropdown when clicking outside. (used to support combobox with input focus) |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leOptionSelect` | `EventEmitter<LeOptionSelectDetail>` | Emitted when an option is selected. |
| `leDropdownOpen` | `EventEmitter<void>` | Emitted when the dropdown opens. |
| `leDropdownClose` | `EventEmitter<void>` | Emitted when the dropdown closes. |

### Slots

| Name | Description |
|------|-------------|
| `"trigger"` | The element that triggers the dropdown |

---

## <le-header>

A functional page header with scroll-aware behaviors.

Features:
- Static (default), sticky, or fixed positioning
- Optional shrink-on-scroll behavior via `shrink-offset`
- Optional reveal-on-scroll-up via `reveal-on-scroll` (sticky only)

Slots:
- `start`: left side (logo/back button)
- `title`: centered/primary title content
- `end`: right side actions
- default: extra content row (e.g., tabs/search) rendered below main row

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `isStatic` | `boolean` | `false` | Force static positioning (default). Ignored if `sticky` or `fixed` are true. |
| `sticky` | `boolean` | `false` | Sticky positioning (in-flow). Ignored if `fixed` is true. |
| `fixed` | `boolean` | `false` | Fixed positioning (out-of-flow). Takes precedence over `sticky`/`static`. |
| `revealOnScroll` | `string \| undefined` |  | Sticky-only reveal behavior (hide on scroll down, show on scroll up). - missing/false: disabled - true/empty attribute: enabled with default threshold (16) - number (as string): enabled and used as threshold |
| `shrinkOffset` | `string \| undefined` |  | Shrink trigger. - missing/0: disabled - number (px): shrink when scrollY >= that value (but never before header height) - css var name (e.g. --foo): shrink when scrollY >= resolved var value - selector (e.g. .page-title): shrink when that element scrolls out of view above the viewport |
| `expandOnHover` | `boolean` | `false` | If true, expand the header when hovered |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leHeaderState` | `EventEmitter<{
    y: number;
    direction: 'up' \| 'down';
    revealed: boolean;
    shrunk: boolean;
  }>` | Emits whenever scroll-driven state changes. |
| `leHeaderShrinkChange` | `EventEmitter<{ shrunk: boolean; y: number }>` | Emits when the header shrinks/expands (only on change). |
| `leHeaderVisibilityChange` | `EventEmitter<{ visible: boolean; y: number }>` | Emits when the header hides/shows (only on change). |

### Slots

| Name | Description |
|------|-------------|
| `"start"` | Start area content |
| `"title"` | Title content |
| `"end"` | End area content |
| Default | Optional secondary row content |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-header-bg` | Background (color/gradient) |
| `--le-header-color` | Text color |
| `--le-header-border` | Border (e.g. 1px solid ...) |
| `--le-header-shadow` | Shadow/elevation |
| `--le-header-max-width` | Inner content max width |
| `--le-header-padding-x` | Horizontal padding |
| `--le-header-padding-y` | Vertical padding |
| `--le-header-gap` | Gap between zones |
| `--le-header-height` | Base height (main row) |
| `--le-header-height-condensed` | Condensed height when shrunk |
| `--le-header-transition` | Transition timing |
| `--le-header-z` | Z-index (fixed mode) |

---

## <le-header-placeholder>

Placeholder for `le-header`.

Reserves space using the global CSS variable `--le-header-height`.
The header component updates that variable when it renders.

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-header-height` | Published header height (px) |

---

## <le-icon>

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `name` | `string` | `null` | Name of the icon to display. Corresponds to a JSON file in the assets folder. For example, "search" will load the "search.json" file. |
| `size` | `number` | `16` | Size of the icon in pixels. Default is 16. |

---

## <le-multiselect>

A multiselect component for selecting multiple options.

Displays selected items as tags with optional search filtering.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `options` | `LeOption[] \| string` | `[]` | The options to display in the dropdown. |
| `value` | `LeOptionValue[]` | `[]` | The currently selected values. |
| `placeholder` | `string` | `'Select options...'` | Placeholder text when no options are selected. |
| `disabled` | `boolean` | `false` | Whether the multiselect is disabled. |
| `required` | `boolean` | `false` | Whether selection is required. |
| `name` | `string \| undefined` |  | Name attribute for form submission. |
| `fullWidth` | `boolean` | `false` | Whether the multiselect should take full width of its container. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the multiselect. |
| `maxSelections` | `number \| undefined` |  | Maximum number of selections allowed. |
| `showSelectAll` | `boolean \| string \| string[]` | `false` | Whether to show a "Select All" option. Also accepts a string or array of strings to customize the label(s). |
| `searchable` | `boolean` | `false` | Whether the input is searchable. |
| `emptyText` | `string` | `'No results found'` | Text to show when no options match the search. |
| `open` | `boolean` | `false` | Whether the dropdown is currently open. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leChange` | `EventEmitter<LeMultiOptionSelectDetail>` | Emitted when the selected values change. |
| `leOpen` | `EventEmitter<void>` | Emitted when the dropdown opens. |
| `leClose` | `EventEmitter<void>` | Emitted when the dropdown closes. |

---

## <le-navigation>

Navigation component with vertical (tree) and horizontal (menu) layouts.

- Accepts items as `LeOption[]` or a JSON string.
- Supports hierarchical items via `children`.
- Supports persisted expansion via `open` on items.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `items` | `LeOption[] \| string` | `[]` | Navigation items. Can be passed as an array or JSON string (same pattern as le-select). |
| `orientation` | `'vertical' \| 'horizontal'` | `'horizontal'` | Layout orientation. |
| `wrap` | `boolean` | `false` | Horizontal wrapping behavior. If false, overflow behavior depends on `overflowMode`. |
| `overflowMode` | `'more' \| 'hamburger'` | `'more'` | Overflow behavior for horizontal, non-wrapping menus. - more: moves overflow items into a "More" popover - hamburger: turns the whole nav into a hamburger popover |
| `minVisibleItemsForMore` | `number` | `2` | Minimum number of visible top-level items required to use the "More" overflow. If fewer would be visible, the navigation falls back to hamburger. |
| `align` | `'start' \| 'end' \| 'center' \| 'space-between'` | `'start'` | Alignment of the menu items within the navigation bar. |
| `activeUrl` | `string` | `''` | Active url for automatic selection. |
| `searchable` | `boolean` | `false` | Enables a search input for the vertical navigation. |
| `searchPlaceholder` | `string` | `'Search...'` | Placeholder text for the search input. |
| `emptyText` | `string` | `'No results found'` | Text shown when no items match the filter. |
| `submenuSearchable` | `boolean` | `false` | Whether submenu popovers should include a filter input. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leNavItemSelect` | `EventEmitter<LeNavigationItemSelectDetail>` | Fired when a navigation item is activated.  This event is cancelable. Call `event.preventDefault()` to prevent default browser navigation and implement custom routing. |
| `leNavItemToggle` | `EventEmitter<LeNavigationItemToggleDetail>` | Fired when a tree branch is toggled. |

### Slots

| Name | Description |
|------|-------------|
| `"hamburger-trigger"` | Custom trigger contents for the hamburger button |
| `"more-trigger"` | Custom trigger contents for the "More" button |

---

## <le-number-input>

A number input component with validation, keyboard controls, and custom spinners.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `value` | `number` |  | The value of the input |
| `name` | `string` |  | The name of the input |
| `label` | `string` |  | Label for the input |
| `placeholder` | `string` |  | Placeholder text |
| `min` | `number \| undefined` |  | Minimum allowed value |
| `max` | `number \| undefined` |  | Maximum allowed value |
| `step` | `number` | `1` | Step value for increment/decrement |
| `required` | `boolean` | `false` | Whether the input is required |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `readonly` | `boolean` | `false` | Whether the input is read-only |
| `iconStart` | `string \| undefined` |  | Icon for the start icon |
| `showSpinners` | `boolean` | `true` | Whether to show the spinner controls |
| `externalId` | `string` |  | External ID for linking with external systems |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leChange` | `EventEmitter<{ value: number; name: string; externalId: string; isValid: boolean }>` | Emitted when the value changes (on blur or Enter) |
| `leInput` | `EventEmitter<{ value: number; name: string; externalId: string; isValid: boolean }>` | Emitted when the input value changes (on keystroke/spin) |

### Slots

| Name | Description |
|------|-------------|
| Default | The label text for the input |
| `"description"` | Additional description text displayed below the input |
| `"icon-start"` | Icon to display at the start of the input |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-input-bg` | Input background color |
| `--le-input-color` | Input text color |
| `--le-input-border` | Input border style |
| `--le-input-border-focus` | Input border style when focused |
| `--le-input-border-error` | Input border style when invalid |
| `--le-input-radius` | Input border radius |
| `--le-input-padding` | Input padding |

---

## <le-popover>

A popover component for displaying floating content.

Uses the native HTML Popover API for proper layering with dialogs
and other top-layer elements. Falls back gracefully in older browsers.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `mode` | `'default' \| 'admin'` |  | Mode of the popover should be 'default' for internal use |
| `open` | `boolean` | `false` | Whether the popover is currently open |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'bottom'` | Position of the popover relative to its trigger |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment of the popover |
| `popoverTitle` | `string \| undefined` |  | Optional title for the popover header |
| `showClose` | `boolean` | `true` | Whether to show a close button in the header |
| `closeOnClickOutside` | `boolean` | `true` | Whether clicking outside closes the popover |
| `closeOnEscape` | `boolean` | `true` | Whether pressing Escape closes the popover |
| `offset` | `number` | `8` | Offset from the trigger element (in pixels) |
| `width` | `string \| undefined` |  | Fixed width for the popover (e.g., '300px', '20rem') |
| `minWidth` | `string \| undefined` | `'200px'` | Minimum width for the popover (e.g., '200px', '15rem') |
| `maxWidth` | `string \| undefined` |  | Maximum width for the popover (e.g., '400px', '25rem') |
| `triggerFullWidth` | `boolean` | `false` | Should the popover's trigger take full width of its container |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `lePopoverOpen` | `EventEmitter<void>` | Emitted when the popover opens |
| `lePopoverClose` | `EventEmitter<void>` | Emitted when the popover closes |

### Slots

| Name | Description |
|------|-------------|
| Default | Content to display inside the popover |
| `"trigger"` | Element that triggers the popover (optional) |

---

## <le-popup>

A flexible popup/dialog component for alerts, confirms, prompts, and custom content.

Uses the native HTML <dialog> element for proper modal behavior, accessibility,
and focus management. Can be used declaratively in HTML or programmatically
via leAlert(), leConfirm(), lePrompt().

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `mode` | `LeKitMode` | `'default'` | The mode of the Le Kit (e.g., 'default' or 'admin') |
| `open` | `boolean` | `false` | Whether the popup is currently visible |
| `type` | `PopupType` | `'alert'` | Type of popup: alert (OK only), confirm (OK/Cancel), prompt (input + OK/Cancel), custom |
| `popupTitle` | `string \| undefined` |  | Optional title for the popup header |
| `message` | `string \| undefined` |  | Message text to display (for alert/confirm/prompt types) |
| `modal` | `boolean` | `true` | Whether the popup is modal (blocks interaction with page behind) |
| `position` | `PopupPosition` | `'center'` | Position of the popup on screen |
| `confirmText` | `string` | `'OK'` | Text for the confirm/OK button |
| `cancelText` | `string` | `'Cancel'` | Text for the cancel button |
| `placeholder` | `string` | `''` | Placeholder text for prompt input |
| `defaultValue` | `string` | `''` | Default value for prompt input |
| `closeOnBackdrop` | `boolean` | `true` | Whether clicking the backdrop closes the popup (modal only) |
| `inputValue` | `string` | `''` | Internal state for prompt input value |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leConfirm` | `EventEmitter<PopupResult>` | Emitted when the popup is confirmed (OK clicked) |
| `leCancel` | `EventEmitter<PopupResult>` | Emitted when the popup is cancelled (Cancel clicked or dismissed) |
| `leOpen` | `EventEmitter<void>` | Emitted when the popup opens |
| `leClose` | `EventEmitter<PopupResult>` | Emitted when the popup closes |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for custom body content |
| `"header"` | Custom header content (replaces title) |
| `"footer"` | Custom footer content (replaces default buttons) |

---

## <le-round-progress>

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `value` | `number` | `0` |  |
| `padding` | `number` | `0` |  |
| `paths` | `string` |  |  |
| `progressPaths` | `any[]` |  |  |
| `params` | `{
    width: number;
    diameter: number;
    circumference: number;
  }` |  |  |

---

## <le-scroll-progress>

Displays scroll progress as a simple bar.

If `track-scroll-progress` is present without a value, tracks the full document.
If it is a selector string, tracks progress within the matched element.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `trackScrollProgress` | `string \| undefined` |  | Boolean or selector string. |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-scroll-progress-height` | Bar height |
| `--le-scroll-progress-bg` | Track background |
| `--le-scroll-progress-fill` | Fill color |
| `--le-scroll-progress-sticky-top` | If sticky, stop position to parent top |
| `--le-scroll-progress-fixed-top` | If fixed, distance from window top |
| `--le-scroll-progress-fixed-left` | If fixed, distance from window left |
| `--le-scroll-progress-fixed-right` | If fixed, distance from window right |
| `--le-scroll-progress-z` | Z-index of the progress bar (1001 by default, above header) |

---

## <le-segmented-control>

A segmented control component (iOS-style toggle buttons).

Perfect for toggling between a small set of related options.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `options` | `LeOption[]` | `[]` | Array of options for the segmented control. |
| `value` | `LeOptionValue \| undefined` |  | The value of the currently selected option. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the control. |
| `overflow` | `'auto' \| 'hidden' \| 'visible' \| 'scroll'` | `'auto'` | Scroll behavior for overflowing tabs. |
| `fullWidth` | `boolean` | `false` | Whether the control should take full width. |
| `disabled` | `boolean` | `false` | Whether the control is disabled. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leChange` | `EventEmitter<LeOptionSelectDetail>` | Emitted when the selection changes. |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-segmented-bg` | Background color of the control |
| `--le-segmented-padding` | Padding around segments |
| `--le-segmented-gap` | Gap between segments |
| `--le-segmented-radius` | Border radius of the control |

---

## <le-select>

A select dropdown component for single selection.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `options` | `LeOption[] \| string` | `[]` | The options to display in the dropdown. |
| `value` | `LeOptionValue \| undefined` |  | The currently selected value. |
| `placeholder` | `string` | `'Select an option'` | Placeholder text when no option is selected. |
| `disabled` | `boolean` | `false` | Whether the select is disabled. |
| `required` | `boolean` | `false` | Whether selection is required. |
| `name` | `string \| undefined` |  | Name attribute for form submission. |
| `fullWidth` | `boolean` | `false` | Whether the select should take full width of its container. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant of the select. |
| `variant` | `'default' \| 'outlined' \| 'solid'` | `'default'` | Visual variant of the select. |
| `searchable` | `boolean` | `false` | Whether the input is searchable. |
| `emptyText` | `string` | `'No results found'` | Text to show when no options match the search. |
| `open` | `boolean` | `false` | Whether the dropdown is currently open. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `change` | `EventEmitter<LeOptionSelectDetail>` | Emitted when the selected value changes. |
| `leOpen` | `EventEmitter<void>` | Emitted when the dropdown opens. |
| `leClose` | `EventEmitter<void>` | Emitted when the dropdown closes. |

---

## <le-side-panel>

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `panelId` | `string \| undefined` |  | Optional id used to match toggle requests. If set, the panel only responds to toggle events with the same `panelId`. |
| `side` | `LeSidePanelSide` | `'start'` | Which side the panel is attached to. |
| `collapseAt` | `string \| undefined` |  | Width breakpoint (in px or a CSS var like `--le-breakpoint-md`) below which the panel enters "narrow" mode. |
| `narrowBehavior` | `LeSidePanelNarrowBehavior` | `'overlay'` | Behavior when in narrow mode. |
| `open` | `boolean` | `false` | Panel open state for narrow mode. - overlay: controls modal drawer visibility - push: controls whether panel is shown (non-modal) |
| `collapsed` | `boolean` | `false` | Panel collapsed state for wide mode (fully hidden). |
| `panelWidth` | `number` | `280` | Default panel width in pixels. |
| `minPanelWidth` | `number` | `220` | Minimum allowed width when resizable. |
| `maxPanelWidth` | `number` | `420` | Maximum allowed width when resizable. |
| `resizable` | `boolean` | `false` | Allows users to resize the panel by dragging its edge. |
| `persistKey` | `string \| undefined` |  | When set, panel width + collapsed state are persisted in localStorage. |
| `showCloseButton` | `boolean` | `true` | Show a close button inside the panel (primarily used in narrow overlay mode). |
| `autoShowOnWide` | `boolean` | `true` | When crossing to wide mode, automatically show the panel (collapsed=false). |
| `autoHideOnNarrow` | `boolean` | `true` | When crossing to narrow mode, automatically hide the panel (open=false). |
| `panelLabel` | `string` | `'Navigation'` | Accessible label for the panel navigation region. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leSidePanelOpenChange` | `EventEmitter<{ open: boolean; panelId?: string }>` |  |
| `leSidePanelCollapsedChange` | `EventEmitter<{ collapsed: boolean; panelId?: string }>` |  |
| `leSidePanelWidthChange` | `EventEmitter<{ width: number; panelId?: string }>` |  |

---

## <le-side-panel-toggle>

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `panelId` | `string \| undefined` |  | Optional id used to target a specific panel. |
| `action` | `LeSidePanelToggleAction` | `'toggle'` | Action to emit. Default toggles the panel. |
| `shortcut` | `string \| undefined` |  | Optional keyboard shortcut like `Mod+B` or `Alt+N`. |
| `disabled` | `boolean` | `false` | Disables the toggle. |
| `mode` | `'default' \| 'admin'` |  |  |
| `variant` | `'solid' \| 'outlined' \| 'clear' \| 'system'` | `'solid'` |  |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` |  |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` |  |
| `selected` | `boolean` | `false` |  |
| `fullWidth` | `boolean` | `false` |  |
| `iconOnly` | `string \| Node \| undefined` |  |  |
| `iconStart` | `string \| Node \| undefined` |  |  |
| `iconEnd` | `string \| Node \| undefined` |  |  |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` |  |
| `href` | `string \| undefined` |  |  |
| `target` | `string \| undefined` |  |  |
| `align` | `'start' \| 'center' \| 'space-between' \| 'end'` | `'center'` |  |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leSidePanelRequestToggle` | `EventEmitter<LeSidePanelRequestToggleDetail>` |  |

---

## <le-slot>

Slot placeholder component for admin/CMS mode.

This component renders a visual placeholder for slots when in admin mode,
allowing CMS systems to show available drop zones for content or inline editing.

In non-admin mode, this component renders nothing and acts as a passthrough.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `type` | `'slot' \| 'text' \| 'textarea'` | `'slot'` | The type of slot content. - `slot`: Default, shows a dropzone for components (default) - `text`: Shows a single-line text input - `textarea`: Shows a multi-line text area |
| `name` | `string` | `''` | The name of the slot this placeholder represents. Should match the slot name in the parent component. |
| `label` | `string \| undefined` |  | Label to display in admin mode. If not provided, the slot name will be used. |
| `description` | `string \| undefined` |  | Description of what content this slot accepts. Shown in admin mode to guide content editors. |
| `allowedComponents` | `string \| undefined` |  | Comma-separated list of allowed component tags for this slot. Used by CMS to filter available components. |
| `multiple` | `boolean` | `true` | Whether multiple components can be dropped in this slot. |
| `required` | `boolean` | `false` | Whether this slot is required to have content. |
| `placeholder` | `string \| undefined` |  | Placeholder text for text/textarea inputs in admin mode. |
| `tag` | `string \| undefined` |  | The HTML tag to create when there's no slotted element. Used with type="text" or type="textarea" to auto-create elements. |
| `slotStyle` | `string \| undefined` |  | CSS styles for the slot dropzone container. Useful for layouts - e.g., "flex-direction: row" for horizontal stacks. Only applies in admin mode for type="slot". |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leSlotChange` | `EventEmitter<{ name: string; value: string; isValid: boolean }>` | Emitted when text content changes in admin mode. The event detail contains the new text value and validity. |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for placeholder content or drop zone UI |

---

## <le-stack>

A flexible stack layout component using CSS flexbox.

`le-stack` arranges its children in a row (horizontal) or column (vertical)
with configurable spacing, alignment, and wrapping behavior. Perfect for
creating responsive layouts.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction of the stack layout |
| `gap` | `string \| undefined` |  | Gap between items (CSS value like '8px', '1rem', 'var(--le-space-md)') |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'` | `'stretch'` | Alignment of items on the cross axis |
| `justify` | `'start' \| 'center' \| 'end' \| 'space-between' \| 'space-around' \| 'space-evenly'` | `'start'` | Distribution of items on the main axis |
| `wrap` | `boolean` | `false` | Whether items should wrap to multiple lines |
| `alignContent` | `'start' \| 'center' \| 'end' \| 'stretch' \| 'space-between' \| 'space-around'` | `'stretch'` | Alignment of wrapped lines (only applies when wrap is true) |
| `reverse` | `boolean` | `false` | Whether to reverse the order of items |
| `maxItems` | `number \| undefined` |  | Maximum number of items allowed in the stack (for CMS validation) |
| `fullWidth` | `boolean` | `false` | Whether the stack should take full width of its container |
| `fullHeight` | `boolean` | `false` | Whether the stack should take full height of its container |
| `padding` | `string \| undefined` |  | Padding inside the stack container (CSS value) |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for stack items (le-box components recommended) |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-stack-gap` | Gap between items (defaults to var(--le-space-md)) |

---

## <le-string-input>

A text input component with support for labels, descriptions, icons, and external IDs.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `inputRef` | `(el: HTMLInputElement) => void \| undefined` |  | Pass the ref of the input element to the parent component |
| `mode` | `'default' \| 'admin'` |  | Mode of the popover should be 'default' for internal use |
| `value` | `string` |  | The value of the input |
| `name` | `string` |  | The name of the input |
| `type` | `'text' \| 'email' \| 'password' \| 'tel' \| 'url'` | `'text'` | The type of the input (text, email, password, etc.) |
| `label` | `string` |  | Label for the input |
| `iconStart` | `string` |  | Icon for the start icon |
| `iconEnd` | `string` |  | Icon for the end icon |
| `placeholder` | `string` |  | Placeholder text |
| `hideDescription` | `boolean` | `false` | Hide description slot |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `readonly` | `boolean` | `false` | Whether the input is read-only |
| `externalId` | `string` |  | External ID for linking with external systems |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `change` | `EventEmitter<{
    value: string;
    name: string;
    externalId: string;
  }>` | Emitted when the value changes (on blur or Enter) |
| `input` | `EventEmitter<{
    value: string;
    name: string;
    externalId: string;
  }>` | Emitted when the input value changes (on keystroke) |

### Slots

| Name | Description |
|------|-------------|
| Default | The label text for the input |
| `"description"` | Additional description text displayed below the input |
| `"icon-start"` | Icon to display at the start of the input |
| `"icon-end"` | Icon to display at the end of the input |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-input-bg` | Input background color |
| `--le-input-color` | Input text color |
| `--le-input-border` | Input border style |
| `--le-input-border-focus` | Input border style when focused |
| `--le-input-radius` | Input border radius |
| `--le-input-padding` | Input padding |

---

## <le-tab>

A flexible tab component with multiple variants and states.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `mode` | `'default' \| 'admin'` |  | Mode of the popover should be 'default' for internal use |
| `label` | `string \| undefined` |  | Label if it is not provided via slot |
| `value` | `string \| undefined` |  | Value of the tab, defaults to label if not provided |
| `variant` | `'underlined' \| 'solid' \| 'pills' \| 'enclosed' \| 'icon-only'` | `'underlined'` | Tab variant style |
| `position` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Position of the tabs when used within a le-tabs component |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Tab size |
| `focusable` | `boolean` | `true` | Whether the tab can get focus needed for accessibility when used in custom tab implementations |
| `selected` | `boolean` | `false` | Whether the tab is in a selected/active state |
| `fullWidth` | `boolean` | `false` | Whether the tab takes full width of its container |
| `icon` | `string \| Node \| undefined` |  | Icon only tab image or emoji if this prop is set, the tab will render only the icon slot |
| `showLabel` | `boolean` | `false` | Whether to show the label when in icon-only mode |
| `iconStart` | `string \| Node \| undefined` |  | Start icon image or emoji |
| `iconEnd` | `string \| Node \| undefined` |  | End icon image or emoji |
| `disabled` | `boolean` | `false` | Whether the tab is disabled |
| `href` | `string \| undefined` |  | Optional href to make the tab act as a link |
| `target` | `string \| undefined` |  | Link target when href is set |
| `align` | `'start' \| 'center' \| 'space-between' \| 'end'` | `'center'` | Alignment of the tab label without the end icon |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `click` | `EventEmitter<PointerEvent>` | Emitted when the tab is clicked. This is a custom event that wraps the native click but ensures the target is the le-tab. |

### Slots

| Name | Description |
|------|-------------|
| Default | Tab text content |
| `"icon-only"` | Icon for icon-only tabs |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-tab-bg` | Tab background color |
| `--le-tab-color` | Tab text color |
| `--le-tab-border-radius` | Tab border radius |
| `--le-tab-padding-x` | Tab horizontal padding |
| `--le-tab-padding-y` | Tab vertical padding |

---

## <le-tab-bar>

A presentational tab bar component without panels.

Use this for navigation/routing scenarios where you manage the content
externally based on the selection events. For tabs with built-in panels,
use `le-tabs` instead.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `tabs` | `LeOption[]` | `[]` | Array of tab options defining the tabs to display. |
| `selected` | `LeOptionValue \| undefined` |  | The value of the currently selected tab. |
| `fullWidth` | `boolean` | `true` | Whether tabs should stretch to fill available width. |
| `showLabels` | `boolean` | `false` | Whether to show labels in icon-only mode. |
| `position` | `'top' \| 'bottom'` | `'top'` | Position of the tab bar. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the tabs. |
| `bordered` | `boolean` | `true` | Whether to show a border below the tab bar. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leTabChange` | `EventEmitter<LeOptionSelectDetail>` | Emitted when the selected tab changes. |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-tab-bar-border-color` | Border color |
| `--le-tab-bar-gap` | Gap between tabs |
| `--le-tab-bar-indicator-color` | Active indicator color |
| `--le-tab-bar-padding-x` | Horizontal padding for tabs |
| `--le-tab-bar-padding-y` | Vertical padding for tabs |

---

## <le-tab-panel>

A tab panel component used as a child of le-tabs.

Each le-tab-panel defines both the tab button label and the panel content.
The parent le-tabs component automatically reads these panels and creates
the tab interface.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLLeTabPanelElement` |  |  |
| `label` | `string` |  | The label displayed in the tab button. |
| `value` | `string \| undefined` |  | The value used to identify this tab. Defaults to the label if not provided. |
| `iconStart` | `string \| undefined` |  | Icon displayed at the start of the tab button. Can be an emoji, URL, or icon class. |
| `iconEnd` | `string \| undefined` |  | Icon displayed at the end of the tab button. |
| `disabled` | `boolean` | `false` | Whether this tab is disabled. |
| `lazy` | `boolean` | `false` | Whether to render the panel content only when active (lazy loading). When true, content is not rendered until the tab is first selected. When false (default), content is always in DOM but hidden when inactive. |
| `active` | `boolean` | `false` | Internal: Whether this panel is currently active (set by parent le-tabs) |
| `hasBeenActive` | `boolean` | `false` | Internal: Track if panel has ever been activated (for lazy rendering) |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for panel content |

---

## <le-tabs>

A flexible tabs component for organizing content into tabbed panels.

Supports two modes:
1. **Declarative**: Use `<le-tab-panel>` children to define tabs and content
2. **Programmatic**: Use the `tabs` prop with named slots for content

Full keyboard navigation and ARIA support included.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `tabs` | `LeOption[]` | `[]` | Array of tab options (programmatic mode). If le-tab-panel children exist, they take precedence. |
| `selected` | `LeOptionValue \| undefined` |  | The value of the currently selected tab. If not provided, defaults to the first tab. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientation of the tabs. |
| `position` | `'start' \| 'end'` | `'start'` | Position of the tabs relative to the panels. |
| `variant` | `'underlined' \| 'solid' \| 'pills' \| 'enclosed' \| 'icon-only'` | `'underlined'` | Tab variant style. |
| `fullWidth` | `boolean` | `false` | Whether tabs should stretch to fill available width. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the tabs. |
| `wrap` | `boolean` | `false` | Wrap the tabs if they exceed container width. |
| `overflow` | `'auto' \| 'hidden' \| 'visible' \| 'scroll'` | `'auto'` | Scroll behavior for overflowing tabs. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leTabChange` | `EventEmitter<LeOptionSelectDetail>` | Emitted when the selected tab changes. |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for le-tab-panel children (declarative mode) |
| `"panel-{value}"` | Named slots for panel content (programmatic mode) |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-tabs-border-color` | Border color for tab list |
| `--le-tabs-gap` | Gap between tabs |
| `--le-tabs-indicator-color` | Active tab indicator color |
| `--le-tabs-padding-x` | Horizontal padding for tab buttons |
| `--le-tabs-padding-y` | Vertical padding for tab buttons |

---

## <le-tag>

A tag/chip component for displaying labels with optional dismiss functionality.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` |  | The text label to display in the tag. |
| `mode` | `'default' \| 'admin'` |  | Mode of the popover should be 'default' for internal use |
| `icon` | `string \| undefined` |  | Icon to display before the label. Can be an emoji, URL, or icon name. |
| `dismissible` | `boolean` | `false` | Whether the tag can be dismissed (shows close button). |
| `disabled` | `boolean` | `false` | Whether the tag is disabled. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | The size of the tag. |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | The visual variant of the tag. |

### Events

| Event | Type | Description |
|-------|------|-------------|
| `leDismiss` | `EventEmitter<void>` | Emitted when the dismiss button is clicked. |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for custom content (overrides label prop) |

---

## <le-text>

A text component with rich text editing capabilities in admin mode.

`le-text` renders semantic text elements (headings, paragraphs, code, quotes)
and provides a Notion-like rich text editor in admin mode with formatting
toolbar for bold, italic, links, and paragraph type selection.

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `variant` | `\| 'p'
    \| 'h1'
    \| 'h2'
    \| 'h3'
    \| 'h4'
    \| 'h5'
    \| 'h6'
    \| 'code'
    \| 'quote'
    \| 'label'
    \| 'small'` | `'p'` | The semantic variant/type of text element |
| `align` | `'left' \| 'center' \| 'right' \| 'justify'` | `'left'` | Text alignment |
| `color` | `string \| undefined` |  | Text color (CSS value or theme token) |
| `truncate` | `boolean` | `false` | Whether the text should truncate with ellipsis |
| `maxLines` | `number \| undefined` |  | Maximum number of lines before truncating (requires truncate=true) |

### Slots

| Name | Description |
|------|-------------|
| Default | Default slot for text content |

### CSS Variables

| Name | Description |
|------|-------------|
| `--le-text-color` | Text color |
| `--le-text-font-size` | Font size |
| `--le-text-line-height` | Line height |
| `--le-text-font-weight` | Font weight |

---

## <le-turntable>

### Properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `el` | `HTMLElement` |  |  |
| `center` | `string` | `'center'` |  |
| `value` | `number` | `0` |  |
| `rotating` | `boolean` | `false` | Internal state  using properties instead of |
| `centerX` | `number` |  |  |
| `centerY` | `number` |  |  |
| `pageX` | `number` |  |  |
| `pageY` | `number` |  |  |
| `currentAngle` | `number` | `0` |  |
| `startAngle` | `number` |  |  |

---

