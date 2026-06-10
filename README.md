# 🗼 블렌더 × 로블록스 타워디펜스 — 입문 가이드

로블록스 타워디펜스 게임용 3D 에셋을 만들기 위한 **블렌더 한국어 입문 가이드**입니다.
설치 → 뷰포트 조작 → 모델링 → 색 입히기(팔레트 텍스처) → FBX 내보내기 → Roblox Studio 임포트까지, 완전 처음인 사람 눈높이로 정리했어요.

- **13개 챕터** + 90+ 단축키 검색형 치트시트
- **15개 직접 그린 SVG 다이어그램** (이미지 파일 불필요 — 전부 인라인)
- 로블록스 특화 팁: 트라이앵글 예산, 스터드 크기 감각, 터렛 피벗(원점) 잡기, 모듈식 맵 타일
- 외부 의존성은 폰트(Pretendard CDN) 하나뿐인 **단일 `index.html`**

## 미리보기 (로컬)

`index.html`을 더블클릭해서 브라우저로 열면 끝입니다. 빌드·설치 과정이 없어요.

## GitHub Pages로 배포하기

1. [github.com/new](https://github.com/new)에서 **Public** 저장소 생성 (예: `blender-guide`)
2. 저장소에서 `Add file ▸ Upload files` → `index.html`과 `README.md` 업로드 → `Commit changes`
3. `Settings ▸ Pages` → Source: **Deploy from a branch**, Branch: **main / (root)** → Save

1~2분 뒤 `https://<아이디>.github.io/blender-guide/` 에서 접속할 수 있습니다.

> git에 익숙하다면 물론 `git clone` → 파일 추가 → `git push` 방식도 동일하게 동작합니다.

## 커스터마이징

색·폰트는 `index.html` 상단 `:root`의 CSS 변수만 바꾸면 사이트 전체에 반영됩니다.

```css
:root{
  --orange:#f5792a;   /* 포인트 색 (블렌더 오렌지) */
  --blue:#5aa7ff;     /* 로블록스 콜아웃 색 */
  --bg:#131316;       /* 배경 */
}
```

섹션을 추가하고 싶으면 `<section class="sec" id="...">` 블록을 복사하고, 사이드바 `<nav>`에 같은 `id`로 링크 한 줄만 추가하면 스크롤 하이라이트까지 자동으로 동작합니다.

## 라이선스 / 고지

자유롭게 수정·배포하세요. 단축키는 Blender 4.x 기본 키맵(영문 UI) 기준입니다.
Blender는 Blender Foundation, Roblox는 Roblox Corporation의 상표이며 이 문서는 독립적인 학습용 자료입니다.
