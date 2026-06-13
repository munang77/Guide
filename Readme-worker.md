# AI 질문 도우미 설치 가이드

가이드 사이트에 "모르는 걸 물어보면 답해주는" AI 채팅 버튼을 붙이는 방법입니다.
구조는 이렇습니다:

```
방문자 브라우저 (채팅 위젯)
        │  질문 전송
        ▼
Cloudflare Worker (내 API 키를 숨긴 중계 서버)   ← 키는 여기에만 있음
        │
        ▼
   Anthropic API
```

API 키를 브라우저에 절대 넣지 않으므로 안전합니다. 무료 범위로 충분히 운영됩니다.

---

## 1단계 — Anthropic API 키 발급

1. https://console.anthropic.com 가입/로그인
2. **Settings → API Keys → Create Key**
3. 키를 복사해 둡니다 (한 번만 보이니 메모). `sk-ant-...` 형태입니다.
4. 결제 수단 등록이 필요할 수 있습니다. 사용량 한도(Usage limits)를 낮게 걸어두면 안심입니다.

## 2단계 — Cloudflare Worker 만들기 (무료)

1. https://dash.cloudflare.com 가입/로그인
2. 왼쪽 메뉴 **Workers & Pages → Create → Create Worker**
3. 이름을 정합니다 (예: `guide-helper`). 주소가 `guide-helper.<계정>.workers.dev`가 됩니다.
4. **Deploy** 한 번 누른 뒤 **Edit code** 클릭
5. 편집기 내용을 전부 지우고 **worker.js** 파일 내용을 그대로 붙여넣기
6. **worker.js 안의 `ALLOWED_ORIGINS`** 가 본인 사이트 주소와 맞는지 확인
   - 기본값 `https://munang77.github.io` 이 본인 GitHub Pages 주소면 그대로 두면 됩니다.
7. 오른쪽 위 **Deploy**

## 3단계 — API 키를 Worker에 비밀로 등록

1. 그 Worker 화면에서 **Settings → Variables and Secrets**
2. **Add → Type: Secret**
3. 이름(Variable name)에 정확히 `ANTHROPIC_API_KEY` 입력
4. 값(Value)에 1단계의 키를 붙여넣고 **Save / Deploy**

> 이렇게 하면 키가 코드가 아니라 Cloudflare 금고에 들어가, 누구도 볼 수 없습니다.

## 4단계 — 위젯에 Worker 주소 연결

1. **assistant.js** 파일을 엽니다
2. 맨 위의 이 줄을 찾습니다:
   ```js
   var PROXY_URL = "https://YOUR-WORKER.workers.dev";
   ```
3. 따옴표 안을 2단계에서 만든 본인 Worker 주소로 교체합니다. 예:
   ```js
   var PROXY_URL = "https://guide-helper.munang77.workers.dev";
   ```
4. 저장.

## 5단계 — GitHub에 올리기

저장소(`Guide`)에 아래 파일을 올리거나 업데이트합니다:

- `assistant.js`  ← 새 파일 (4단계에서 주소 수정한 것)
- HTML 17개 전부  ← `<script src="assistant.js"></script>` 가 추가된 새 버전

`worker.js` 와 이 문서(`README-worker.md`)는 Cloudflare용/설명용이라 GitHub Pages에 올려도 되고 안 올려도 됩니다(사이트 동작에는 영향 없음).

1~2분 뒤 사이트에 들어가면 우하단에 동그란 **?** 버튼이 보입니다. 눌러서 질문해 보세요.

---

## 점검 / 문제 해결

- **버튼은 보이는데 "서버 주소가 설정되지 않았어요"** → 4단계를 안 했거나 주소 오타. assistant.js의 PROXY_URL 확인.
- **"출처가 허용되지 않았습니다"** → worker.js의 `ALLOWED_ORIGINS` 에 본인 사이트 주소가 없음. 추가 후 재배포.
- **"AI 응답을 받지 못했습니다"** → 3단계 Secret 이름이 정확히 `ANTHROPIC_API_KEY` 인지, 키가 유효한지, Anthropic 결제/한도 확인.
- **응답이 느리다** → 정상입니다. 첫 응답은 몇 초 걸릴 수 있습니다.

## 비용과 안전

- 모델은 가장 저렴하고 빠른 **Claude Haiku** 로 설정돼 있습니다.
- worker.js가 대화 길이(최근 12개)와 메시지 길이(4000자)를 제한해 과도한 사용을 막습니다.
- 그래도 공개 사이트이므로, Anthropic 콘솔에서 **월 사용 한도**를 걸어두는 것을 권장합니다.
- 더 똑똑한 답이 필요하면 worker.js의 `model` 을 `claude-sonnet-4-6` 으로 바꾸면 됩니다(비용은 올라갑니다).
