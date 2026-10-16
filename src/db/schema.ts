import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("categories_user_name_idx").on(t.userId, t.name)],
);

export const articles = pgTable(
  "articles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(),
    url: text().notNull(),
    originalTitle: text("original_title").notNull(),
    titleKo: text("title_ko").notNull(),
    summaryKo: text("summary_ko").notNull(),
    source: text().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Deleting a category is handled in app code (move to "기타");
    // set null is only a safety net so the delete never fails on the FK.
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    notionSaved: boolean("notion_saved").notNull().default(false),
    notionPageUrl: text("notion_page_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("articles_user_url_idx").on(t.userId, t.url),
    index("articles_user_published_idx").on(t.userId, t.publishedAt),
    index("articles_category_idx").on(t.categoryId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
