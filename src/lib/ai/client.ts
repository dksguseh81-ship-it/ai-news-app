import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY는 서버 전용 환경 변수에서 읽는다.
export const anthropic = new Anthropic();
