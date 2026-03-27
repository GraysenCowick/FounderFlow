export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold inline-block">
            <span className="text-violet-600">Founder</span>Flow
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
