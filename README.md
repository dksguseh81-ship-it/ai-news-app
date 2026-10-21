# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude가 한국어 번역·요약·카테고리 분류를 한 뒤 카드로 보여주는 웹 앱입니다. 마음에 드는 뉴스는 Notion 데이터베이스에 저장할 수 있습니다.

## 주요 기능

- **뉴스 가져오기**: 버튼을 누를 때만 TechCrunch AI, The Verge AI 피드에서 최근 24시간 기사(피드당 최대 10건)를 수집합니다. 이미 저장된 URL은 Claude를 호출하기 전에 건너뜁니다.
- **AI 처리**: 기사마다 Claude를 한 번 호출해 한국어 제목, 한국어 요약, 카테고리를 JSON으로 받습니다. 일부 기사가 실패해도 나머지는 계속 처리하고 실패 건수를 알려 줍니다.
- **카테고리 관리**: 사용자별로 추가·수정·삭제할 수 있습니다. 바꿔도 기존 기사는 다시 분류하지 않고, 삭제한 카테고리의 기사는 "기타"로 옮겨집니다.
- **Notion 저장**: 카드의 "뉴스 저장" 버튼으로 기사 1건을 Notion 데이터베이스에 저장합니다. 저장 후에는 "저장됨" 링크로 바뀌며 중복 저장은 막습니다.
- **로그인**: Clerk 로그인이 필요하며, 모든 데이터는 사용자 ID 기준으로 분리됩니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 |
| 인증 | Clerk |
| DB | Neon Postgres, Drizzle ORM |
| AI | Claude API (`@anthropic-ai/sdk`) |
| Notion 연동 | 공식 `@notionhq/notion-mcp-server` + `@modelcontextprotocol/sdk` (stdio) |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다. 모두 서버 전용이며 `NEXT_PUBLIC_` 접두사가 붙은 Clerk 공개 키만 클라이언트에 노출됩니다.

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon Postgres
DATABASE_URL=

# Claude
ANTHROPIC_API_KEY=

# Notion
NOTION_API_TOKEN=      # Internal integration 토큰 (ntn_...)
NOTION_DATABASE_ID=    # 저장할 데이터베이스 ID (주소에서 ?v= 앞의 32자리)
```

`.env.local`은 gitignore 대상이라 커밋되지 않습니다.

### 3. 데이터베이스

```bash
npm run db:push        # 스키마를 DB에 반영
npm run db:seed        # (선택) 샘플 카테고리·기사 생성. SEED_USER_ID에 Clerk 사용자 ID를 지정하지 않으면 화면에 보이지 않음
```

### 4. 실행

```bash
npm run dev            # http://localhost:3000
```

## Notion 설정

1. [notion.so/profile/integrations](https://www.notion.so/profile/integrations)에서 Internal integration을 만들고 콘텐츠 읽기·삽입·업데이트 권한을 줍니다. 발급된 토큰을 `NOTION_API_TOKEN`에 넣습니다.
2. 저장할 데이터베이스를 만들고, 데이터베이스 페이지의 ··· → **Connections**에서 위 통합을 연결합니다. 연결하지 않으면 404가 납니다.
3. 데이터베이스에 아래 속성을 이름 그대로 만듭니다.

   | 속성 | 유형 | 저장되는 값 |
   |---|---|---|
   | 제목 | 제목 | 한국어 제목 |
   | 요약 | 텍스트 | 한국어 요약 |
   | 카테고리 | 선택 | 분류 결과 |
   | 날짜 | 날짜 | 발행일 |
   | 출처 | URL | 원문 링크 |

   매체 이름과 영어 원제는 속성이 아니라 페이지 본문에 기록됩니다. 속성 이름을 바꾸려면 [src/lib/notion/save-article.ts](src/lib/notion/save-article.ts)의 `PROP` 상수를 함께 수정하세요.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm run start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm run db:generate` / `db:migrate` / `db:push` | Drizzle 마이그레이션 |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | 샘플 카테고리·기사 시드 |

## 프로젝트 구조

```
src/
├─ app/
│  ├─ dashboard/        # 대시보드 페이지와 서버 액션 (뉴스 가져오기, 카테고리, Notion 저장)
│  └─ page.tsx          # 로그인 화면 (로그인 상태면 대시보드로 이동)
├─ components/          # 뉴스 카드, 카테고리 바, 저장 버튼 등
├─ db/                  # Drizzle 스키마와 연결
└─ lib/
   ├─ rss/              # 피드 소스와 파서
   ├─ ai/               # Claude 번역·요약·분류
   └─ notion/           # Notion MCP 클라이언트
```

기획은 [PRD.md](PRD.md), UI 가이드는 [ui.md](ui.md)를 참고하세요.

## 알아둘 점

- Notion 저장은 호출할 때마다 MCP 서버를 자식 프로세스(stdio)로 띄웁니다. 로컬에서는 잘 동작하지만 Vercel 같은 서버리스 환경에서는 제약이 있을 수 있어 배포 전 확인이 필요합니다.
- 보안 프로그램이 HTTPS를 가로채는 환경에서 인증서 오류가 나지 않도록 MCP 서버에 `--use-system-ca`를 적용해 두었습니다.
- 자동·정기 수집, 소스 관리 UI, 일괄 Notion 저장은 이번 버전의 범위가 아닙니다.

## 사용한 플러그인

- Frontend Design: UI 디자인 품질 향상
- commit-commands: 깃 워크플로 자동화
