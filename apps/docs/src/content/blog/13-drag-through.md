---
title: Drag Through — the missing behavior
description: The interaction is so natural, it is surprising how little support it has over the other component libraries.
publishDate: 2026-09-01
published: true
tags:
  - behavior
  - components
  - mobile
  - development
---

The idea is really simple and is implemented in all the OS interfaces: the user clicks on a menu button or a dropdown field, the popover with the items in it opens and the user contimues to drag the mouse through the items to select them. When the user releases the mouse button, the selected item is activated.

Interactions like this were part of the desktop OSes, but starting with the Apple's Liquid Glass design language, where the action sheets has been replaced by popovers appearing under the users' fingers, it is becoming a more common pattern on the mobile too.

Usually, the same behavior is expected from the web components with similar functionality, but it is suprisingly rarely implemented. And when it is, it is not covering all the components that can share the same interaction model. For example in Material (MUI) you have it for [Selects](https://mui.com/material-ui/react-select/), but not for the [Menus](https://mui.com/material-ui/react-menu/), which doesn't make sense.

I think the main reason is that the interaction is not actually written as a requirement, and the developers are implementing when they see the need in it, instead of implementing it by default, and leaving the users with the "wrong" behavior.

## Le-Kit implementation

In Le-Kit I'm implementing the drag-through mechanics in all the components that can benefit from it: the dropdowns and menus.

But keep in mind that all of them are based on `<le-popover>` component, where we don't want to have the drag-through by default, we need to enable it explicitly. So if you create your own component based on `<le-popover>` you need to enable it yourself.

Let's have a few examples.

### `<le-select>`

Select with drag-through support. You can press down the select and drag to the desired item to select it with one gesture.

<div class="component-example">
  <div style="width: 300px">
    <le-select full-width>
      <le-item value="apple">Apple</le-item>
      <le-item value="banana">Banana</le-item>
      <le-item value="orange">Orange</le-item>
    </le-select>
  </div>
</div>

### `<le-multiselect>`

Since multiselect gives you to select more than one item, the dropdown is not closed automatically and you can continue to select more items.

Notice that the dropdown scrolls automatically when you drag near the boundaries of the dropdown.

<div class="component-example">
  <div style="width: 300px">
    <le-multiselect full-width>
      <le-item value="apple">Apple</le-item>
      <le-item value="banana">Banana</le-item>
      <le-item value="orange">Orange</le-item>
      <le-item value="grape">Grape</le-item>
      <le-item value="kiwi">Kiwi</le-item>
      <le-item value="melon">Melon</le-item>
      <le-item value="orange">Orange</le-item>
      <le-item value="peach">Peach</le-item>
      <le-item value="plum">Plum</le-item>
      <le-item value="raspberry">Raspberry</le-item>
      <le-item value="strawberry">Strawberry</le-item>
      <le-item value="watermelon">Watermelon</le-item>
    </le-multiselect>
  </div>
</div>

### `<le-overflow-menu>`

The overflow menus are implementing the same mechanics.

<div class="component-example">
  <le-overflow-menu items='[
    {"label": "Apple", "value": "apple"},
    {"label": "Banana", "value": "banana"},
    {"label": "Orange", "value": "orange"},
    {"label": "Grape", "value": "grape"},
    {"label": "Kiwi", "value": "kiwi"},
    {"label": "Melon", "value": "melon"},
    {"label": "Orange", "value": "orange"},
    {"label": "Peach", "value": "peach"},
    {"label": "Plum", "value": "plum"},
    {"label": "Raspberry", "value": "raspberry"},
    {"label": "Strawberry", "value": "strawberry"},
    {"label": "Watermelon", "value": "watermelon"}
  ]'></le-overflow-menu>
</div>

### `<le-context-menu>`

Even when activated with a right click, or even a long press on touch interfaces, the drag-through interaction is the prefered way to interact with the context menus.

<div class="component-example">
  <le-context-menu
    backdrop
    position="bottom"
    align="center"
    items='[
      {"label": "Apple", "value": "apple"},
      {"label": "Banana", "value": "banana"},
      {"label": "Orange", "value": "orange"},
      {"label": "Grape", "value": "grape"},
      {"label": "Kiwi", "value": "kiwi"},
      {"label": "Melon", "value": "melon"},
      {"label": "Orange", "value": "orange"},
      {"label": "Peach", "value": "peach"},
      {"label": "Plum", "value": "plum"},
      {"label": "Raspberry", "value": "raspberry"},
      {"label": "Strawberry", "value": "strawberry"},
      {"label": "Watermelon", "value": "watermelon"}
    ]'>
    <div style="padding: var(--le-space-md); border: 1px solid var(--le-color-border); border-radius: var(--le-radius-md); text-align: center; background: var(--le-color-surface);">
      Right-Click / Long-Press (Backdrop)
    </div>
  </le-context-menu>
</div>


## Also worth mentioning...

The usual pattern: `click-to-open` <le-icon name="arrow-right"></le-icon> `select-the-item` <le-icon name="arrow-right"></le-icon> `click-on-the-item` is still perfectly working. You can use them both.

And also, I'm turning off the scrolling of the page while dragging-through the menues and selects with a finger. After the release, the scrolling should be back as usual.
