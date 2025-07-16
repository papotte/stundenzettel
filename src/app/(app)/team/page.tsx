'use client'

import { useEffect, useState } from 'react'

import { ArrowLeft, ExternalLink, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { teamService } from '@/services/team-service'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [pageLoading, setPageLoading] = useState(true)
  const [userTeams, setUserTeams] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const fetchTeams = async () => {
        try {
          const teams = await teamService.getUserTeams(user.uid)
          setUserTeams(teams)
        } catch (error) {
          console.error('Failed to fetch user teams', error)
          toast({
            title: t('settings.errorLoadingTitle'),
            description: t('settings.errorLoadingDescription'),
            variant: 'destructive',
          })
        } finally {
          setPageLoading(false)
        }
      }
      fetchTeams()
    }
  }, [user, t, toast])

  const handleManageTeams = () => {
    window.location.href = '/teams'
  }

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mb-8 h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/tracker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTracker')}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('settings.manageTeam')}
            </CardTitle>
            <CardDescription>
              {t('settings.manageTeamDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {userTeams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t('settings.noTeams')}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('settings.noTeamsDescription')}
                </p>
                <Button onClick={handleManageTeams}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('settings.createTeam')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.teamMembers', {
                          count: team.memberCount || 0,
                        })}
                      </p>
                      {team.role && (
                        <Badge variant="secondary" className="mt-1">
                          {team.role}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageTeams}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('settings.manage')}
                    </Button>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button onClick={handleManageTeams} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('settings.manageAllTeams')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
