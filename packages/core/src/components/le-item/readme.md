# le-item



<!-- Auto Generated Below -->


## Overview

A headless component used to declaratively define items for LeKit navigation, lists, and select components.
This component does not render any visible UI. It is designed to be parsed by parent components
into the universal `LeOption` data structure.

## Properties

| Property      | Attribute     | Description                                                 | Type                  | Default     |
| ------------- | ------------- | ----------------------------------------------------------- | --------------------- | ----------- |
| `checked`     | `checked`     | Whether the option is checked.                              | `boolean`             | `undefined` |
| `description` | `description` | Secondary description text displayed below the label.       | `string`              | `undefined` |
| `disabled`    | `disabled`    | Whether the option is disabled and cannot be selected.      | `boolean`             | `undefined` |
| `group`       | `group`       | Group label for categorizing options in flat lists.         | `string`              | `undefined` |
| `href`        | `href`        | URL to navigate to when the option is selected.             | `string`              | `undefined` |
| `icon`        | `icon`        | Main icon, used in the tab bar or as a start icon in menus. | `string`              | `undefined` |
| `iconEnd`     | `icon-end`    | Icon displayed at the end (right) of the option.            | `string`              | `undefined` |
| `iconStart`   | `icon-start`  | Icon displayed at the start (left) of the option.           | `string`              | `undefined` |
| `label`       | `label`       | Display text for the option (required).                     | `string`              | `undefined` |
| `open`        | `open`        | Whether a hierarchical option is expanded (open).           | `boolean`             | `undefined` |
| `partConfig`  | `part-config` | Optional part tokens for styling from outside shadow DOM.   | `string`              | `undefined` |
| `selected`    | `selected`    | Whether the option is currently selected.                   | `boolean`             | `undefined` |
| `separator`   | `separator`   | Add a visual separator line before or after this option.    | `"after" \| "before"` | `undefined` |
| `value`       | `value`       | Selection value. Defaults to label if not provided.         | `number \| string`    | `undefined` |


## Methods

### `getOption() => Promise<LeOption>`

Serialize this component and its children into a `LeOption` object.

#### Returns

Type: `Promise<LeOption>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
