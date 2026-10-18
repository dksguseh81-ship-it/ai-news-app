import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Article } from "@/db/schema";

// Notion 데이터베이스에 만들어 둔 속성 이름과 정확히 일치해야 한다.
const PROP = {
  title: "제목", // title
  summary: "요약", // rich_text
  category: "카테고리", // select
  url: "출처", // url (원문 링크)
  publishedAt: "날짜", // date
} as const;

// rich_text 한 덩어리는 2000자까지만 허용된다.
const RICH_TEXT_MAX = 2000;

const SERVER_BIN = path.join(
  process.cwd(),
  "node_modules",
  "@notionhq",
  "notion-mcp-server",
  "bin",
  "cli.mjs",
);

function text(content: string) {
  return [{ type: "text", text: { content: content.slice(0, RICH_TEXT_MAX) } }];
}

function paragraph(content: string) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: text(content) } };
}

// 호출마다 MCP 서버(stdio)를 띄우고 닫는다. 저장은 사용자가 1건씩 누르는 동작이라 충분하다.
async function withNotion<T>(fn: (call: ToolCaller) => Promise<T>): Promise<T> {
  const token = process.env.NOTION_API_TOKEN;
  if (!token) throw new Error("NOTION_API_TOKEN 환경변수가 설정되지 않았어요.");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_BIN],
    env: {
      PATH: process.env.PATH ?? "",
      NOTION_TOKEN: token,
      // 보안 프로그램이 HTTPS를 가로채는 환경에서도 OS 인증서 저장소를 신뢰하도록 한다.
      NODE_OPTIONS: "--use-system-ca",
    },
  });
  const client = new Client({ name: "ai-news-collector", version: "0.1.0" });
  await client.connect(transport);
  try {
    return await fn(async (name, args) => {
      const res = await client.callTool({ name, arguments: args });
      const content = res.content as { type: string; text?: string }[];
      const body = content.find((c) => c.type === "text")?.text ?? "";
      if (res.isError) throw new Error(`${name} 실패: ${body.slice(0, 300)}`);
      return JSON.parse(body) as Record<string, unknown>;
    });
  } finally {
    await client.close();
  }
}

type ToolCaller = (
  name: string,
  args: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

// 최신 Notion API는 페이지의 부모로 database가 아닌 data source ID를 요구한다.
let dataSourceId: string | undefined;

async function resolveDataSourceId(call: ToolCaller, databaseId: string) {
  if (dataSourceId) return dataSourceId;
  const db = await call("API-retrieve-a-database", { database_id: databaseId });
  const sources = db.data_sources as { id: string }[] | undefined;
  if (!sources?.[0]) throw new Error("데이터베이스에서 data source를 찾지 못했어요.");
  dataSourceId = sources[0].id;
  return dataSourceId;
}

/** 기사 1건을 Notion 데이터베이스에 저장하고 만들어진 페이지 URL을 돌려준다. */
export async function saveArticleToNotion(
  article: Article,
  categoryName: string,
): Promise<string> {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) throw new Error("NOTION_DATABASE_ID 환경변수가 설정되지 않았어요.");

  return withNotion(async (call) => {
    const parentId = await resolveDataSourceId(call, databaseId);

    const properties: Record<string, unknown> = {
      [PROP.title]: { title: text(article.titleKo) },
      [PROP.summary]: { rich_text: text(article.summaryKo) },
      [PROP.category]: { select: { name: categoryName } },
      [PROP.url]: { url: article.url },
    };
    if (article.publishedAt) {
      properties[PROP.publishedAt] = {
        date: { start: article.publishedAt.toISOString() },
      };
    }

    const page = await call("API-post-page", {
      parent: { type: "data_source_id", data_source_id: parentId },
      properties,
      // 속성이 없는 매체 이름과 영어 원제는 본문에 남긴다.
      children: [
        paragraph(`매체: ${article.source}`),
        paragraph(`원제: ${article.originalTitle}`),
      ],
    });
    if (typeof page.url !== "string") {
      throw new Error(`Notion 응답에 페이지 URL이 없어요: ${JSON.stringify(page).slice(0, 400)}`);
    }
    return page.url;
  });
}
