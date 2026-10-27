# 권윤아 | 그린스마트시티 포트폴리오

상명대학교 그린스마트시티학과 포트폴리오 웹사이트.
**프론트엔드(화면)** 와 **백엔드(데이터 API)** 가 분리되어 있어, 나중에 DB나 외부 API를 붙여도 화면 코드를 고칠 필요가 없습니다.

🔗 배포: https://yoonahkwon.vercel.app

---

## 빠른 시작

```bash
npm install
cp backend/.env.example backend/.env   # SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY 채우기
npm run dev          # http://localhost:4000
```

프론트엔드와 API가 같은 주소에서 함께 뜹니다. 포트폴리오 내용은 Supabase 에서 읽습니다.
DB 없이 시험하려면 `backend/.env` 에서 `DATA_SOURCE=json`, `RESERVATION_STORE=json`.

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (파일 변경 시 자동 재시작) |
| `npm start` | 운영 모드 실행 |
| `npm run sync:fallback` | Supabase 내용 → 프론트 fallback 파일 동기화 (`-- --json` 이면 portfolio.json 에서) |

---

## 화면 구성

1. **첫 장면 (Welcome)** — 이름과 소개 한 줄. 아무 곳이나 누르면 책장으로 넘어갑니다.
2. **책장 (메인)** — 포트폴리오의 각 내용이 한 권의 책입니다. 책을 누르면 펼쳐져 넘겨 볼 수 있습니다.
   소개 · 학력(한 권) · 공모전 출품작(공모전마다 한 권).
   책장 아래에 찾아오는 길(지도 · 주소 · 현재 날씨)이 바로 보입니다.
   책장 아래 [방문 예약하기] 버튼을 누르면 예약 페이지로 이동합니다.
   얇은 회색 · 베이지 책은 장식(관심 태그)입니다.
3. **책 넘기기** — PC 는 두 쪽 펼침, 휴대폰은 한 쪽씩. 책장 끝을 끌거나 ◀ ▶ · 키보드 ← → 로 넘깁니다.

