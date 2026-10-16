import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { articles, categories } from "./schema";

// Sample data only. Replace with a real Clerk user ID to see it in the app.
const USER_ID = process.env.SEED_USER_ID ?? "user_sample_001";

const categorySeeds = [
  { name: "모델/연구", description: "새로운 AI 모델과 연구 성과" },
  { name: "제품/서비스", description: "AI 제품 출시와 업데이트" },
  { name: "산업/투자", description: "기업 동향, 투자, 인수합병" },
  { name: "기타", description: "분류되지 않은 기사" },
];

const articleSeeds = [
  {
    category: "모델/연구",
    source: "TechCrunch",
    publishedAt: "2026-10-14T09:00:00Z",
    url: "https://techcrunch.com/2026/10/14/sample-open-weight-reasoning-model/",
    originalTitle:
      "Startup unveils open-weight reasoning model that rivals frontier labs",
    titleKo: "스타트업, 선도 연구소에 견줄 오픈 웨이트 추론 모델 공개",
    summaryKo:
      "한 AI 스타트업이 오픈 웨이트 방식의 추론 특화 모델을 공개했다. 수학·코딩 벤치마크에서 대형 연구소의 최신 모델에 근접한 점수를 기록했고, 상업적 이용도 허용한다. 소규모 팀도 자체 서버에서 고성능 추론 모델을 운영할 수 있게 됐다는 평가가 나온다.",
  },
  {
    category: "제품/서비스",
    source: "The Verge",
    publishedAt: "2026-10-13T14:30:00Z",
    url: "https://www.theverge.com/2026/10/13/sample-docs-ai-meeting-summaries",
    originalTitle:
      "Google adds AI meeting summaries to Docs for all Workspace users",
    titleKo: "구글, 모든 워크스페이스 사용자에게 문서 내 AI 회의 요약 기능 제공",
    summaryKo:
      "구글이 Docs에서 회의 녹취를 자동으로 요약하고 할 일 목록까지 뽑아 주는 기능을 전체 워크스페이스 사용자에게 열었다. 기존에는 일부 유료 요금제에서만 쓸 수 있었다. 회의록 작성 시간을 크게 줄일 것으로 기대된다.",
  },
  {
    category: "산업/투자",
    source: "TechCrunch",
    publishedAt: "2026-10-12T11:15:00Z",
    url: "https://techcrunch.com/2026/10/12/sample-ai-chip-startup-raises-400m/",
    originalTitle:
      "AI chip startup raises $400M as demand for inference hardware surges",
    titleKo: "AI 칩 스타트업, 추론용 하드웨어 수요 급증 속에 4억 달러 유치",
    summaryKo:
      "추론 전용 칩을 개발하는 스타트업이 4억 달러 규모 투자를 받았다. AI 서비스 이용이 늘면서 학습보다 추론 비용이 더 큰 부담이 되고 있고, 투자자들은 저전력·저비용 추론 칩 시장이 빠르게 커질 것으로 본다.",
  },
  {
    category: "기타",
    source: "The Verge",
    publishedAt: "2026-10-11T16:45:00Z",
    url: "https://www.theverge.com/2026/10/11/sample-ai-political-ads-disclosure",
    originalTitle:
      "Lawmakers debate new disclosure rules for AI-generated political ads",
    titleKo: "의회, AI 생성 정치 광고의 공개 표시 의무화 논의",
    summaryKo:
      "의원들이 AI로 만든 정치 광고에 생성물 표시를 의무화하는 법안을 논의했다. 딥페이크가 선거에 미치는 영향을 막자는 취지지만, 표현의 자유 침해 우려와 집행 방법을 두고 의견이 갈린다.",
  },
  {
    category: "모델/연구",
    source: "TechCrunch",
    publishedAt: "2026-10-10T08:20:00Z",
    url: "https://techcrunch.com/2026/10/10/sample-small-models-better-data",
    originalTitle:
      "Researchers show small models can match larger ones with better training data",
    titleKo: "연구진, 더 나은 학습 데이터로 소형 모델이 대형 모델에 필적할 수 있음을 입증",
    summaryKo:
      "연구팀이 정제된 고품질 데이터로 학습하면 훨씬 작은 모델도 대형 모델과 비슷한 성능을 낼 수 있다는 결과를 발표했다. 모델 크기를 키우는 것보다 데이터 품질에 투자하는 쪽이 비용 효율적일 수 있다는 시사점을 준다.",
  },
];

async function main() {
  await db
    .insert(categories)
    .values(categorySeeds.map((c) => ({ ...c, userId: USER_ID })))
    .onConflictDoNothing();

  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(
      and(
        eq(categories.userId, USER_ID),
        inArray(
          categories.name,
          categorySeeds.map((c) => c.name),
        ),
      ),
    );
  const categoryIds = new Map(rows.map((r) => [r.name, r.id]));

  await db
    .insert(articles)
    .values(
      articleSeeds.map(({ category, publishedAt, ...a }) => ({
        ...a,
        userId: USER_ID,
        publishedAt: new Date(publishedAt),
        categoryId: categoryIds.get(category) ?? null,
      })),
    )
    .onConflictDoNothing();

  console.log(
    `Seeded for ${USER_ID}: ${categorySeeds.length} categories, ${articleSeeds.length} articles`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
