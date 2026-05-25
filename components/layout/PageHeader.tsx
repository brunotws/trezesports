'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'

interface Props {
  title:     string
  subtitle?: string
  backHref?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, backHref, children }: Props) {
  const router = useRouter()

  return (
    <header className="flex items-center gap-2 px-4 pt-6 pb-4 border-b border-border">
      <button
        type="button"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Voltar"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex-1 min-w-0">
        {subtitle && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
            {subtitle}
          </p>
        )}
        <h1 className="text-lg font-semibold truncate leading-tight">{title}</h1>
      </div>

      {children}

      <Link
        href="/dashboard"
        className="p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Início"
      >
        <Home size={20} />
      </Link>
    </header>
  )
}
