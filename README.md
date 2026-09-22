# 권윤아 | 그린스마트시티 포트폴리오

상명대학교 그린스마트시티학과 포트폴리오 웹사이트.
**프론트엔드(화면)** 와 **백엔드(데이터 API)** 가 분리되어 있어, 나중에 DB나 외부 API를 붙여도 화면 코드를 고칠 필요가 없습니다.

🔗 배포: https://yoonahkwon.vercel.app

---

## 빠른 시작

```bash
npm install
cp backend/.env.example backend/.env
npm run dev          # http://localhost:4000
```

프론트엔드와 API가 같은 주소에서 함께 뜹니다.

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (파일 변경 시 자동 재시작) |
| `npm start` | 운영 모드 실행 |
| `npm run sync:fallback` | 데이터 수정 후 프론트 fallback 파일 동기화 |

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
│           ├── render/          데이터 → HTML (섹션별 1파일)
│           │   ├── hero.js  about.js  education.js
│           │   ├── awards.js  skills.js  contact.js
│           │   ├── navbar.js  footer.js  meta.js
│           │   ├── dom.js           공용 헬퍼 (이스케이프 등)
│           │   └── index.js         전체 렌더 실행
│           └── ui/              애니메이션 · 인터랙션
│               ├── navbar.js  particles.js  reveal.js
│               ├── tilt.js  progress.js  smoothScroll.js
│               └── index.js
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
│       │   ├── json/                기본: JSON 파일
│       │   └── mongo/               MongoDB 자리 (미구현)
│       ├── data/portfolio.json  ★ 모든 내용이 담긴 원본 데이터
│       ├── middlewares/
│       └── utils/
│
├── api/index.js                 Vercel 서버리스 진입점
├── scripts/sync-fallback.js
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
| GET | `/api/portfolio/meta` | 제목 · 설명 · 내비게이션 |
| POST | `/api/contact/messages` | 문의 메시지 등록 |
| GET | `/api/contact/messages` | 문의 메시지 목록 |

---

## 자주 할 작업

### 내용 수정 (공모전 추가 등)

`backend/src/data/portfolio.json` 만 고치면 됩니다. HTML은 건드릴 필요 없습니다.

```jsonc
"awards": [
  {
    "id": "award-card-3",
    "number": "03",
    "icon": "🌸",
    "title": "새 공모전",
    "description": "설명...",
    "tags": ["태그1", "태그2"]
  }
]
```

수정 후 `npm run sync:fallback` 을 실행해 프론트 예비 데이터도 맞춰 주세요.

### 데이터베이스 붙이기

화면·라우트·서비스 코드는 **한 줄도 바뀌지 않습니다.** 저장소 구현체만 채우면 됩니다.

1. `cd backend && npm i mongodb`
2. `backend/src/repositories/mongo/portfolio.repository.js` 의 `TODO` 를 실제 쿼리로 교체
3. `backend/.env` 수정

```env
DATA_SOURCE=mongo
DATABASE_URL=mongodb+srv://...
```

PostgreSQL 등 다른 DB도 같습니다 — `repositories/postgres/` 에 동일한 메서드 이름으로 구현하고, `repositories/index.js` 의 `registry` 에 한 줄 추가하면 됩니다.

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
