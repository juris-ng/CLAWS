import { supabase } from '../supabase'

export interface GenerateInsightParams {
  body_id: string
  constitution_text?: string
  activism_patterns?: string
}

export interface GenerateInsightResponse {
  success: boolean
  message: string
  insights_created?: number
  error?: string
}

/**
 * Generate AI-powered educational insights from body constitution & patterns
 * Calls the Edge Function you just deployed
 */
export async function generateEducationalInsights(
  params: GenerateInsightParams
): Promise<GenerateInsightResponse> {
  try {
    console.log('🚀 Generating educational insights for body:', params.body_id)

    const { data, error } = await supabase.functions.invoke(
      'generate_educational_insights',
      {
        body: {
          body_id: params.body_id,
          constitution_text: params.constitution_text || '',
          activism_patterns: params.activism_patterns || '',
        },
      }
    )

    if (error) {
      console.error('❌ Error from Edge Function:', error)
      throw error
    }

    console.log('✅ Insights generated successfully:', data)
    return data as GenerateInsightResponse
  } catch (error) {
    console.error('❌ Error generating insights:', error)
    return {
      success: false,
      message: 'Failed to generate insights',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Track engagement score for educational content
 */
export async function trackEducationEngagement(
  content_id: string,
  event_type: 'view' | 'share' | 'like' = 'view'
): Promise<void> {
  try {
    const increment = event_type === 'view' ? 1 : event_type === 'share' ? 3 : 2

    const { error } = await supabase
      .from('educational_content')
      .update({
        engagement_score: supabase.rpc('increment_engagement', {
          content_id,
          increment,
        }),
      })
      .eq('id', content_id)

    if (error) throw error
  } catch (error) {
    console.error('Error tracking engagement:', error)
  }
}

/**
 * Get featured educational content
 */
export async function getFeaturedEducation(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true)
      .order('engagement_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching featured education:', error)
    return []
  }
}

/**
 * Search educational content by keyword
 */
export async function searchEducation(query: string) {
  try {
    const { data, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('status', 'active')
      .textSearch('content', query)
      .order('engagement_score', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching education:', error)
    return []
  }
}
