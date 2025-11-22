import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateInsightRequest {
  body_id: string
  constitution_text?: string
  activism_patterns?: string
  body_name?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { body_id, constitution_text, activism_patterns, body_name } = await req.json() as GenerateInsightRequest

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // UPGRADED PROMPT - ACTIVIST FOCUSED
    const context = `
You are generating educational content to SPIKE MEMBER ACTIVISM and PROVOKE PARTICIPATION in the "${body_name || 'organization'}".

Constitution/Rules Context: ${constitution_text || 'Not provided'}
Current Activism Patterns: ${activism_patterns || 'Members are beginning to engage'}

CRITICAL: Generate 4 POWERFUL educational insights that will:
1. Make members ANGRY about injustice (if applicable)
2. Show them their POWER and RIGHTS
3. PROVOKE them to JOIN MOVEMENTS
4. Make them feel URGENT to ACT NOW
5. Reference REAL-WORLD activism examples
6. Include ACTION CALLS

Format as JSON array with objects: { title, content, category, urgency_level, call_to_action }
Categories: 'rights', 'participation', 'accountability', 'transparency', 'power'
Urgency: 'critical', 'high', 'medium'

EXAMPLES OF WHAT TO GENERATE:
- "Your Voice Has Been Silenced - Here's How to Reclaim It"
- "The 5% Rule: Why Your Vote Matters More Than You Think"
- "Organizations Fear Informed Members - Know Your Rights"
- "THIS IS WHY Movements WIN: A Playbook for Change"

Make it EMOTIONAL, POWERFUL, and ACTION-ORIENTED.
    `

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a democratic activism expert. Your mission is to generate educational content that SPIKES member participation, ignites activism, and creates REAL social change. Be provocative, inspiring, and action-focused. Reference global activism movements, democratic history, and real examples.`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.8, // Higher temp for more creative/provocative content
        max_tokens: 2000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiInsight = openaiData.choices[0].message.content

    let insights = []
    try {
      const jsonMatch = aiInsight.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Error parsing AI response:', e)
      insights = [{
        title: 'Your Power as a Member - USE IT NOW',
        content: aiInsight,
        category: 'power',
        urgency_level: 'high',
        call_to_action: 'Start today',
      }]
    }

    // Generate embeddings
    const embeddingsResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: insights.map((i: any) => `${i.title} ${i.content}`),
      }),
    })

    const embeddingsData = await embeddingsResponse.json()

    // Insert with urgency levels
    const contentToInsert = insights.map((insight: any, idx: number) => ({
      title: insight.title,
      content: insight.content,
      category: insight.category || 'participation',
      source_type: 'ai_generated',
      source_description: `AI-generated activism insight from ${body_name || body_id}'s constitution`,
      body_id,
      embedding: embeddingsData.data[idx].embedding,
      status: 'active',
      featured: idx === 0, // First insight is featured
      engagement_score: 0,
      created_by: null,
    }))

    const { data, error } = await supabase
      .from('educational_content')
      .insert(contentToInsert)
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Activist insights generated successfully',
        insights_created: data?.length || 0,
        preview: insights.map((i: any) => ({ title: i.title, category: i.category })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
