import { z } from 'zod'

export const checkInResponseSchema = z.object({
  check_in_id: z.string().uuid(),
  user_response: z.string().min(1, 'Please provide a response'),
  response_data: z.record(z.string(), z.unknown()).optional(),
})

export type CheckInResponseData = z.infer<typeof checkInResponseSchema>
