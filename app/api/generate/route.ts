import { env } from "cloudflare:workers";
import { handleGeneration, type ApiEnvironment } from "../../../server/llm-service";

export async function POST(request: Request) {
  return handleGeneration(request, env as ApiEnvironment);
}
