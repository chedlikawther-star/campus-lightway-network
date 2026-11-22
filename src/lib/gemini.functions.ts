import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * ============================================================================
 *  GEMINI SAFETY ANALYSIS — PLUG-IN POINT FOR YOUR TEAMMATE
 * ============================================================================
 *
 *  How to enable real Gemini analysis:
 *    1. Get an API key from https://aistudio.google.com/app/apikey
 *    2. Add it as a project secret named  GEMINI_API_KEY
 *       (Lovable: ask "add a secret GEMINI_API_KEY"). NEVER paste the key in code.
 *    3. That's it. While the secret is missing, this returns a realistic mock
 *       response so the UI keeps working for demos.
 *
 *  Why a server function? The API key is read on the server only, inside
 *  .handler(), so it never ships to the student's browser.
 *
 *  To change the model or prompt, edit GEMINI_MODEL / buildPrompt() below.
 * ============================================================================
 */

const GEMINI_MODEL = "gemini-2.5-flash";

const routeDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMin: z.number(),
  distanceKm: z.number(),
  safetyScore: z.number(),
  factors: z.array(z.object({ label: z.string(), value: z.number(), detail: z.string() })),
  reportCount: z.number(),
  timeOfDay: z.string(),
});

export type RouteData = z.infer<typeof routeDataSchema>;

export interface SafetyAnalysis {
  source: "gemini" | "mock";
  summary: string;
  tips: string[];
  riskLevel: "low" | "medium" | "high";
}

function buildPrompt(route: RouteData) {
  return `You are a safety assistant for female university students walking home.
Analyze this walking route and reply ONLY with JSON of shape
{"summary": string (max 40 words), "tips": string[] (3 short tips), "riskLevel": "low"|"medium"|"high"}.

Route: ${route.name}
Duration: ${route.durationMin} min, ${route.distanceKm} km
Overall safety score: ${route.safetyScore}%
Time of day: ${route.timeOfDay}
Recent community danger reports: ${route.reportCount}
Factors (0-100, higher is safer):
${route.factors.map((f) => `- ${f.label}: ${f.value} (${f.detail})`).join("\n")}`;
}

function mockAnalysis(route: RouteData): SafetyAnalysis {
  const risky = route.safetyScore < 80;
  return {
    source: "mock",
    riskLevel: route.safetyScore >= 85 ? "low" : route.safetyScore >= 65 ? "medium" : "high",
    summary: risky
      ? `${route.name} saves time but passes a poorly lit, quiet stretch with ${route.reportCount} recent reports. Consider the safer option after dark.`
      : `${route.name} follows busy, well-lit streets with no recent reports. Recommended, especially in the evening.`,
    tips: risky
      ? [
          "Walk with a Commute Buddy if leaving after 8 PM",
          "Keep Silent SOS listening on during this route",
          "Avoid the park shortcut — stay on the main road",
        ]
      : [
          "Share your live location with a trusted contact",
          "Stay on the lit side of the avenue",
          "The bus stop halfway is a safe waiting point",
        ],
  };
}

export const analyzeSafetyWithGeminiFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => routeDataSchema.parse(data))
  .handler(async ({ data }): Promise<SafetyAnalysis> => {
    // 👇 Your teammate's key is read here (server-side only).
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) return mockAnalysis(data);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(data) }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
        },
      );
      if (!res.ok) {
        console.error("Gemini error", res.status, await res.text());
        return mockAnalysis(data);
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = JSON.parse(text) as Partial<SafetyAnalysis>;
      return {
        source: "gemini",
        summary: parsed.summary ?? "No summary returned.",
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
        riskLevel: parsed.riskLevel ?? "medium",
      };
    } catch (err) {
      console.error("Gemini request failed", err);
      return mockAnalysis(data);
    }
  });

/**
 * analyzeSafetyWithGemini(routeData)
 * Call this from the UI. It forwards the route to the server function above.
 */
export function analyzeSafetyWithGemini(routeData: RouteData): Promise<SafetyAnalysis> {
  return analyzeSafetyWithGeminiFn({ data: routeData });
}
