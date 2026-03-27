import { Resend } from 'resend'

let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FounderFlow</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fafafa; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo { color: #10B981; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .logo span { color: #fafafa; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; margin-bottom: 24px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #fafafa; }
  p { font-size: 15px; line-height: 1.6; color: #a1a1aa; margin: 0 0 16px; }
  .highlight { color: #10B981; font-weight: 600; }
  .btn { display: inline-block; background: #10B981; color: #0a0a0a; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px; }
  .schedule-item { border-left: 3px solid #10B981; padding: 8px 12px; margin-bottom: 12px; background: #0f0f0f; border-radius: 0 8px 8px 0; }
  .schedule-day { font-weight: 600; color: #10B981; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .schedule-task { color: #fafafa; font-size: 14px; margin-top: 2px; }
  .schedule-time { color: #71717a; font-size: 12px; margin-top: 2px; }
  .footer { text-align: center; color: #52525b; font-size: 13px; margin-top: 32px; }
  .footer a { color: #71717a; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Founder<span>Flow</span></div>
  </div>
  ${content}
  <div class="footer">
    <p>FounderFlow — Your AI-powered quarterly goal coach</p>
    <p><a href="${APP_URL}/settings">Manage email preferences</a> · <a href="${APP_URL}/settings?unsubscribe=true">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  return getResend().emails.send({
    from: 'FounderFlow <hello@founderflow.app>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}

export function buildMondayKickoffEmail(data: {
  userName: string
  weekNumber: number
  ninetyDayTarget: string
  weeklySchedule: Array<{ day: string; time_block: string; task: string; duration_minutes: number }>
  checkInPageUrl: string
}): EmailOptions {
  const scheduleItems = data.weeklySchedule
    .map(
      (item) => `
    <div class="schedule-item">
      <div class="schedule-day">${item.day}</div>
      <div class="schedule-task">${item.task}</div>
      <div class="schedule-time">${item.time_block} · ${item.duration_minutes} min</div>
    </div>`
    )
    .join('')

  const html = emailWrapper(`
    <div class="card">
      <h1>🎯 Week ${data.weekNumber}: Here's your game plan</h1>
      <p>Hey ${data.userName},</p>
      <p>New week, new opportunity to move the needle. Your 90-day target is still the north star:</p>
      <p class="highlight">"${data.ninetyDayTarget}"</p>
      <p>Here's what this week looks like:</p>
      ${scheduleItems}
      <p>This week matters. Every task on this list is a direct line to your goal. Let's get after it.</p>
      <a href="${data.checkInPageUrl}" class="btn">View Full Plan →</a>
    </div>
  `)

  return {
    to: '',
    subject: `🎯 Week ${data.weekNumber}: Here's your game plan`,
    html,
  }
}

export function buildMidweekPulseEmail(data: {
  userName: string
  weekNumber: number
  activityKpis: Array<{ name: string; target: string; unit: string; frequency: string }>
  checkInPageUrl: string
}): EmailOptions {
  const kpiList = data.activityKpis
    .map((kpi) => `<li style="color:#a1a1aa;margin-bottom:8px;"><span style="color:#fafafa;font-weight:600;">${kpi.name}</span> — Target: <span class="highlight">${kpi.target} ${kpi.unit} ${kpi.frequency}</span></li>`)
    .join('')

  const html = emailWrapper(`
    <div class="card">
      <h1>📊 Midweek check — how's it going?</h1>
      <p>Hey ${data.userName},</p>
      <p>It's Wednesday. The week is half over. Let's do a quick pulse check on your activity KPIs:</p>
      <ul style="padding-left:20px;margin:16px 0;">
        ${kpiList}
      </ul>
      <p>How many of these have you hit so far this week? Be honest with yourself — that's where growth happens.</p>
      <a href="${data.checkInPageUrl}" class="btn">Log Your Progress →</a>
    </div>
  `)

  return {
    to: '',
    subject: '📊 Midweek check — how\'s it going?',
    html,
  }
}

export function buildFridayReviewEmail(data: {
  userName: string
  weekNumber: number
  resultKpis: Array<{ name: string; target: string; current: string }>
  checkInPageUrl: string
}): EmailOptions {
  const kpiList = data.resultKpis
    .map((kpi) => `<li style="color:#a1a1aa;margin-bottom:8px;"><span style="color:#fafafa;font-weight:600;">${kpi.name}</span> — Target: <span class="highlight">${kpi.target}</span></li>`)
    .join('')

  const html = emailWrapper(`
    <div class="card">
      <h1>🏁 Week ${data.weekNumber} wrap-up</h1>
      <p>Hey ${data.userName},</p>
      <p>Week ${data.weekNumber} is done. Time for your Friday Review — a non-negotiable habit of high-performers.</p>
      <p><strong style="color:#fafafa;">Log your numbers for the week:</strong></p>
      <ul style="padding-left:20px;margin:16px 0;">
        ${kpiList}
      </ul>
      <p>Also reflect: What worked this week? What got in the way? What will you do differently next week?</p>
      <a href="${data.checkInPageUrl}" class="btn">Complete Your Review →</a>
    </div>
  `)

  return {
    to: '',
    subject: `🏁 Week ${data.weekNumber} wrap-up`,
    html,
  }
}

export function buildDailyNudgeEmail(data: {
  userName: string
  todayTask: { day: string; time_block: string; task: string; duration_minutes: number } | null
  checkInPageUrl: string
}): EmailOptions {
  const taskContent = data.todayTask
    ? `<div class="schedule-item">
        <div class="schedule-day">Today's Task</div>
        <div class="schedule-task">${data.todayTask.task}</div>
        <div class="schedule-time">${data.todayTask.time_block} · ${data.todayTask.duration_minutes} min</div>
      </div>`
    : `<p>No specific task scheduled for today — use this time for a weekly review or deep work on your goal.</p>`

  const html = emailWrapper(`
    <div class="card">
      <h1>✅ Did you hit today's task?</h1>
      <p>Hey ${data.userName},</p>
      <p>Quick check-in. Here's what's on your plate today:</p>
      ${taskContent}
      <p>Did you get it done? Log your progress and keep the streak alive.</p>
      <a href="${data.checkInPageUrl}" class="btn">Mark as Done →</a>
    </div>
  `)

  return {
    to: '',
    subject: '✅ Did you hit today\'s task?',
    html,
  }
}
