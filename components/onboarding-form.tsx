'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { questionnaireSchema, type QuestionnaireFormData } from '@/lib/validators/questionnaire'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FOCUS_AREAS = [
  'Marketing & Branding',
  'Sales & Revenue',
  'Product / Service Development',
  'Operations & Systems',
  'Team & Hiring',
  'Finance & Fundraising',
  'Customer Success',
  'Strategy & Planning',
]

const STEPS = [
  { title: 'Your Business', field: 'business_description' },
  { title: 'Your #1 Goal', field: 'big_goal' },
  { title: 'Where You Are Now', field: 'current_state' },
  { title: 'Time Available', field: 'hours_per_week' },
  { title: 'Your Obstacles', field: 'obstacles' },
  { title: 'Focus Areas', field: 'focus_areas' },
  { title: 'Anything Else?', field: 'additional_context' },
] as const

export function OnboardingForm() {
  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const router = useRouter()

  const { register, handleSubmit, trigger, formState: { errors }, setValue } = useForm<QuestionnaireFormData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: { focus_areas: [] },
  })

  const toggleArea = (area: string) => {
    const updated = selectedAreas.includes(area)
      ? selectedAreas.filter((a) => a !== area)
      : [...selectedAreas, area]
    setSelectedAreas(updated)
    setValue('focus_areas', updated, { shouldValidate: true })
  }

  const currentStep = STEPS[step]
  const progress = ((step) / (STEPS.length - 1)) * 100
  const isLastStep = step === STEPS.length - 1

  const handleNext = async () => {
    const field = currentStep.field as keyof QuestionnaireFormData
    const valid = await trigger(field)
    if (valid) {
      if (isLastStep) {
        await handleSubmit(onSubmit)()
      } else {
        setStep((s) => s + 1)
      }
    }
  }

  const onSubmit = async (data: QuestionnaireFormData) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to generate plan')
        return
      }
      router.push('/dashboard')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-2xl font-bold mb-3">Generating your game plan...</h2>
        <p className="text-muted-foreground max-w-sm">
          Claude is analyzing your answers using proven goal-setting and productivity principles to build your personalized 90-day plan.
        </p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{currentStep.title}</h2>
          <p className="text-muted-foreground text-sm">
            {step === 0 && 'Tell us what your business does so we can tailor your plan.'}
            {step === 1 && 'What is the single most important thing you want to achieve this quarter?'}
            {step === 2 && 'Be honest — where are you right now relative to that goal?'}
            {step === 3 && 'How many hours per week can you realistically commit to this goal?'}
            {step === 4 && 'What obstacles or challenges are getting in your way?'}
            {step === 5 && 'Which areas of your business does this goal primarily touch?'}
            {step === 6 && 'Any other context that would help us build a better plan? (optional)'}
          </p>
        </div>

        {step === 0 && (
          <div className="space-y-2">
            <Label htmlFor="business_description">Describe your business</Label>
            <Textarea
              id="business_description"
              placeholder="e.g. I run a B2B SaaS company that helps restaurants manage their inventory. We have 10 paying customers and are pre-Series A..."
              rows={4}
              {...register('business_description')}
            />
            {errors.business_description && (
              <p className="text-sm text-destructive">{errors.business_description.message}</p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="big_goal">Your one big goal this quarter</Label>
            <Textarea
              id="big_goal"
              placeholder="e.g. Close 10 new paying customers and reach $15k MRR by the end of the quarter..."
              rows={4}
              {...register('big_goal')}
            />
            {errors.big_goal && (
              <p className="text-sm text-destructive">{errors.big_goal.message}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="current_state">Where you are now</Label>
            <Textarea
              id="current_state"
              placeholder="e.g. I currently have 3 paying customers at $500/mo each ($1.5k MRR). I'm doing 5-6 demo calls a week but closing less than 20%..."
              rows={4}
              {...register('current_state')}
            />
            {errors.current_state && (
              <p className="text-sm text-destructive">{errors.current_state.message}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="hours_per_week">Hours per week</Label>
            <Input
              id="hours_per_week"
              type="number"
              min={1}
              max={80}
              placeholder="e.g. 10"
              {...register('hours_per_week', { valueAsNumber: true })}
            />
            {errors.hours_per_week && (
              <p className="text-sm text-destructive">{errors.hours_per_week.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Be realistic — your plan will be time-blocked to fit this.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label htmlFor="obstacles">What&apos;s in your way?</Label>
            <Textarea
              id="obstacles"
              placeholder="e.g. I get pulled into product work constantly, struggle to prioritize outreach, and don't have a repeatable sales process yet..."
              rows={4}
              {...register('obstacles')}
            />
            {errors.obstacles && (
              <p className="text-sm text-destructive">{errors.obstacles.message}</p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Label>Select all that apply</Label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                    selectedAreas.includes(area)
                      ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-violet-400 bg-card'
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
            {errors.focus_areas && (
              <p className="text-sm text-destructive">{errors.focus_areas.message}</p>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-2">
            <Label htmlFor="additional_context">Additional context (optional)</Label>
            <Textarea
              id="additional_context"
              placeholder="e.g. I have a part-time assistant who can handle admin tasks. My ideal customer is a mid-market e-commerce brand. I've tried cold email before but it hasn't worked..."
              rows={4}
              {...register('additional_context')}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
            onClick={handleNext}
          >
            {isLastStep ? 'Generate my plan →' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
