# UI 가이드: AI 뉴스 수집기

앱 이름은 **AI 뉴스 수집기**이며, 메인 화면은 뉴스를 카드로 보여 주는 대시보드다. 스타일링은 Tailwind CSS 4 유틸리티 클래스만 사용한다(별도 CSS 파일에 컴포넌트 스타일을 추가하지 않는다). 기능 요구사항은 [PRD.md](PRD.md)를 따른다.

## 1. 디자인 원칙

- **깔끔함**: 흰 배경, 얇은 테두리, 약한 그림자. 장식 요소를 최소화한다.
- **읽기 편함**: 한국어 본문 기준으로 줄 간격을 넉넉히 두고, 제목과 요약의 위계를 분명히 한다.
- **한 가지 강조색**: 인디고 계열 하나만 강조(버튼, 선택된 카테고리, 링크 hover)에 쓴다.
- **모바일 우선**: 작은 화면에서 먼저 설계하고 `sm`, `lg` 브레이크포인트에서 확장한다.

## 2. 디자인 토큰

| 용도 | 라이트 | 다크 (`dark:`) |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/헤더 배경 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-700` | `dark:text-slate-300` |
| 제목 텍스트 | `text-slate-900` | `dark:text-slate-50` |
| 보조 텍스트 | `text-slate-500` | `dark:text-slate-400` |
| 강조색 | `indigo-600` (hover `indigo-700`) | `dark:indigo-500` |

- 폰트: 시스템 한글 폰트 스택(기본 sans). 본문 `text-sm`~`text-base`, 카드 제목 `text-lg font-semibold`.
- 모서리: 카드 `rounded-xl`, 버튼/칩 `rounded-lg` 또는 `rounded-full`.
- 그림자: 카드 `shadow-sm`, hover 시 `hover:shadow-md`.
- 다크 모드는 `prefers-color-scheme` 기준으로 `dark:` 변형을 사용한다.

## 3. 페이지 레이아웃

```
┌──────────────────────────────────────────────┐
│ 헤더: AI 뉴스 수집기      [뉴스 가져오기] (👤) │
├──────────────────────────────────────────────┤
│ 카테고리: [전체] [모델/연구] [제품/서비스] ... [+ 카테고리 추가] │
├──────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ 뉴스 카드 │ │ 뉴스 카드 │ │ 뉴스 카드 │            │
│ └────────┘ └────────┘ └────────┘            │
└──────────────────────────────────────────────┘
```

- 최상위: `min-h-screen bg-slate-50 dark:bg-slate-950`
- 콘텐츠 컨테이너: `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`
- 섹션 간 간격: `space-y-6`

## 4. 헤더

- 고정 상단: `sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80`
- 높이 `h-16`, 내부는 `flex items-center justify-between`.
- 왼쪽: 앱 이름 "AI 뉴스 수집기" — `text-lg font-bold text-slate-900 dark:text-slate-50`.
- 오른쪽: "뉴스 가져오기" 버튼(주 버튼)과 Clerk 사용자 버튼(`UserButton`).

### 뉴스 가져오기 버튼 상태

| 상태 | 표현 |
|---|---|
| 기본 | 주 버튼 스타일 (아래 6절) |
| 진행 중 | `disabled`, 스피너 + "가져오는 중… (3/10)" 형태로 진행 상황 표시 |
| 완료 | 버튼 아래/옆에 `text-sm text-emerald-600` 로 "N건 추가됨" |
| 일부 실패 | `text-sm text-amber-600` 로 "N건 추가, M건 실패" |

## 5. 카테고리 바 (카드 목록 위)

카드 목록 바로 위에 가로로 한 줄로 배치하고, **맨 끝에 "카테고리 추가" 버튼**을 둔다.

- 컨테이너: `flex flex-wrap items-center gap-2` (좁은 화면에서는 줄바꿈 대신 `overflow-x-auto flex-nowrap` 가로 스크롤을 써도 된다).
- 첫 항목은 항상 **전체**.
- 이어서 사용자의 카테고리 칩들(기본 예시: 모델/연구, 제품/서비스, 투자/비즈니스, 규제/정책, 기타).
- 마지막에 **+ 카테고리 추가** 버튼.

### 카테고리 칩

```html
<!-- 기본 -->
<button class="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
  모델/연구
</button>

<!-- 선택됨 -->
<button aria-pressed="true" class="rounded-full border border-indigo-600 bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white">
  모델/연구
</button>
```

- 선택된 칩은 `aria-pressed="true"`를 설정한다.
- 칩 오른쪽에 건수를 `text-xs opacity-70`로 덧붙일 수 있다(선택 사항).
- 수정/삭제는 칩 hover(또는 모바일 길게 누름) 시 나타나는 작은 메뉴로 제공한다. 삭제 시 "기사는 '기타'로 이동됩니다" 확인 문구를 보여 준다.

### 카테고리 추가 버튼

점선 테두리로 칩과 구분하되 같은 크기를 유지한다.

```html
<button class="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400">
  <span aria-hidden="true">+</span> 카테고리 추가
