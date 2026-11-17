import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/**
 * Component page content lives next to each component in packages/core:
 * `src/components/<tag>/<tag>.page.md`. The entry id is the tag.
 */
const componentPages = defineCollection({
  loader: glob({
    pattern: "*/*.page.md",
    base: "../../packages/core/src/components",
    generateId: ({ entry }) => entry.split("/")[0],
  }),
  schema: z.object({
    tag: z.string(),
    tagline: z.string(),
    hero: z.string(),
    heroDirection: z.enum(["row", "column"]).default("row"),
    /** Hero share of the overview: narrow ~1/3, half, wide ~2/3, full = own row above the text. */
    heroWidth: z.enum(["narrow", "half", "wide", "full"]).default("half"),
    whenToUse: z.array(z.string()),
    whenNotToUse: z.array(z.string()),
    recipes: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          note: z.string(),
          html: z.string(),
        }),
      )
      .min(1),
  }),
});

export const collections = {
  blog,
  componentPages,
};
