# le-toolbar-spacer



<!-- Auto Generated Below -->


## Overview

Flexible spacer for le-toolbar layouts.

Default behavior (no width): occupies available free space and shrinks naturally.
With numeric `width`: behaves as a fixed-width spacer that can be collapsed by le-toolbar.

## Properties

| Property | Attribute | Description                                                                                                                                        | Type                            | Default     |
| -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------- |
| `width`  | `width`   | Optional fixed width. Numeric values (e.g. `24`) are treated as px. String values may be any valid CSS width (e.g. `2rem`, `var(--le-spacing-2)`). | `number \| string \| undefined` | `undefined` |


## Methods

### `getCollapseMeta() => Promise<LeCollapseMeta>`

Returns collapse meta for toolbar integration.

#### Returns

Type: `Promise<LeCollapseMeta>`




## Shadow Parts

| Part       | Description |
| ---------- | ----------- |
| `"spacer"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
