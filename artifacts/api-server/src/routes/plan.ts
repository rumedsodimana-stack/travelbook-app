import { Router, type IRouter } from "express";

/**
 * POST /v1/plan
 *
 * Body: { destination, startDate, endDate, budget, currency, travelers,
 *         interests[], travelStyle, purpose, description }
 *
 * Returns: { source: "llm" | "fallback", suggestions: string }
 *
 * If ANTHROPIC_API_KEY is set in the environment, this endpoint proxies the
 * request to Anthropic Claude with a tightly-scoped system prompt that asks
 * for itinerary suggestions in plain text. The mobile app then merges those
 * suggestions with its scripted `buildFullItinerary()` output.
 *
 * If ANTHROPIC_API_KEY is NOT set, this endpoint returns
 * `{ source: "fallback", suggestions: "" }` and the mobile app silently
 * falls back to the scripted itinerary — so the app keeps working in dev
 * without a key.
 *
 * This is intentionally a thin proxy. Real production would:
 *  - Validate body via Zod (lib/api-zod schema TBD)
 *  - Stream the response (LLMs feel slow without streaming)
 *  - Cache identical requests
 *  - Rate-limit per user
 *  - Return structured JSON instead of free-form suggestions
 */
const router: IRouter = Router();

interface PlanRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: number;
  interests: string[];
  travelStyle: "budget" | "comfort" | "luxury";
  purpose: string;
  description: string;
}

router.post("/v1/plan", async (req, res) => {
  const body = req.body as PlanRequest;

  if (!body || !body.destination) {
    return res.status(400).json({ error: "destination is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.json({
      source: "fallback",
      suggestions: "",
      reason: "ANTHROPIC_API_KEY not set on server — using scripted itinerary.",
    });
  }

  try {
    const prompt = buildPrompt(body);
    const llmRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      return res.status(502).json({
        source: "fallback",
        suggestions: "",
        error: `LLM upstream ${llmRes.status}: ${errText.slice(0, 200)}`,
      });
    }

    const llmData = (await llmRes.json()) as { content?: { type: string; text?: string }[] };
    const text = llmData.content?.find((c) => c.type === "text")?.text ?? "";

    return res.json({
      source: "llm",
      suggestions: text,
    });
  } catch (err) {
    return res.status(500).json({
      source: "fallback",
      suggestions: "",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

function buildPrompt(p: PlanRequest): string {
  const intereststext = p.interests?.length ? p.interests.join(", ") : "(none specified)";
  return [
    `You are TravelBook's AI Trip Builder. The user is planning a trip to ${p.destination}.`,
    "",
    "TRIP DETAILS:",
    `- Dates: ${p.startDate} to ${p.endDate}`,
    `- Travelers: ${p.travelers}`,
    `- Budget: ${p.budget} ${p.currency}`,
    `- Travel style: ${p.travelStyle}`,
    `- Trip purpose: ${p.purpose}`,
    `- Interests: ${intereststext}`,
    p.description ? `- Free-text description: "${p.description}"` : "",
    "",
    "TASK:",
    "Return concise, opinionated suggestions for the trip. Cover (in this order):",
    "1. Visa & insurance considerations specific to this destination + nationality assumption.",
    "2. Recommended airline + flight class given style/budget.",
    "3. Recommended hotel(s) — neighborhood + 2 specific properties.",
    "4. 3-5 must-do activities matched to interests + purpose.",
    "5. 2-3 dinner reservations worth booking ahead.",
    "6. 1 signature event or experience if available during the dates.",
    "7. Best inter-city / local transport pattern.",
    "",
    "Be specific. Use real provider/property names. Match the budget. Adjust for purpose",
    "(e.g. honeymoon → romantic; family → kid-friendly; business → workspace amenities).",
    "Keep total response under 600 words.",
  ]
    .filter(Boolean)
    .join("\n");
}

export default router;
