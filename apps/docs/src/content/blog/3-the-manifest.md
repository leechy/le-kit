---
title: Custom Elements Manifest
description: A standard way to describe custom elements in a machine-readable format, and how it can help with building an editor.
publishDate: 2025-12-03
published: true
tags:
  - ai
  - development
---

If you want to create an editor that can understand any custom component, that the user wants to use, you need to have a way to describe those components in a machine-readable format.

I've just found out how the documentation systems like Storybook and Style Dictionary are doing that, and it turns out that there is a standard for that — the [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/blog/intro/).

The Custom Elements Manifest is a JSON file that describes the custom elements in a project. It includes information about the tag name, properties, events, slots, and more. This file can be generated automatically by tools like Stencil.js, and it can be used by other tools to understand how to use the custom elements.

And it's the ideal tool in terms of DX: you just write your components, and the manifest is generated for you. You just create a config where you say where are your components and where to write the output JSON file. And add the `cem` command to your build scripts!

Can't wait to see what will be possible to do with it. Looking at it, I think I have everything needed to edit the props of a component. Here, you can take a look yourself:

```
{
  "schemaVersion": "1.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/le-card/le-card.tsx",
      "declarations": [
        {
          "kind": "class",
          "name": "LeCard",
          "tagName": "le-card",
          "events": [],
          "customElement": true,
          "description": "A flexible card component with header, content, and footer slots...",
          "cssProperties": [
            {
              "description": "Card background color",
              "name": "--le-card-bg"
            },
            {
              "description": "Card border radius",
              "name": "--le-card-border-radius"
            },
            {
              "description": "Card box shadow",
              "name": "--le-card-shadow"
            },
            {
              "description": "Card content padding",
              "name": "--le-card-padding"
            }
          ],
          "cssParts": [
            {
              "description": "The main card container",
              "name": "card"
            },
            {
              "description": "The card header section",
              "name": "header"
            },
            {
              "description": "The card content section",
              "name": "content"
            },
            {
              "description": "The card footer section",
              "name": "footer"
            }
          ],
          "slots": [
            {
              "description": "Card header content (title, actions)",
              "name": "header"
            },
            {
              "description": "Default slot for main card content",
              "name": ""
            },
            {
              "description": "Card footer content (buttons, links)",
              "name": "footer"
            }
          ],
          "attributes": [
            {
              "name": "variant",
              "fieldName": "variant",
              "default": "'default'",
              "description": "Card variant style",
              "type": {
                "text": "'default' | 'outlined' | 'elevated'"
              }
            },
            {
              "name": "interactive",
              "fieldName": "interactive",
              "default": "false",
              "description": "Whether the card is interactive (clickable)",
              "type": {
                "text": "boolean"
              }
            }
          ]
        }
      ]
    }
  ]
}
```
