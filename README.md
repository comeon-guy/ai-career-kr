# AI Career KR

완성된 직무 분석 서비스의 배포 소스입니다. 직무 검색, 전공 검색, 직무 선택, Final Report를 정적 웹으로 제공합니다.

AI 역량진단 기능은 이번 repository 범위에 포함되지 않습니다.

## 프로젝트 개요

이용자는 직업과 전공을 검색하고, 선택한 직무의 Final Report에서 업무 분포, 직무 분포, Task 2-axis, Narrative를 확인합니다. 배포 단위는 492개 직업과 3,880개 Task입니다.

## 정적 웹서비스 구조

Vite로 빌드한 정적 사이트입니다. 화면과 검색 인덱스는 빌드 산출물로 묶이고, Final Report와 직무 분포 데이터는 `frontend/public`의 정적 파일로 제공됩니다. 별도의 서버 런타임이 응답을 만들지 않습니다.

- backend runtime 없음
- database 없음
- static JSON runtime 사용

## 설치 방법

Node.js 22 LTS와 npm이 필요합니다. 의존성 잠금 파일은 `frontend/package-lock.json`입니다.

```bash
cd frontend
npm ci
```

## local development 실행

```bash
cd frontend
npm run dev
```

개발 서버 주소는 `http://localhost:5173` 입니다.

## production build

GitHub Pages project site의 base path는 `/ai-career-kr/` 입니다. `npm run build`가 이 base로 `frontend/dist`를 만듭니다.

```bash
cd frontend
npm run build
```

## GitHub Pages deployment

`main`에 push하면 `.github/workflows/deploy-pages.yml`이 의존성을 설치하고 production build를 실행한 뒤 `frontend/dist`만 Pages에 배포합니다. Pages의 Build and deployment Source는 GitHub Actions입니다.

공개 주소 형식은 `https://<ACCOUNT>.github.io/ai-career-kr/` 입니다.

## 주요 디렉터리

- `frontend/` — Vite 앱, 빌드 설정, 정적 자산
- `frontend/src/` — 화면과 검색
- `frontend/public/jobs/` — 직무별 Final Report
- `frontend/public/api/` — Final Report view-model과 직무 분포 JSON
- `data/canonical/` — canonical production data
- `.github/workflows/` — GitHub Pages 배포

## canonical production data 위치

`data/canonical/kr-task-2axis-v2/derived/runtime_projection/task_analysis_v2_by_jobCd.json`
