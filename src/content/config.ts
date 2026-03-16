import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      date: z.union([z.string(), z.date()]).transform(val => {
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        return val;
      }),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      author: z.string().optional(),
      image: image().optional(),
      featured: z.boolean().default(false),
    }),
});

export const collections = { articles };
