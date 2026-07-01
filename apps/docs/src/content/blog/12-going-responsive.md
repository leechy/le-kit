---
title: Going Responsive
description: The development of Le-Kit is taking a new direction, focusing on responsive components that work on any device.
publishDate: 2026-07-01
published: true
tags:
  - ideas
  - components
  - responsive
  - development
---


After [`<le-toolbar>`](/components/le-toolbar) started to take shape, I started to think, that maybe I should create more components like it. And my focus was shifted to create more... not interactive, but I would say, more responsive-aware components. The components that I miss the most when I am building a new project, that should be, mobile-first, but also work as a native on the desktop, and even the emerging folding devices.

## What will change?

The main idea from the editable components will move to the components that can fit any device. Core package will be focused on correct behavior and performance. And that means that the components' edititng part should be removed from it.

I will keep the editable components `<le-component>` and `<le-slot>`. They will go to the special package `le-kit/admin`, and the components there will be using them to in the CMS editor. And the `admin` package will be updated together with the core components.

## Responsive components

Expect more responsive and adaptive components to come: `<le-list>`, `<le-app>`, and many of the existing will be refactored to be more adaptive to different platform, like `<le-tooltip>` should work with touch on long-press, instead of hover, etc.

## API

Components' API will be changed too. The goal is to have more consistent behavior across all components. The same behavior should be triggered by the same props. Events naming should be build on the common principles. And so on.

## Theming

And just after the `<le-list>` component a big work on the theming will be done. There is no proper theming for now, and we need good way to create not just color schemes for the light and dark mode, but also custom button sizes for the touch and mouse, layout differences between platforms, etc.

*Keep an eye on the home page for more updates!*