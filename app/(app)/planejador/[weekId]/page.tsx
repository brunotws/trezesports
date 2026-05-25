import { notFound } from 'next/navigation'
import { getOrCreateWeek } from '@/lib/queries/weeks'
import { getWeekSessions, getWeekPlannedLoads } from '@/lib/queries/sessions'
import { getWeekGames } from '@/lib/queries/games'
import { weekIdToDate, formatWeekRange, prevWeekId, nextWeekId, isCurrentWeek } from '@/lib/utils/week'
import WeekGrid from '@/components/planejador/WeekGrid'
import WeekNav from '@/components/planejador/WeekNav'
import type { GridCell, Game } from '@/types'

interface Props {
  params: { weekId: string }
}

export default async function PlanejadorWeekPage({ params }: Props) {
  const { weekId } = params

  // Validate weekId format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekId)) notFound()

  const weekStart = weekIdToDate(weekId)
  const week = await getOrCreateWeek(weekId)

  const [sessions, games] = await Promise.all([
    getWeekSessions(week.id),
    getWeekGames(weekId),
  ])

  const plannedLoads = await getWeekPlannedLoads(sessions.map(s => s.id))
  const loadMap = Object.fromEntries(plannedLoads.map(l => [l.session_id, l.planned_load]))

  // Build set of blocked dates (game days + vésperas)
  const _gameDates = new Set(games.map(g => g.date))
  const vesperaDates = new Set(
    games.filter(g => g.blocks_day_before).map(g => {
      const d = new Date(g.date + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      return d.toISOString().split('T')[0]
    })
  )
  const gameByDate = Object.fromEntries(games.map(g => [g.date, g])) as Record<string, Game>

  // Build 7×3 grid cells
  const cells: GridCell[] = []
  for (let day = 0; day < 7; day++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]

    for (let sn = 1; sn <= 3; sn++) {
      const session = sessions.find(s => s.day_of_week === day && s.session_number === sn) ?? null
      cells.push({
        dayOfWeek:     day,
        sessionNumber: sn,
        session,
        plannedLoad:   session ? (loadMap[session.id] ?? 0) : 0,
        game:          gameByDate[dateStr] ?? null,
        isVespera:     vesperaDates.has(dateStr),
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <WeekNav
        weekId={weekId}
        label={formatWeekRange(weekStart)}
        prevId={prevWeekId(weekId)}
        nextId={nextWeekId(weekId)}
        isCurrent={isCurrentWeek(weekId)}
      />
      <WeekGrid weekId={week.id} weekStartDate={weekId} cells={cells} />
    </div>
  )
}
