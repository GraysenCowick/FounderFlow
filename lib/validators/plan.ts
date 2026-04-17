import { z } from 'zod'

const scheduleItemSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  time_block: z.string().max(50),
  task: z.string().min(1, 'Task cannot be empty').max(1000),
  duration_minutes: z.number().int().min(1).max(480),
})

const resultKpiSchema = z.object({
  name: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  current: z.string().max(200),
})

const activityKpiSchema = z.object({
  name: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  unit: z.string().max(100),
  frequency: z.string().max(100),
})

export const planEditSchema = z.object({
  goal_statement: z.string().min(1, 'Goal statement is required').max(500),
  ninety_day_target: z.string().min(1, '90-day target is required').max(500),
  result_kpis: z.array(resultKpiSchema),
  activity_kpis: z.array(activityKpiSchema),
  weekly_schedule: z.array(scheduleItemSchema),
})

export type PlanEditData = z.infer<typeof planEditSchema>
