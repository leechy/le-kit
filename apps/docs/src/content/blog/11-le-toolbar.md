---
title: The missing toolbars on the web
description: In modern web applications, toolbars are the components that are avoided most, compared with the native desktop apps. This is because it is hard to create a toolbar behaving like the native ones and there are no good examples how to make it useful. Here's what we did to solve the first part of the problem. For the good examples, you will need to wait a bit more.
publishDate: 2026-05-22
published: true
tags:
  - components
---

## Why and What?

Toolbars are one of the most common UI components on the desktop, but they are surprisingly rare for web applications. And at the same time, we can see how the toolbars are having their rennessance in the mobile apps, with the Apple's Liquid Glass (and everyone else's copy of it) — now you have tools not only in the header but also in the bottom bar.

Thinking about building in the near future `<le-app>` component, that will serve as a root layout component for both desktop and mobile web apps, we knew that we need a good toolbar component. But what is a good toolbar?

Looking at the native toolbars from Microsoft and Apple in their desktop OSes, as well as many other applications, we can see a few common principles:

- toolbars are usually located at the top of the window of the desktop applications, occupy the full width of the window and have a horizontal layout;
- they contain mostly buttons (a good start);
- if not all the buttons are fitting, the overflow is handled by a dropdown menu;
- buttons are wrapping from the end of the toolbar, but sometimes we have ones that are staying at the end and are not hiding in the overflow menu (e.g. the info side panel that appears at the end edge of the app window).

So, in simple terms, we need a horizontal bar that can contain buttons and handle the overflow. Unlike the buggy `<le-bar>`, detecting wrap in the flex layout, that was causing loops of re-rendering on certain screen widths, there was a need for a more robust solution. And instead of improving wrap detection technique, (and after couple of weeks trying to measure correctly the width of the internal components) a different approach with a virtual component was taken.

## The Button Group

Started with `<le-button-group>` — a simple component that can hide some of the buttons in the overflow menu. The component is not handling the measurements itself. Just reacts on the changes in the `collapse` attribute. The logic of which is a subject to think about. There is no other property like that. Take a look:

- When the `collapse` is set empty (`true`), the component is showing only one button and the rest are hidden in the overflow menu.
- When the `collapse` is a positive number, the component is showing that many buttons and the rest are hidden in the overflow menu.
- When the `collapse` is a negative number, the component is showing all buttons except that many from the end, and those are hidden in the overflow menu.

<div class="component-example component-example-horizontal">
  <le-button-group collapse="2" overflow-icons>
    <le-button icon-only="align-left" label="Align Left"></le-button>
    <le-button icon-only="align-center" label="Align Center"></le-button>
    <le-button icon-only="align-right" label="Align Right"></le-button>
    <le-button icon-only="align-justify" label="Justify"></le-button>
  </le-button-group>
</div>

Still not sure how good is this API, but it was a good start to use it later in the toolbar, where the buttons in the groups should be hidden one by one.

Here came the idea that hiding and showing buttons should be animated. Animations usually are a way to get the users' attention, and in this case, it is important to make it clear that some buttons are moved to the overflow menu, and not just disappeared. The animation was handled by a new component `<le-visibility>`. A wrapper, that calculates the full width of the button and uses CSS tranforms to scale, fade and slide the button in and out of view. The component is reusable and can be used in other places as well, not only for the toolbar.

In addition to the animation, the `<le-overflow-menu>` component was developed to handle the collapsed items. It is a simple wrapper around `<le-popover>` and `<le-navigation>` components. But this time some refactoring was done to handle items with icons, and introduce keyboard navigation instead of tabbing through the menu items, which was not working for a dropdown menus.

The last thing was to test the priority of the buttons. Another controversial API. The priority is calculated based on the `priority` attribute, whre the smaller number means higher priority, plus the order of the buttons in the DOM. If the `priority` is not set, the button is treated as the lowest priority.

This is a reverse approach to the API of z-index, for example, and there are some doubts that it is intuitive enough, but it was a good start to have something working and then iterate on the API based on the feedback.

## The Big Measurement

With a working Button Group, the Toolbar was the next step. Initially, it was just a wrapper that should measure the buttons' widths and create a list of steps, which buttons should be hidden at which parent component width. But it turned out that measuring the buttons' widths is not a trivial task and despite all the optimizations, it was not accurate enough, and it was causing some weird loops of re-rendering, and a lot of issues caused by the components loading and collapse animations.

So the decision was made to move the measurement logic to a virtual component, no animations, but just creating a list of steps, how to collapse the items in the bar, based on the priority, and then calculating the width of the toolbar after each step. At the end, applying the current step, based on the actual width of the toolbar. This approach was proven to be more robust and accurate, and it was not causing any issues with the loading and animations.

<div class="component-example">
  <le-preview-frame
    id="demo-toolbar-frame"
    min-width="200"
    min-height="56"
    padding="16"
    handles="left,right"
  >
    <le-toolbar>
      <le-button priority="3">
        <le-icon name="new" slot="icon-start" size="18"></le-icon>
        New
      </le-button>
      <le-button priority="3">
        <le-icon name="open" slot="icon-start" size="18"></le-icon>
        Open
      </le-button>
      <le-toolbar-spacer width="var(--le-space-md)"></le-toolbar-spacer>
      <le-button-group overflow-icons label="History" collapse="2">
        <le-button label="Undo" icon-only="undo"></le-button>
        <le-button label="Redo" icon-only="redo"></le-button>
      </le-button-group>
      <le-toolbar-spacer width="var(--le-space-md)"></le-toolbar-spacer>
      <le-button-group overflow-icons priority="2" label="Text Align">
        <le-button label="Align Left" icon-only="align-left"></le-button>
        <le-button label="Align Center" icon-only="align-center"></le-button>
        <le-button label="Align Right" icon-only="align-right"></le-button>
        <le-button label="Justify" icon-only="align-justify"></le-button>
      </le-button-group>
      <le-toolbar-spacer width="var(--le-space-md)"></le-toolbar-spacer>
      <le-button-group overflow-icons label="Lists">
        <le-button label="Bullet List" icon-only="bullet-list"></le-button>
        <le-button label="Numbered List" icon-only="numbered-list"
        ></le-button>
        <le-button label="Checklist" icon-only="check-list"></le-button>
        <le-button label="Increase Indent" icon-only="increase-indent"
        ></le-button>
        <le-button label="Decrease Indent" icon-only="decrease-indent"
        ></le-button>
      </le-button-group>
      <le-toolbar-spacer></le-toolbar-spacer>
      <le-button color="danger">
        <le-icon name="delete" slot="icon-start" size="20"></le-icon>
        Delete
      </le-button>
    </le-toolbar>
  </le-preview-frame>
</div>

The main problem with that approach is the performance, because until the measurement is done, the toolbar is empty. And it is a noticeable time.

Considering, the toolbar is usually a part of the main layout of the app, and it is not changing that often, it was decided that the performance is acceptable, and it is not causing any issues with the user experience. But it is something to keep in mind for the future iterations.

## What's Next?

There are a vast amount of ideas and new features to be added to the toolbar: dropdowns and input fields, vertical orientation, a way to customize the buttons for the user, attribute to show labels for the toolbar items, and many more. But for now, the main focus was to create a solid foundation for the toolbar, and then iterate on the features based on the feedback and needs of the users.
