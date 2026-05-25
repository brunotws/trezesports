'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Dumbbell, Users, Trophy } from 'lucide-react'

const TABS = [
  { href: '/dashboard',  label: 'Início',      Icon: LayoutDashboard },
  { href: '/planejador', label: 'Planejador',   Icon: CalendarDays },
  { href: '/exercicios', label: 'Exercícios',   Icon: Dumbbell },
  { href: '/atletas',    label: 'Atletas',      Icon: Users },
  { href: '/jogos',      label: 'Jogos',        Icon: Trophy },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
