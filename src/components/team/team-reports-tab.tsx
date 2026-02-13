'use client'

import { useState } from 'react'

import { ChevronLeft, ChevronRight, Grid3x3, List } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TeamMemberReportView } from '@/components/team/team-member-report-view'
import { TeamReportsGrid } from '@/components/team/team-reports-grid'
import { TeamReportsList } from '@/components/team/team-reports-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFormatter } from '@/lib/date-formatter'
import type { TeamMember } from '@/lib/types'

interface TeamReportsTabProps {
  teamId: string | null
  members: TeamMember[]
}

export function TeamReportsTab({ teamId, members }: TeamReportsTabProps) {
  const t = useTranslations()
  const format = useFormatter()
  const [reportsViewMode, setReportsViewMode] = useState<'grid' | 'list'>(
    'grid',
  )
  const [reportsSelectedMonth, setReportsSelectedMonth] = useState<Date>(
    new Date(),
  )
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isMemberReportOpen, setIsMemberReportOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('reports.title')}</CardTitle>
              <CardDescription>{t('reports.subtitle')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border p-1">
                <Button
                  variant={reportsViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setReportsViewMode('grid')}
                  className="h-8"
                  aria-label={t('reports.viewGrid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={reportsViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setReportsViewMode('list')}
                  className="h-8"
                  aria-label={t('reports.viewList')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setReportsSelectedMonth(
                  new Date(
                    reportsSelectedMonth.getFullYear(),
                    reportsSelectedMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              data-testid="reports-previous-month-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold" data-testid="reports-month">
              {format.dateTime(reportsSelectedMonth, 'monthYear')}
            </h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setReportsSelectedMonth(
                  new Date(
                    reportsSelectedMonth.getFullYear(),
                    reportsSelectedMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              data-testid="reports-next-month-button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {reportsViewMode === 'grid' ? (
            <TeamReportsGrid
              teamId={teamId}
              members={members}
              selectedMonth={reportsSelectedMonth}
              onMemberClick={(memberId) => {
                setSelectedMemberId(memberId)
                setIsMemberReportOpen(true)
              }}
            />
          ) : (
            <TeamReportsList
              teamId={teamId}
              members={members}
              selectedMonth={reportsSelectedMonth}
              onMemberClick={(memberId) => {
                setSelectedMemberId(memberId)
                setIsMemberReportOpen(true)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Member Report Dialog */}
      {selectedMemberId && (
        <Dialog
          open={isMemberReportOpen}
          onOpenChange={(open) => {
            setIsMemberReportOpen(open)
            if (!open) {
              setSelectedMemberId(null)
            }
          }}
        >
          <DialogContent className="max-w-[80vw] max-h-[80vh] w-full overflow-y-auto !border-0 !bg-white !p-0 !shadow-none [&>button]:hidden">
            <DialogHeader className="hidden">
              <DialogTitle className="sr-only">
                {selectedMemberId
                  ? `${t('reports.viewReport')} - ${
                      members.find((m) => m.id === selectedMemberId)?.email ||
                      ''
                    }`
                  : t('reports.title')}
              </DialogTitle>
            </DialogHeader>
            {selectedMemberId && (
              <TeamMemberReportView
                teamId={teamId}
                memberId={selectedMemberId}
                memberEmail={
                  members.find((m) => m.id === selectedMemberId)?.email || ''
                }
                selectedMonth={reportsSelectedMonth}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
