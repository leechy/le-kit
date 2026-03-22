---
title: Theming Thoughts
description: Introducing the ideas behind theming and how it can be implemented in Le-Kit.
publishDate: 2025-12-04
published: true
tags:
  - ideas
  - styles
  - development
---

## Is theming still a thing these days?

You know, I was thinking why Tailwind is so popular. And despite a lot of people are saying that this way the styles are more maintainable, and that the CSS in a normal project is a mess, and the it's about the performance and the size of the CSS files, I think that the main reason is because people are lazy. It's easier to learn a totally new way to write styles, than to switch to the CSS file in your editor, or even scroll down to the styles in the same file.

I do remember when a lot of people were against CSS when it first came out. They preferred to use `<font>` to change the text color instead of using CSS. `<dd>` was a common way to set a margin. And tables were used everywhere, when more complex margins or paddings were needed.

And more. Even if you have Tailwind already, devs still don't want to change the styles if they are not forced to, by the design team, or by the project requirements. Take a look at many of the service websites, and you can see that they are all the same — components from **shadcn** without any changes in the styles.

And that's not bad. That just shows that we should have really good default styles. Maybe even a few themes, like light and dark, but the main point is that they should be good enough to be used without any changes.

## Styling Le-Kit components

Ok, first it should work by connecting a css file with the theme variables and additional styles. I'm betting on variables, because they are working best with the shadow DOM. They are good for nesting — easily overrideable on many levels.

Still have to find out what will be the performance if we have a lot of variables. The idea is to have a set of variables for each component, and then have some global variables for the common styles, like colors, typography, spacing, etc. And the components will use the global variables, when needed, which should be able to be overridden by the theme/user variables.

Parts are the second way to go deep in the shadow DOM. To be able to do some specific styling for some specific part of the component. For example, one of the items in a list should have a different background color.

## Le-Kit Designer

Final idea is to build a tool, that will allow to update existing or create new themes in the browser, and then export the CSS file with the variables.

A set of predefined pages with all (most of the) components, and a side panel where you can change the variables and see the result in real time. And then export the CSS file with the variables.

How 'bout that?
