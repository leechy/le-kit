# le-header-title



<!-- Auto Generated Below -->


## Overview

Shows a "smart" header title based on what has scrolled out of view.

When `selector` matches multiple elements, the title becomes the last element
(top-to-bottom) that has fully scrolled out above the viewport.

## Properties

| Property   | Attribute  | Description                                                                    | Type     | Default |
| ---------- | ---------- | ------------------------------------------------------------------------------ | -------- | ------- |
| `selector` | `selector` | CSS selector for page title/headings to watch (e.g. `.page-title`, `main h2`). | `string` | `''`    |


## Slots

| Slot | Description                                             |
| ---- | ------------------------------------------------------- |
|      | Optional fallback content if no watched title is active |


## Shadow Parts

| Part      | Description |
| --------- | ----------- |
| `"title"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