주소에 `#library` 를 붙이면 첫 장면 없이 바로 책장이 열립니다. (https://yoonahkwon.vercel.app/#library)

---

## 폴더 구조

```
.
├── frontend/                    ← 화면 (빌드 도구 없이 네이티브 ES 모듈)
│   ├── index.html               빈 껍데기. 내용은 전부 JS가 채움
│   ├── assets/                  이미지 · 파비콘
│   └── src/
│       ├── css/style.css
│       ├── data/fallback.json   API 장애 시 대신 쓰는 데이터
│       └── js/
│           ├── main.js          진입점: 데이터 로드 → 렌더 → 인터랙션
│           ├── config.js        API 주소 설정
│           ├── api/             서버 통신만 담당
│           │   ├── client.js        fetch 래퍼 (타임아웃 · 에러 처리)
│           │   ├── portfolio.api.js
│           │   └── contact.api.js
│           ├── render/          데이터 → HTML
│           │   ├── welcome.js       첫 장면 (이름 · 소개 한 줄 · "책장 열기")
│           │   ├── library.js       책장 + 책마다 쪽 만들기 (소개 · 학력 · 출품작 · 관심 분야 · 연락처 · 찾아오는 길)
│           │   ├── meta.js          문서 제목 · 설명
│           │   ├── dom.js           공용 헬퍼 (이스케이프 등)
│           │   └── index.js         전체 렌더 실행
│           ├── ui/              애니메이션 · 인터랙션
│           │   ├── welcome.js       첫 장면 ↔ 책장 전환 (#library, 뒤로 가기 지원)
│           │   ├── flipbook.js      책 펼치기 · 넘기기 (그림 쪽 + 글 쪽)
│           │   ├── shelf.js         고른 책 설명 표시
│           │   ├── weather.js       찾아오는 길 책의 현재 날씨
│           │   └── index.js
│           └── vendor/          외부 라이브러리 (StPageFlip, MIT)
│
├── backend/                     ← 데이터 API
│   ├── .env.example
│   └── src/
│       ├── server.js            로컬 실행 진입점
│       ├── app.js               Express 조립 (listen 안 함 → 재사용 가능)
│       ├── config/index.js      환경변수는 여기서만 읽음
│       ├── routes/              URL 정의
│       ├── controllers/         요청/응답 처리
│       ├── services/            비즈니스 로직
│       │   └── external/        외부 API 호출용 공통 클라이언트
│       ├── repositories/        ★ 데이터 저장소 (교체 지점)
│       │   ├── index.js             DATA_SOURCE 값으로 구현체 선택
│       │   ├── supabase/            ★ 기본: Supabase (포트폴리오 · 예약)
│       │   ├── json/                예비: JSON 파일 (DB 없이 시험용)
│       │   └── mongo/               MongoDB 자리 (미구현)
│       ├── data/portfolio.json  예비 데이터 (원본은 Supabase 테이블)
│       ├── middlewares/
│       └── utils/
│
├── api/index.js                 Vercel 서버리스 진입점
├── scripts/sync-fallback.js
├── supabase/
│   ├── migrations/              테이블 · 뷰 · 권한 변경 기록 (실행 순서대로)
│   └── setup_all.sql            새 프로젝트를 한 번에 세우는 SQL (migrations 를 이어 붙인 것)
├── docs/DB연결-가이드.md        DB 구조 · 사용법 쉬운 설명서
└── vercel.json
```

---

## API

모든 응답은 `{ "success": true, "data": ... }` 형태입니다.

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 · 현재 데이터 소스 |
| GET | `/api/portfolio` | 전체 데이터 (첫 렌더용) |
| GET | `/api/portfolio/profile` | 프로필 |
| GET | `/api/portfolio/education` | 학력 |
| GET | `/api/portfolio/awards` | 공모전 목록 (`?tag=도시숲` 필터 가능) |
| GET | `/api/portfolio/awards/:id` | 공모전 단건 |
| GET | `/api/portfolio/skills` | 관심 분야 |
| GET | `/api/portfolio/contact` | 연락처 |
| GET | `/api/portfolio/location` | 찾아오는 길 |
| GET | `/api/portfolio/meta` | 제목 · 설명 · 내비게이션 |
| POST | `/api/contact/messages` | 문의 메시지 등록 |
| GET | `/api/contact/messages` | 문의 메시지 목록 |
| GET | `/api/reservations/availability?date=YYYY-MM-DD` | 날짜별 예약 가능 시간 |
| POST | `/api/reservations` | 방문 예약 신청 — name · email · purpose · date · time · consent (중복 시간이면 409) |
| GET | `/api/holidays?year=2026` | 한국 공휴일 (Nager.Date, 하루 캐시) |
| GET | `/api/weather` | 찾아오는 길 주소 기준 현재 기온 · 습도 (Open-Meteo, 10분 캐시) |

---

## 자주 할 작업

### 내용 수정 (공모전 추가 등)

Supabase 대시보드 → **Table Editor** 에서 고칩니다. HTML · 코드는 건드릴 필요 없습니다. (최대 1분 뒤 반영)

| 고칠 것 | 테이블 |
|---|---|
| 이름 · 학교 · 소개글 | `profiles` |
| 학력 · 공모전 · 관심 분야 · 연락처 | `educations` · `awards` · `skills` · `contacts` |
| 태그 / 태그 붙이기 | `tags` / `profile_tags` · `award_tags` |
| 페이지 제목 · 상단 메뉴 | `site_meta` · `nav_items` |
| 숨기기 | 줄은 `is_public`, 칸은 `column_visibility` |

공모전 추가 예: `awards` 에 `id=award-card-3`, `profile_id=kwon-yuna`, `title`, `description`, `sort_order=3` 한 줄,
태그는 `award_tags` 에 `award_id=award-card-3`, `tag_id=tag-1` 처럼 한 줄씩. 번호(01, 02 …)는 `sort_order` 순으로 자동.

수정 후 `npm run sync:fallback` 을 실행해 프론트 예비 데이터도 맞춰 주세요.

### 찾아오는 길 · 예약 설정

Supabase 의 두 테이블에서 바꿉니다.

- `locations` — `place_name`, `address`, `map_query`(지도 검색어, 비우면 주소 사용), `lat` · `lon`(날씨 조회 위도·경도), `directions`(지하철·버스·주차 안내)
- `reservation_settings` — `time_slots`(희망 시간 목록), `duration_minutes`(상담 시간), `closed_weekdays`(휴무 요일, 0=일 ~ 6=토), `max_days_ahead`(며칠 뒤까지 예약 가능). 공휴일은 자동으로 막힙니다.

### 관리자 화면 (`/admin.html`)

로그인 후 오른쪽 위 **예약하기관리** 탭 → `/admin-reservations.html` 에서 예약 목록을 보고
처리 상태(접수 · 확정 · 변경 요청 · 취소)를 버튼으로 바꿉니다.

- 처음 한 번: 새 프로젝트라면 `supabase/setup_all.sql` 을 Supabase SQL Editor 에서 실행
- 관리자 계정: Supabase → Authentication → Users → Add user (관리자 이메일 + 비밀번호, Auto Confirm)
- 관리자 추가: `insert into public.admins (email) values ('new@example.com');`
- 예약번호 `R261007-1330-A1B2` = 방문 날짜 · 시간 + 이름/이메일 코드 (같은 사람도 방문 시간별로 다름)

### 예약 확인하기 (운영자)

예약은 Supabase 프로젝트 **yoonahkwon-portfolio** 의 `reservations` 테이블에 저장됩니다.
Supabase 대시보드 → Table Editor → `reservations` 에서 볼 수 있습니다. (`status` 를 `confirmed` / `cancelled` 로 바꿔 관리)

- 방문자는 RLS 로 **추가만** 가능하고 목록은 볼 수 없습니다. 빈 시간은 `booked_times()` 함수가 시간만 돌려줍니다.
- 로컬에서 DB 없이 시험하려면 `backend/.env` 에 `RESERVATION_STORE=json` (메모리, 재시작 시 사라짐).
- 예약이 저장되면 브라우저가 **Formspree**(`frontend/src/js/config.js` 의 `formspreeEndpoint`)로 알림 메일을 보냅니다.
  받는 주소는 Formspree 대시보드의 폼 설정에서 바꿉니다. 메일에서 "답장" 을 누르면 예약자 이메일로 회신됩니다.

### 데이터베이스 (Supabase — 기본 저장소)

포트폴리오 내용 · 예약은 Supabase 프로젝트 **yoonahkwon-portfolio** 에 있습니다.
열쇠는 `backend/.env` (배포는 Vercel 환경변수) 에 넣습니다. **`.env` 는 커밋하지 않습니다.**

```env
DATA_SOURCE=supabase          # 기본값 (json 으로 바꾸면 portfolio.json 예비 데이터)
SUPABASE_URL=https://<프로젝트ID>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # secret 키 금지
```

관리자 화면은 브라우저에서 Supabase 에 바로 붙으므로 `frontend/src/js/config.js` 의 `supabase` 값도 같은 프로젝트로 맞춰 둡니다.

- 테이블 · 공개용 뷰 · 권한: `supabase/migrations/20261013_*.sql`
- 백엔드 구현체: `backend/src/repositories/supabase/portfolio.repository.js`
- 행(`is_public`) · 열(`column_visibility`) 단위로 공개/비공개를 켜고 끕니다.
- 쉬운 설명서: [docs/DB연결-가이드.md](docs/DB연결-가이드.md)

MongoDB 등 다른 DB 도 같은 방식입니다 — `repositories/<이름>/` 에 동일한 메서드 이름으로 구현하고,
`repositories/index.js` 의 `registry` 에 한 줄 추가하면 됩니다.

### 외부 API 붙이기

1. `backend/.env` 에 `EXTERNAL_API_BASE_URL`, `EXTERNAL_API_KEY` 설정
2. `backend/src/services/external/` 에 파일을 만들고 `requestExternal()` 사용
3. 서비스 → 컨트롤러 → 라우트 순으로 노출

### 문의 폼 붙이기

백엔드 API는 이미 준비되어 있습니다. 프론트에서는 다음 한 줄이면 됩니다.

```js
import contactApi from './api/contact.api.js';
await contactApi.sendMessage({ name, email, message });
```

---

## 설계 원칙

- **화면은 데이터를 모른다** — `render/*` 는 넘겨받은 객체만 그립니다.
- **화면은 서버를 모른다** — 통신은 전부 `api/*` 를 거칩니다.
- **서비스는 저장소를 모른다** — `repositories/index.js` 가 구현체를 골라 줍니다.
- **API가 죽어도 페이지는 뜬다** — 실패 시 `fallback.json` 으로 렌더합니다.

## 배포 (Vercel)

`vercel.json` 설정대로 `frontend/` 는 정적 파일로, `api/index.js` 는 서버리스 함수로 배포됩니다.
배포 후 `backend/.env` 의 값들은 Vercel 대시보드의 **Environment Variables** 에 등록하세요.
