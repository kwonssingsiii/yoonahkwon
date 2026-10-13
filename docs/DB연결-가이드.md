# DB연결 가이드 — 쉽게 따라 하기

포트폴리오 내용을 **파일(portfolio.json)** 대신 **Supabase 데이터베이스**에서 꺼내 쓰도록 바꾸는 방법입니다.

---

## 0. 먼저 그림으로 이해하기

데이터베이스를 **학교 교실**이라고 생각해 봅시다.

| 교실 물건 | 우리 프로젝트에서 | 하는 일 |
|---|---|---|
| 🗄️ **서랍장** (13개) | 테이블 | 내용을 종류별로 나눠 담아요. 학력 서랍, 공모전 서랍, 태그 서랍… |
| 🪟 **진열장** (12개) | 공개용 뷰 `*_public` | 손님(방문자)은 서랍을 못 열고, 진열장 유리 너머로만 봐요 |
| 🔒 **자물쇠** | RLS · 권한 | 서랍은 선생님(관리자)만 열 수 있어요 |
| 🎚️ **스위치판** | `column_visibility` 테이블 | "공모전 결과 칸은 진열장에서 가려 줘" 같은 걸 켜고 꺼요 |
| 🧵 **실** | 연결 테이블 `award_tags`, `profile_tags` | 태그 서랍과 공모전 서랍을 이어 줘요 |

```
 [서랍장 = 테이블]  ──🔒 손님 못 열어요
        │
        ▼  (숨긴 줄은 빼고, 꺼 둔 칸은 가리고)
 [진열장 = *_public 뷰]  ──👀 손님은 여기만 봐요
        │
        ▼
 백엔드 (repositories/supabase/portfolio.repository.js)
        │
        ▼
 웹사이트 화면
```

---

## 1. 서랍장(테이블) 목록

모든 서랍에는 **`profile_id`** 라는 이름표가 붙어 있어서 "누구의 것인지" 이어집니다.

| 서랍 | 담는 것 | 숨기기 스위치 |
|---|---|---|
| `profiles` | 이름 · 학교 · 학과 · 학년 · 소개글 | 칸(열) 스위치 |
| `educations` | 학력 | 줄(`is_public`) + 칸 스위치 |
| `awards` | 공모전 | 줄 + 칸 스위치 (`result` 는 처음엔 꺼짐) |
| `skills` | 관심 분야 | 줄 + 칸 스위치 |
| `contacts` | 이메일 · SNS (지금은 비어 있음) | 줄 + 칸 스위치 (**처음엔 둘 다 꺼짐**) |
| `tags` | 태그 사전 | 줄 스위치 (끄면 모든 곳에서 사라짐) |
| `profile_tags`, `award_tags` | 태그 연결 실 | 양쪽이 다 공개일 때만 보임 |
| `locations` | 찾아오는 길 | 줄 스위치 |
| `reservation_settings` | 예약 시간표 · 휴무 요일 | 항상 공개 |
| `site_meta`, `nav_items` | 페이지 제목 · 상단 메뉴 | 메뉴는 줄 스위치 |
| `column_visibility` | 🎚️ 칸 스위치판 | — |

`memo` 칸은 **절대 진열장에 안 나와요.** 나만 보는 메모로 쓰세요.

---

## 2. 이미 끝난 일 ✅

`DB연결` 브랜치에서 아래를 모두 해 두었고, `main` 에 합쳐 실제 사이트에 반영했습니다.

1. ✅ `supabase/migrations/20261013_01 ~ 09` SQL 파일 9개 작성
2. ✅ Supabase 프로젝트 **yoonahkwon-portfolio** 에 순서대로 적용
3. ✅ portfolio.json 내용을 그대로 DB 에 넣음
4. ✅ 백엔드에 Supabase 저장소 추가 (`backend/src/repositories/supabase/portfolio.repository.js`)
5. ✅ 확인: DB 에서 꺼낸 내용 = portfolio.json 내용 (8개 항목 모두 똑같음)
6. ✅ 확인: 방문자 키로 서랍(원본 테이블)을 열면 거절됨, 진열장(뷰)만 보임
7. ✅ 확인: 스위치를 끄면 진열장에서 사라지고, 켜면 다시 보임
8. ✅ 기본 저장소를 Supabase 로 교체 (`DATA_SOURCE` 기본값 = `supabase`)
9. ✅ Vercel 에 열쇠 등록 후 배포 — 실제 사이트도 DB 에서 읽어요

> 이제 **portfolio.json 은 예비용**이에요. 원본은 Supabase 테이블입니다.

---

## 3. 내 컴퓨터 · 배포 사이트 설정

### 3-1. 내 컴퓨터에서 먼저 해 보기

1. `backend/.env` 파일을 엽니다. (없으면 `cp backend/.env.example backend/.env`)
   이 파일은 `.gitignore` 에 들어 있어서 **GitHub 에 올라가지 않아요.**
