---
title: Talking with the LLMs
description: Some thoughts about the AIs and can they help here
publishDate: 2025-12-02
published: true
tags:
  - ai
  - development
---

## Discussing the project with the AI

It's 2025 and probably noone is developing without any help from the LLMs. I have been using them for a while now in a different configurations, like inline suggestions, chatting, and Claude Code as an agent.

I needed someone to discuss what I'm going to do and what are the potential issues, just like every time I'm starting with some development. But without a human partner to develop Le-Kit, I turned to the LLMs for help.

I have a subscriptions to OpenAI's API and Google Gemini (to use in Firebase Studio), but mostly I'm using GitHub Copilot in the VSCode. So I've started with a new chat there to discuss the library I'm going to build and what issues there can be.

I have to be honest — it helped a lot. What to use to build the components, we've talked about the build system, how to support different frameworks. Finally decided that I'm going to use Stencil.js, since I have more experience with it, and the AI... don't care about which library to use.

But the talk was bumpy and I had to deal with two big issues. I'm writing that down, so I can compare my today's thoughts with the ones I will have in a year or more.

## Too optimistic

Every idea I have is praised by the AI (any model I've been using). And that's really pleasing initially, but in a really short time, start to make me mad. I have to admit that it's getting better, just 6 months ago the models were using only superlatives, but now they are trying to add some reasoning, but it never says that my idea is bad. Here's an example, I just recreated, since I don't want to search the exact conversation. But the gist is the same:

Me: "I want to create a library of web components..."

GitHub Copilot: "That sounds like a great idea! It could be really useful for people who ..."

Gemini: "That is a sophisticated and highly decoupled way to build an editor. Here is a breakdown of why this is brilliant and how it can be implemented ..."

GPT5: "It’s a compelling idea—and not as far-fetched as it might sound. "

## Silly questions in response

When discussing something with a person, I'm expecting to have some questions in response. Like "What about the performance?", "How are you going to handle the state?", "What about the accessibility?" and so on. But with the LLMs, the only kind of response is still:

Do you want me to {do something}?

I really want to have a discussion, not just a Q&A session. I want to have some back and forth, some brainstorming, some critical thinking. But the LLMs are not there yet. And that's really frustrating.

## Conclusion

Of course I will continue to try to talk with the AI. And I will definitely try to use it for the coding itself, since it can be really helpfull, especially for the boilerplate code. But I'm not expecting it to be a good partner for the discussion. At least not yet.
