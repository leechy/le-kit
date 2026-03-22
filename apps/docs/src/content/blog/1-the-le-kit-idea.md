---
title: The Le-Kit Idea
description: The history that stays behind the creation of this component library, and where it is going.
publishDate: 2025-11-17
published: true
tags:
  - ideas
  - stories
---

## The origin

At the very end of XX century, I think it was the fall of 1999, I was working at Art. Lebedev Studio in Moscow, and me and my colleagues came with the idea to create a CMS to speed up our work on websites.

The idea was based on already existing admin pages, we've been creating for every major client, to build a single system that will work the same for everyone, and will follow the simple logic: bunch of pages, related in a tree, each one have some system info, like title and slug, and the content is just blocks of different types, like text, images, HTML, XML, etc. All of that is combined in a giant XML, transformed with XSLT into HTML, and that's what we send to the browser.

The key part here are the blocks. They not just have content, but also they have specific system names, and we can apply different XSLT templates to them. That was our component system. And it was a huge success. It allowed us to create websites much faster, and also to maintain them much easier. And it was a few years before the WordPress was created.

## The problem

Our components, the so-called Blocks, were a great deal. To create a title, insert an image, and even to have HTML-formatted text... with tables. But if you have some specific component with different types of data binded together, or blocks nested inside other blocks, there were only one option — XML. Non-visual, hard to edit, and not very intuitive. Not something you can give to a client and say: "Here you go, edit your website with this". It was more like: "Here you go, send us an email with the changes you want, and we will do it for you".

After all, we ended up with splitting the admin into two parts: one, where the devs were editing the blocks with XML, and the other, where the clients were editing some parts of the content with a WYSIWYG editor or specially prepared forms for the complex components.

## Web components and the data structure

In the 2010s, and I've switched to all kinds of SPAs, forgetting about the content websites. And alongside all the frameworks, like Backbone, Angular, React, Svelte, etc., the web components were evolving in the background. Just when Ionic 4 came out, I was thinking “What a wonderful idea, finally you can use these components in a rich text editor, as HTML!”. That would've solved the issue. Having a way to insert custom components inside the contenteditable, a way to edit their content, have 'em' nested multiple levels deep, and all of that with a visual representation, that's a dream.

And that's how the idea of Le-Kit was born. A set of web components, that can be used in a contenteditable, to create rich content with custom components, and all of that with a visual representation.

## Isn't it too late?

Finally, now, 26 years later, I have a chance to help in a small studio supporting a few content websites. Websites built with WordPress. And have to deal with the same issue! With bunch of plugins trying to solve the same problem — how to manage content in custom elements?

With no viable solution I was able to find, I'm happy to finally have some time to start experimenting with the custom components.

I've built a... button. And added a menu to it have to change it's variant (solid, outlined, clear). And it's working! I think that is showing a lot of promise. It would be a long journey, though.

## So what is the main idea

The idea itself is to create a set of web components, can be used in a, probably special, contenteditable component, exposing to the editor their props and content. The editor will be able to render them, and also to provide some UI for editing.

That's basically it. And just figured out that the first thing to do is to find out how to expose the props and content to the editor.

Stay tuned...
