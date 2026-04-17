import Anthropic from '@anthropic-ai/sdk'
import { buildGamePlanPrompt, type QuestionnaireData } from './prompts/game-plan'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

export interface GamePlanResult {
  goal_statement: string
  ninety_day_target: string
  result_kpis: Array<{ name: string; target: string; current: string }>
  activity_kpis: Array<{ name: string; target: string; unit: string; frequency: string }>
  weekly_schedule: Array<{
    day: string
    time_block: string
    task: string
    duration_minutes: number
  }>
}

export async function generateGamePlan(questionnaire: QuestionnaireData, startDate: string): Promise<{
  parsed: GamePlanResult
  raw: string
}> {
  const { systemPrompt, userPrompt } = buildGamePlanPrompt(questionnaire, startDate)

  async function callClaude(): Promise<string> {
    const message = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
    return content.text
  }

  let raw = await callClaude()

  function parseResponse(text: string): GamePlanResult {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  }

  try {
    const parsed = parseResponse(raw)
    return { parsed, raw }
  } catch {
    // Retry once
    raw = await callClaude()
    const parsed = parseResponse(raw)
    return { parsed, raw }
  }
}

export async function generateWeeklyReview(context: {
  goalStatement: string
  ninetyDayTarget: string
  weekNumber: number
  resultKpis: Array<{ name: string; target: string; current: string }>
  activityKpis: Array<{ name: string; target: string; unit: string; frequency: string }>
  accomplishments: string
  blockers: string
  nextFocus: string
  latestKpiValues: Record<string, number>
}): Promise<string> {
  const kpiContext = context.resultKpis.map((k) => {
    const logged = context.latestKpiValues[k.name]
    return `- ${k.name}: target ${k.target}${logged !== undefined ? `, current logged ${logged}` : ` (not yet logged)`}`
  }).join('\n')

  const system = `You are FounderFlow, an AI goal coach for entrepreneurs. You think using principle-centered goal setting, concrete next-action planning, and importance-over-urgency prioritization. Your weekly review responses are direct, specific, and under 200 words. No fluff. Give one sharp observation about their progress, directly address their biggest blocker with a concrete suggestion, and affirm or sharpen their stated focus for next week.`

  const userPrompt = `Week ${context.weekNumber} of 13 — Weekly Review

**My 90-day goal:** ${context.goalStatement}
**Target by day 90:** ${context.ninetyDayTarget}

**KPI Status:**
${kpiContext}

**What I accomplished this week:**
${context.accomplishments}

**What's blocking me:**
${context.blockers}

**My focus for next week:**
${context.nextFocus}

Give me your coaching response.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text
}
