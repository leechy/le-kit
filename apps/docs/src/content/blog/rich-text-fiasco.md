---
title: Rish text editor fiasco
description: A story of how I tried to build a rich text editor for Le-Kit, using AI and how it turned out to be a complete disaster
publishDate: 2025-12-08
published: false
tags:
  - components
  - development
---

## Chasing the dream of a perfect rich text editor

For the last week, together with Claude Opus 4.5, we built a lot of components for Le-Kit. A lot of cool stuff, like the dropdowns, and a lot of not-really-useful stuff, like the `<le-text>`.

In attempt to build a proper **`<le-text>`** component, with good formatting options, I decided to build a rich text editor. Claude helped me a lot with the implementation of the other components, and I thought that it will be a good idea to use it for that.

The first attempt was a silly copy of any other HTML editor out there with a toolbar on top, and a contenteditable div below. And I wanted something like... Notion.

## Interface
