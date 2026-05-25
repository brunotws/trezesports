'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, CalendarDays, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  weekId:    string
  label:     string
  prevId:    string
  nextId:    string
  isCurrent: boolean
}

export default function WeekNav({ label, prevId, nextId, isCurrent }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
      {/* Left: home + prev */}
      <div className="flex items-center gap-0.5">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Início">
            <Home size={17} />
          </Button>
        </Link>
        <Link href={`/planejador/${prevId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft size={18} />
          </Button>
        </Link>
      </div>

      {/* Center: week label */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {isCurrent && (
          <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
            Semana Atual
          </span>
        )}
      </div>

      {/* Right: next + back-to-current */}
      <div className="flex items-center gap-0.5">
        <Link href={`/planejador/${nextId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight size={18} />
          </Button>
        </Link>
        {!isCurrent && (
          <Link href="/planejador">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Semana atual">
              <CalendarDays size={18} />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