</button>
```

- 클릭하면 이름 입력 필드가 칩 자리에서 인라인으로 열리거나 작은 모달이 뜬다. Enter로 저장, Esc로 취소.
- 입력 필드: `rounded-full border border-slate-300 px-3.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`.
- 빈 이름과 중복 이름은 저장하지 않고 `text-xs text-red-600` 로 사유를 표시한다.

## 6. 공통 버튼

```html
<!-- 주 버튼 -->
<button class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
  뉴스 가져오기
</button>

<!-- 보조 버튼 -->
<button class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
  Notion 저장
</button>
```

- 모든 버튼에 키보드 포커스 표시(`focus-visible`)를 유지한다.
- 비활성/진행 중 상태는 `disabled`와 `disabled:` 스타일을 함께 쓴다.

## 7. 뉴스 카드

### 그리드

- 목록: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- 모바일은 1열, 태블릿 2열, 데스크톱 3열.

### 카드 구조

표시 항목(PRD 5.4): 카테고리 태그, 한국어 제목, 요약, 출처, 발행일, 원문 링크, Notion 저장 버튼.

```html
<article class="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
  <!-- 상단: 카테고리 태그 + 출처/날짜 -->
  <div class="flex items-center justify-between gap-2">
    <span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">모델/연구</span>
    <span class="text-xs text-slate-500 dark:text-slate-400">TechCrunch · 2026.10.17</span>
  </div>

  <!-- 제목 -->
  <h2 class="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
    한국어 제목
  </h2>

  <!-- 요약 -->
  <p class="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
    한국어 요약
  </p>

  <!-- 하단 액션 (카드 하단 고정) -->
  <div class="mt-auto flex items-center justify-between pt-4">
    <a href="…" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">원문 보기 ↗</a>
    <button class="…보조 버튼…">Notion 저장</button>
  </div>
</article>
```

- 제목은 최대 3줄(`line-clamp-3`), 요약은 최대 4줄(`line-clamp-4`)로 줄여 카드 높이를 맞춘다.
- 원문 링크는 새 탭으로 열고 `rel="noopener noreferrer"`를 붙인다.
- 카드 전체가 아니라 링크/버튼만 클릭 가능하게 한다.

### Notion 저장 버튼 상태

| 상태 | 표현 |
|---|---|
| 미저장 | 보조 버튼 "Notion 저장" |
| 저장 중 | `disabled` + 작은 스피너, "저장 중…" |
| 저장 완료 | `text-emerald-600` 체크 + "저장됨", 클릭 불가(중복 저장 방지). `notion_page_url`이 있으면 "저장됨"을 해당 페이지 링크로 연결 |
| 실패 | `text-red-600` "저장 실패 · 다시 시도" |

## 8. 상태 화면

- **로딩**: 카드 모양의 스켈레톤(`animate-pulse`, `bg-slate-200 dark:bg-slate-800` 블록) 6개.
- **빈 상태(뉴스 없음)**: 가운데 정렬 안내 — "아직 가져온 뉴스가 없어요" + 주 버튼 "뉴스 가져오기".
- **빈 상태(해당 카테고리에 기사 없음)**: "이 카테고리에는 기사가 없어요" (`text-slate-500`).
- **오류**: 목록 위에 `rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700` 배너.
- **부분 실패**: 수집 완료 후 `amber` 배너로 실패 건수를 알린다.

## 9. 반응형 규칙

| 구간 | 동작 |
|---|---|
| 기본 (<640px) | 카드 1열, 헤더는 앱 이름 + 버튼 축약, 카테고리 바는 가로 스크롤 |
| `sm` (≥640px) | 카드 2열 |
| `lg` (≥1024px) | 카드 3열, 컨테이너 `max-w-6xl` |

## 10. 접근성

- 텍스트 대비는 WCAG AA 이상(위 토큰 조합 사용).
- 카테고리 칩은 `button` + `aria-pressed`, 카테고리 바는 `role="group" aria-label="카테고리 필터"`.
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다.
- 진행 상태/결과 메시지는 `aria-live="polite"` 영역에 표시한다.
- 모든 상호작용 요소는 키보드로 접근 가능해야 하며 포커스 링을 숨기지 않는다.

## 11. 구현 메모

- Next.js 16 App Router 기준. 상호작용(카테고리 선택, 가져오기, Notion 저장)이 있는 컴포넌트만 Client Component로 두고, 나머지는 Server Component로 유지한다.
- 권장 컴포넌트 분리: `Header`, `CategoryBar`, `NewsCard`, `NewsGrid`, `EmptyState`.
- 날짜는 `YYYY.MM.DD` 형식의 한국 시간 기준으로 표시한다.
