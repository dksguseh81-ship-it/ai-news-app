# PRD: AI 뉴스 수집기 (AI News Collector)

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류를 수행해 카드 형태로 보여주는 웹 앱. 사용자는 카테고리별로 뉴스를 골라 보고, 원하는 뉴스를 Notion에 저장할 수 있다.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 파악한다.
- 뉴스를 카테고리별로 자동 정리한다.
- 관심 뉴스를 Notion에 보관한다.

## 3. 사용자 흐름
1. 앱 실행 후 Clerk 로그인 (미로그인 시 접근 차단)
2. "뉴스 가져오기" 버튼 클릭
3. RSS 수집 (TechCrunch AI, The Verge AI)
4. Claude API로 한국어 번역·요약, 카테고리 분류
5. DB 저장 후 카드 목록 표시
6. 카테고리 필터로 골라 보기
7. 카드의 "Notion 저장" 버튼으로 노션에 저장

## 4. 뉴스 소스
| 소스 | RSS URL |
|---|---|
| TechCrunch AI | https://techcrunch.com/category/artificial-intelligence/feed/ |
| The Verge AI | https://www.theverge.com/rss/ai-artificial-intelligence/index.xml |

## 5. 기능 요구사항

### 5.1 인증
- Clerk 로그인 필수. 비로그인 사용자는 로그인 화면으로 이동.
- 데이터는 Clerk 사용자 ID 기준으로 분리.

### 5.2 뉴스 수집
- "뉴스 가져오기" 버튼 클릭 시에만 수집 (자동 스케줄 없음).
- 피드당 최근 N건(기본 10건)만 처리.
- 원문 URL 기준 중복 제거. 이미 저장된 기사는 건너뛰고 Claude를 호출하지 않는다.
- 수집 중 진행 상태(로딩/완료/실패)를 표시.

### 5.3 AI 처리 (Claude API)
- 제목 한국어 번역
- 본문 한국어 요약
- 사용자의 카테고리 목록 중 하나로 자동 분류 (해당 없으면 "기타")
- 한 번의 호출로 번역·요약·분류를 JSON으로 받는다.

### 5.4 뉴스 카드
- 표시 항목: 한국어 제목, 요약, 출처, 발행일, 카테고리 태그, 원문 링크
- "Notion 저장" 버튼 포함. 저장 완료 시 상태 표시(중복 저장 방지).

### 5.5 카테고리 관리
- 카테고리별 필터링 (전체 보기 포함)
- 카테고리 추가·수정·삭제 (나중에도 가능)
- 사용자별 카테고리 관리
- 카테고리 변경 시: 기존 뉴스는 유지하고 새로 가져오는 뉴스부터 새 목록으로 분류. 삭제된 카테고리의 뉴스는 "기타"로 이동.
- 기본 카테고리 예시: 모델/연구, 제품/서비스, 투자/비즈니스, 규제/정책, 기타

### 5.6 Notion 저장
- 선택한 뉴스 1건을 Notion에 저장.
- 저장 항목: 한국어 제목, 요약, 원문 링크, 카테고리, 출처, 발행일
- 노션 MCP 서버를 통해 연동.

## 6. 기술 스택
| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js |
| 로그인 | Clerk |
| DB | Neon (Postgres), Drizzle ORM |
| 번역·요약·분류 | Claude API |
| 노션 저장 | 노션 MCP 서버 |

## 7. 데이터 모델 (초안)
- **categories**: id, user_id, name, description, created_at
- **articles**: id, user_id, url(사용자별 유니크), original_title, title_ko, summary_ko, source, published_at, category_id, notion_saved(boolean), notion_page_url, created_at

## 8. 비기능 요구사항
- API 키(Claude, Notion, Neon, Clerk)는 서버 환경변수로만 관리하고 클라이언트에 노출하지 않는다.
- 서버리스 실행 시간 제한을 고려해 기사 단위로 나눠 처리하거나 진행 상태를 보여준다.
- 일부 기사 처리 실패 시 전체를 중단하지 않고 나머지를 계속 처리하며 실패 건수를 알린다.
- 모바일에서도 카드 목록이 읽기 편해야 한다.

## 9. 미결정 사항
- 노션 MCP 연결 방식: Claude API MCP 커넥터 또는 MCP 클라이언트 SDK, 인증 방식(OAuth/토큰)
- Notion 저장 대상(페이지 또는 데이터베이스)
- RSS 본문이 짧을 때 원문 페이지를 추가로 가져올지 여부
- 피드당 수집 건수(N) 최종값
- 배포 환경 (Vercel 예상)

## 10. 범위 제외 (이번 버전)
- 자동/정기 수집
- 뉴스 소스 추가·관리 UI
- 여러 뉴스 일괄 Notion 저장
- 검색, 북마크, 공유 기능
