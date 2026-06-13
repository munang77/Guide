/**
 * Cloudflare Workers 프록시
 * ─────────────────────────────────────────────
 * 목적: Anthropic API 키를 브라우저에 노출하지 않고,
 *       가이드 사이트의 채팅 위젯 요청만 받아 대신 호출해준다.
 *
 * 배포 방법은 README-worker.md 참고.
 * 환경변수(Secrets)로 ANTHROPIC_API_KEY 를 등록해야 동작한다.
 */

// 이 사이트에서 오는 요청만 허용 (다른 사이트가 내 키를 못 쓰게)
const ALLOWED_ORIGINS = [
  "https://munang77.github.io",
  "http://localhost:8000",   // 로컬 테스트용 (필요 없으면 지워도 됨)
];

// 가이드 도우미의 성격을 정하는 지침
const SYSTEM_PROMPT = `너는 "가이드 도우미"야. 블렌더(3D 모델링), Luau(Roblox 스크립트), Roblox Studio(맵 제작)를 배우는 한국어 사용자를 돕는다.

규칙:
- 항상 한국어로, 친근하고 쉽게 답한다. 초보자도 이해할 수 있게 전문 용어는 풀어서 설명한다.
- 답은 간결하게. 꼭 필요한 만큼만. 긴 설명이 필요하면 핵심부터 말하고 단계로 나눈다.
- 블렌더, Luau, Roblox Studio와 무관한 질문에는 "이 도우미는 블렌더·Luau·Studio 학습을 돕는 용도예요"라고 부드럽게 안내하고 본래 주제로 유도한다.
- 코드 예시는 짧고 실행 가능하게. Luau는 Roblox 기준으로.
- 모르거나 불확실하면 솔직히 말하고, 공식 문서(blender.org, create.roblox.com)를 권한다.
- 이모지는 쓰지 않는다.`;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // 프리플라이트(CORS 사전 요청) 처리
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    // 허용되지 않은 출처 차단
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: "출처가 허용되지 않았습니다." }), {
        status: 403,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "잘못된 요청 형식입니다." }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "메시지가 비어 있습니다." }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 너무 긴 대화/메시지 방지 (남용 차단)
    const trimmed = messages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }));

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: trimmed,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: "AI 응답을 받지 못했습니다.", detail: data?.error?.message }),
          { status: resp.status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
        );
      }

      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return new Response(JSON.stringify({ reply: text || "(빈 응답)" }), {
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "서버 오류가 발생했습니다." }), {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }
  },
};
