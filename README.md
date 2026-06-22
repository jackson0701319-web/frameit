# FrameIt

사진을 프레임 안에 넣어보자 — 온라인 네 컷 만들기 웹앱.

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포

### Vercel (추천 — 가장 간단)

1. [GitHub](https://github.com)에 저장소를 만들고 코드를 push
2. [vercel.com](https://vercel.com) → **Add New Project** → 저장소 연결
3. Build Command: `npm run build` / Output: `dist` (자동 감지)
4. Deploy → `https://프로젝트명.vercel.app` 주소 발급

또는 CLI:

```bash
npx vercel login
npx vercel --prod
```

`vercel.json`에 SPA 라우팅 설정이 포함되어 있습니다.

### Netlify

```bash
npx netlify login
npm run build
npx netlify deploy --prod --dir=dist
```

`netlify.toml` / `public/_redirects` 포함.

### GitHub Pages

1. GitHub에 push (`main` 브랜치)
2. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. `.github/workflows/deploy.yml`이 자동 배포
4. 주소: `https://<사용자명>.github.io/<저장소명>/`

## 스택

Vite + React · Canvas 합성 · 클라이언트 전용 (사진 업로드 없음)