2. `DATA_SOURCE=supabase` 로 되어 있는지 확인합니다. (기본값이라 줄이 없어도 supabase)
3. 🔑 열쇠 두 개를 넣습니다. (Supabase 대시보드 → Project Settings → **API Keys**)
   ```env
   SUPABASE_URL=https://내프로젝트ID.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_로시작하는키
   ```
   비어 있거나 예시 값 그대로면, 서버가 켜질 때 무엇을 고쳐야 하는지 알려 줘요.
4. 터미널에서 `npm run dev`
5. 브라우저에서 http://localhost:4000/api/health 를 엽니다.
   `"dataSource":"supabase"` 가 보이면 성공! 🎉
6. http://localhost:4000 에서 화면이 예전과 똑같이 나오는지 봅니다.

### 3-2. 진짜 사이트(Vercel) — 설정 완료

Vercel 대시보드 → 프로젝트 **yoonahkwon** → Settings → Environment Variables 에 들어 있어요.

| 이름 | 값 |
|---|---|
| `DATA_SOURCE` | `supabase` |
| `SUPABASE_URL` | `https://<프로젝트ID>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |

https://yoonahkwon.vercel.app/api/health 에서 `"dataSource":"supabase"` 가 보이면 정상이에요.
Supabase 프로젝트를 바꾸면 이 값과 `frontend/src/js/config.js` 의 `supabase` 값을 함께 바꾸고 Redeploy 하세요.

DB 가 고장 났을 때 급히 되돌리려면 `DATA_SOURCE` 를 `json` 으로 바꾸고 Redeploy 하면 예비 데이터로 떠요.

---

## 4. 내용 고치기

**이제 portfolio.json 을 고쳐도 사이트는 안 바뀌어요.** Supabase 에서 고칩니다.

1. https://supabase.com/dashboard → **yoonahkwon-portfolio**
2. 왼쪽 **Table Editor** → 고칠 서랍(예: `awards`) 클릭
3. 칸을 더블클릭해서 고치고 **Save**
4. 1분 안에 사이트에 반영돼요. (백엔드가 1분 동안 기억해 두기 때문)

### 예시: 공모전 하나 추가하기
`awards` 에서 **Insert row** →
`id`=`award-card-3`, `profile_id`=`kwon-yuna`, `icon`=🌸, `title`, `description`, `sort_order`=`3`
태그를 달려면 `award_tags` 에 `award_id`=`award-card-3`, `tag_id`=`tag-1` 처럼 한 줄씩 추가.

### 예시: 공모전 하나 숨기기
`awards` 에서 그 줄의 `is_public` 을 **false** 로.

### 예시: 공모전 "결과" 칸을 모두에게 보여 주기
`column_visibility` 에서 `awards` / `result` 줄의 `is_public` 을 **true** 로.

### 예시: 이메일 공개하기
1. `contacts` 에 줄 추가: `id`=`contact-email`, `profile_id`=`kwon-yuna`, `type`=`email`, `icon`=✉️, `label`=`이메일`, `value`=내 이메일, `is_public`=**true**
2. `column_visibility` 에서 `contacts` / `value` 를 **true** 로
   (둘 다 켜야 보여요. 하나만 켜면 안 보여요 — 안전장치)

---

## 5. 꼭 지킬 약속 ⚠️

- 🔑 **secret 키 / service_role 키는 절대 코드나 GitHub 에 넣지 마세요.** 자물쇠를 다 여는 만능 열쇠예요. 지금 쓰는 `sb_publishable_...` 키는 진열장만 보는 키라 괜찮아요.
- ➕ 서랍에 **새 칸(열)을 만들면** `07_public_views.sql` 처럼 진열장(뷰)에도 직접 추가해야 사이트에 나와요. 안 하면 자동으로 비공개예요.
- 🧯 DB 가 고장 나도 사이트는 `frontend/src/data/fallback.json` 으로 떠요. 내용을 크게 바꿨다면 fallback 도 맞춰 두세요.
- ⚠️ Supabase → Advisors 에 "Security Definer View" 경고 12개가 보여요. 진열장이 잠긴 서랍을 대신 읽어 주는 설계라서 생기는 **예상된 경고**예요.

---

## 6. 파일 위치 한눈에

```
supabase/migrations/
├── 20261013_01_column_visibility.sql   스위치판 + 공용 함수
├── 20261013_02_profiles.sql            기본 정보 서랍
├── 20261013_03_tags.sql                태그 서랍
├── 20261013_04_profile_items.sql       학력 · 공모전 · 관심분야 · 연락처 · 장소 · 예약설정 · 메타 · 메뉴
├── 20261013_05_junctions.sql           태그 연결 실
├── 20261013_06_rls.sql                 자물쇠
├── 20261013_07_public_views.sql        진열장 12개
├── 20261013_08_seed.sql                처음 데이터
└── 20261013_09_fix_is_col_public.sql   진열장 오류 고침

backend/src/repositories/supabase/portfolio.repository.js   진열장에서 꺼내 화면 모양으로 조립
backend/src/repositories/index.js                           DATA_SOURCE=supabase 등록
```
