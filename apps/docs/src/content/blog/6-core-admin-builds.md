---
title: Separate builds for admin and public - postponed for now
description: I see the need for separate builds for the admin interface and the public websites, but the implementation is not that easy as I thought it would be
publishDate: 2025-12-14
published: true
tags:
  - builds
  - development
---

The last few days I was trying to create a build system that is able to output different builds for different use cases. For example, a build for the admin interface, and a build for the public websites.

The difference between these builds is that the admin build includes the code for the editing UI, and the public build does not include it. This way we can keep the public build as small as possible, and only include the code that is needed for the public websites.

## Why we need more than one build?

I've noticed that the components I'm creating lately are pretty heavy. Having `<le-component>` and `<le-slot>` inside every component, even the smallest ones, is really questionable, when we're talking about production environments. So I thought, let's create a build with the same components, but without `<le-component>` and `<le-slot>`. Literally, let's remove them from the code and create a new build!

## Styles issue

At a first glance, removing should've been pretty easy. These components are just placeholders and a wrapper. No component logic was applied to them. And after some time the initial script was ready: copy the `src` folder to a new folder called `src-core`; use regexp to remove the closing, opening, and self-closing tags and... that's it.

And then I've realized that almost any `<le-component>` was also a container. And many of them had styles applied to them. And if they are removed, weird things are happening with the components. especially components where the contents should maintain 100% of the height of the parent, or flexboxes.

So, I had to refactor most of the components, not to apply any styles to the `<le-component>`, or to have some inner container if it was possible. And that was a good thing to do, but not an easy one.

## How to build several packages

This was just the start of the journey. Next one was the build system, used by Stencil.js and how the components are pushed to npm.

This part was not that hard, when I was reading the documentation. But when I started to implement it, no variant of the exports was working as expected. For now this version lives in a branch `feature/core-admin-builds`, and I will return to it when the more important features are implemented.

If any of you have experience with Stencil.js and building several packages with it, please let me know, maybe we can find a solution together!
