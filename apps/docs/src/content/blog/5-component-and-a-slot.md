---
title: What are <le-component> and <le-slot>
description: Two components that are adding all the editing magic
publishDate: 2025-12-05
published: true
tags:
  - components
  - development
---

## What you need to change the properties of a component?

Now that we have already the manifest, we can start to think about how to use it. The main idea was to build an editor that will be able to read the manifest and build the needed UI for editing the props of the component.

But what if... we can have a component that read the manifest and will be able to show the UI for editing the props?

## &lt;le-component>

This is what the **`<le-component>`** is. A component that takes the tag name of the component as a prop, and then reads the manifest to find out what are the props of that component, and then renders the UI for editing those props.

Here's a simplified example of how it can be used in a button component:

```html
<le-component tag="le-button">
  <button {...attributes}>
    <le-slot name="" description="Button text" type="text">
      <slot></slot>
    </le-slot>
  </button>
</le-component>
```

And here's how it looks now with the component itself (for you it may be a much more improved version, since I'll use a component from the current version of Le-Kit, hope it will still work for you):

<div mode="admin" style="display: flex; justify-content: center;">
  <le-button variant="outlined">Outlined Button</le-button>
</div>

So how I was able to show the UI for editing the props of the button component? The answer is simple, if you take a look at the code of this post, you will see, that I have set a special attribute on the container:

```html
<div mode="admin">
  <le-button variant="outlined">Outlined Button</le-button>
</div>
```

This is the `mode="admin"` attribute, this is a special attribute that we use to tell the components that they are in edit mode, and they should show the UI for editing the props. The `<le-component>` is watching up the HTML tree, looking for the nearest parent with the `mode` attribute, and when it finds it, can switch to the edit mode and show the UI for editing the props.

Let's take a look at one more example... with a switch this time:

<div id="admin-demo" style="display: flex; gap: 12px; align-items: center; justify-content: center;">
  <le-button variant="outlined">Outlined Button</le-button>
  <le-checkbox onchange="document.getElementById('admin-demo').setAttribute('mode', event.detail.checked ? 'admin' : '');">Admin mode</le-checkbox>
</div>

Oops... I put the checkbox inside the admin container, so it is also affected by the admin mode, too! But that's good, because it shows that the `<le-component>` is working as expected for both of the components. And you were able to see the slots in the checkbox component, too. You can edit not just the label, but also the description. And the checkbox is working all this time!

## &lt;le-slot>

The **`<le-slot>`** is a component that is used to define a slot for the component. It takes the name of the slot, the description, and the type of the slot as props, and then renders the UI for editing the content of the slot.

And if the slot supports nesting, i. e. you can put other components inside it, you will see a small plus button, that will show you which components you can put inside this slot, and when you select one, it will be added to the slot.

Here's and example of another yet to be finished component **`<le-stack>`** that is used to stack the components horizontally or vertically, where you can add other components inside it.

<div mode="admin" id="admin-demo-2" style="display: flex; justify-content: center;">
  <le-stack direction="horizontal" gap="12px">
    <le-box>
      <le-button variant="outlined">Outlined Button</le-button>
    </le-box>
    <le-box>
      <le-checkbox checked onchange="document.getElementById('admin-demo-2').setAttribute('mode', event.detail.checked ? 'admin' : '');">Admin mode</le-checkbox>
    </le-box>
  </le-stack>
</div>

Slots that can have nested components, have the **`type`** property set to **`slot`**, and there is a plus button that shows the allowed components that can be added to this slot, which is defined by the `allowed-components` property.

```html
<le-slot
  name=""
  description="Content inside this flex item"
  type="slot"
  allowed-components="le-text,le-card,le-button,le-stack,le-box"
></le-slot>
```
