---
tag: le-button
tagline: A component you'd expect to see in any UI library. No surprises here.
heroDirection: column
hero: |
  <le-button variant="solid">Save</le-button>
  <le-button variant="outlined" icon-start="✎">Edit</le-button>
  <le-button variant="clear" color="danger">Delete</le-button>
  <le-button variant="outlined" icon-only="⚙️">Settings</le-button>
  <le-button variant="solid" color="success" size="large">Publish</le-button>
# DRAFT — written by Claude, to be reviewed
whenToUse:
  - To trigger an action — save, send, open a dialog, run a command.
  - As a link that should look like a button (set `href`).
  - Inside toolbars and button groups — it collapses and adapts to them.
whenNotToUse:
  - To move between sections of the app — use navigation or tabs.
  - To pick one of a few options — use a segmented control.
  - For a long list of actions — put them in a context or overflow menu.
recipes:
  - id: default
    title: Default
    note: A plain button. It behaves like a native HTML button — it can be focused, submit forms and work with other HTML elements as expected.
    html: <le-button>Click me</le-button>
  - id: onclick
    title: With onclick
    note: Handle the click with the onclick attribute, no JavaScript setup needed.
    html: <le-button onclick="alert('Clicked!')">Click me</le-button>
  - id: variants
    title: Variants
    note: The visual style of the button.
    html: |
      <le-button variant="outlined">Outlined</le-button>
      <le-button variant="solid">Solid</le-button>
      <le-button variant="filled">Filled</le-button>
      <le-button variant="clear">Clear</le-button>
      <le-button variant="system">System</le-button>
  - id: colors
    title: Colors
    note: A semantic color token that tells the purpose of the button.
    html: |
      <le-button color="primary">Primary</le-button>
      <le-button color="secondary">Secondary</le-button>
      <le-button color="success">Success</le-button>
      <le-button color="danger">Danger</le-button>
      <le-button color="warning">Warning</le-button>
      <le-button color="info">Info</le-button>
  - id: sizes
    title: Sizes
    note: Small, medium (default) and large.
    html: |
      <le-button size="small">Small</le-button>
      <le-button size="medium">Medium</le-button>
      <le-button size="large">Large</le-button>
  - id: full-width
    title: Full width
    note: Takes the full width of its container — useful in forms and mobile layouts.
    html: <le-button full-width>Full Width Button</le-button>
  - id: selected
    title: Selected
    note: Highlights the active button in a group. Currently works best with the outlined variant.
    html: |
      <le-button selected variant="outlined">Selected</le-button>
      <le-button variant="outlined">Not Selected</le-button>
  - id: disabled
    title: Disabled
    note: Unclickable, and visually shows that it is not available.
    html: |
      <le-button disabled variant="solid">Solid</le-button>
      <le-button disabled>Default</le-button>
      <le-button disabled variant="clear">Clear</le-button>
  - id: submit
    title: Submit a form
    note: The type attribute works as on the HTML button. Only change it when the button has to submit a form.
    html: |
      <form onsubmit="event.preventDefault(); alert('Submitted!')">
        <le-button type="submit" variant="solid">Submit</le-button>
      </form>
  - id: link
    title: As a link
    note: With href (and target) the button renders as an anchor, with all the styles and behaviors of a button.
    html: <le-button href="https://le-kit.dev" target="_blank">Go to Le-Kit website</le-button>
  - id: icon-start
    title: Icon at the start
    note: Set the icon as a property (handy in frameworks; an emoji works too) or as a slot (handy in plain HTML). The second one is a le-side-panel-toggle — built on le-button — and really toggles the navigation panel on the left.
    html: |
      <le-button icon-start="🏠">Home</le-button>
      <le-side-panel-toggle panel-id="components-navigation" action="toggle" variant="outlined">
        <le-icon slot="icon-start" name="side-panel-start"></le-icon>
        Toggle the Side Panel
      </le-side-panel-toggle>
  - id: icon-end
    title: Icon at the end
    note: Same as icon-start, at the end of the label.
    html: |
      <le-button variant="clear" icon-end="🫆">Log In</le-button>
      <le-button variant="outlined">
        More options
        <le-icon slot="icon-end" name="chevron-down"></le-icon>
      </le-button>
  - id: icon-only
    title: Icon only
    note: With icon-only the label is not shown.
    html: |
      <le-button variant="outlined" icon-only="⚙️">Label Text</le-button>
      <le-button variant="outlined">
        <le-icon slot="icon-only" name="hamburger"></le-icon>
        Label Text
      </le-button>
---

## Properties or slots

A couple of properties can be set either as properties or as slots — the icons. In frameworks it is
often easier to pass them as properties; in plain HTML a slot is easier, and any element (or just an
emoji) works as an icon. Pick what works best for you. Everything that is not in one of the three icon
slots becomes the label of the button.

## The `click` event

`<le-button>` uses the name of the default DOM event — `click`. This is considered bad practice in
many articles and in the Stencil documentation itself (there is even a linter rule against it). But it
is the only way to react to the event with just an attribute, without subscribing in JavaScript. So the
experiments continue.

Subscribing in JavaScript:

```js
const button = document.getElementById('my-button');
button.addEventListener('click', (event) => {
  alert(`Here's the intercepted click: ${event.detail}`);
});
```
