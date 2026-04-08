import { z } from 'zod'

export const questionnaireSchema = z.object({
  business_description: z.string().min(10, 'Please describe your business (at least 10 characters)').max(2000, 'Max 2000 characters'),
  big_goal: z.string().min(10, 'Please describe your goal (at least 10 characters)').max(1000, 'Max 1000 characters'),
  current_state: z.string().min(10, 'Please describe your current state (at least 10 characters)').max(1000, 'Max 1000 characters'),
  hours_per_week: z.number()
    .int('Must be a whole number')
    .min(1, 'Must commit at least 1 hour per week')
    .max(80, 'Max 80 hours per week'),
  obstacles: z.string().min(5, 'Please describe what\'s in your way (at least 5 characters)').max(1000, 'Max 1000 characters'),
  focus_areas: z.array(z.string().max(100)).min(1, 'Select at least one focus area').max(8, 'Max 8 focus areas'),
  additional_context: z.string().max(1000, 'Max 1000 characters').optional(),
})

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>
