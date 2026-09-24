import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StudentData {
  name: string;
  student_id: string;
  attendance: number;
  assignment_score: number;
  internal_marks: number;
  previous_marks: number;
  study_hours: number;
  final_marks: number;
  performance_category: string;
}

async function getApiKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "OPENROUTER_API_KEY")
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { students, question } = await req.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(
        JSON.stringify({ error: "No student data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI insights are not configured. The OpenRouter API key has not been set." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const studentSummaries = (students as StudentData[]).map((s) => ({
      name: s.name,
      student_id: s.student_id,
      attendance: s.attendance,
      assignment_score: s.assignment_score,
      internal_marks: s.internal_marks,
      previous_marks: s.previous_marks,
      study_hours: s.study_hours,
      final_marks: s.final_marks,
      performance_category: s.performance_category,
    }));

    const prompt = `You are an educational data analyst. Analyze the following student performance data and provide insights.

Student Data (JSON):
${JSON.stringify(studentSummaries, null, 2)}

${question ? `Specific question: ${question}` : "Provide a comprehensive analysis including:"}

1. Key patterns in the data
2. Correlations between study habits, attendance, and performance
3. Students or groups that need attention
4. Actionable recommendations for faculty

Keep the response concise, data-driven, and professional. Do not invent statistics - only use the data provided.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://student-analytics.bolt.new",
        "X-Title": "Student Performance Analytics",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          { role: "system", content: "You are an educational data analyst providing insights on student performance data." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const insight = data?.choices?.[0]?.message?.content;

    if (!insight) {
      return new Response(
        JSON.stringify({ error: "No insight generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
