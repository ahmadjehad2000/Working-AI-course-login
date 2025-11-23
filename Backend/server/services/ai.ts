const AI_API_BASE_URL = (
  process.env.AI_API_BASE_URL ||
  process.env.AI_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const AI_API_TIMEOUT_MS = Number(process.env.AI_API_TIMEOUT_MS || 30000);

export type AiModule = {
  title: string;
  description: string;
  topics?: string[];
  content?: string;
  examples?: string[];
  exercises?: string[];
};

export type AiQuality = {
  overall_score?: number;
  depth_score?: number;
  clarity_score?: number;
  completeness_score?: number;
  engagement_score?: number;
  issues?: string[];
  recommendations?: string[];
};

export type AiCourse = {
  id?: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  content_type?: string;
  overview?: string;
  objectives?: string[];
  modules?: AiModule[];
  domain?: string;
  tags?: string[];
  estimated_hours?: number;
  quality?: AiQuality;
};

export type AiGenerationResponse = {
  success: boolean;
  course?: AiCourse;
  quality?: AiQuality;
  generation_time?: number;
  error?: string;
};

export async function generateCourseWithAI(
  request: { title: string; difficulty: AiCourse["difficulty"] }
): Promise<AiGenerationResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_API_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AI API returned ${response.status} ${response.statusText}: ${errorText || "Unknown error"}`
      );
    }

    const data = (await response.json()) as AiGenerationResponse;
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(
        `AI service request timed out after ${AI_API_TIMEOUT_MS}ms`
      );
    }
    throw new Error(error?.message || "Failed to contact AI service");
  } finally {
    clearTimeout(timeout);
  }
}
