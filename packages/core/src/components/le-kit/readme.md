# le-kit



<!-- Auto Generated Below -->


## Overview

Optional app-level context orchestrator for theme, appearance, and active state.

Components continue to work without this wrapper; `le-kit` is opt-in.

## Properties

| Property        | Attribute        | Description                                                                       | Type                     | Default              |
| --------------- | ---------------- | --------------------------------------------------------------------------------- | ------------------------ | -------------------- |
| `activeContext` | `active-context` | Current active context scope value.                                               | `"active" \| "inactive"` | `'active'`           |
| `appearance`    | `appearance`     | Current appearance scope value.                                                   | `string`                 | `'default'`          |
| `persist`       | `persist`        | Persistence keys as a space-separated list: `all`, `none`, `theme`, `appearance`. | `string`                 | `'theme appearance'` |
| `storageKey`    | `storage-key`    | Local storage namespace for persisted values.                                     | `string`                 | `'le-kit'`           |
| `theme`         | `theme`          | Current theme scope value.                                                        | `string`                 | `'default'`          |
| `watchModals`   | `watch-modals`   | Whether this instance reacts to descendant modal popup open/close events.         | `boolean`                | `true`               |
| `watchWindow`   | `watch-window`   | Whether this instance reacts to window focus/blur.                                | `boolean`                | `true`               |


## Methods

### `setActiveContext(ctx: LeActiveContext) => Promise<void>`



#### Parameters

| Name  | Type                     | Description |
| ----- | ------------------------ | ----------- |
| `ctx` | `"active" \| "inactive"` |             |

#### Returns

Type: `Promise<void>`



### `setAppearance(appearance: string) => Promise<void>`



#### Parameters

| Name         | Type     | Description |
| ------------ | -------- | ----------- |
| `appearance` | `string` |             |

#### Returns

Type: `Promise<void>`



### `setTheme(theme: string) => Promise<void>`



#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `theme` | `string` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
