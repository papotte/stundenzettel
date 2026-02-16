'use client'

import { useCallback, useEffect, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  CreditCard,
  FileSpreadsheet,
  Mail,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { TeamInvitationsList } from '@/components/team/team-invitations-list'
import { TeamMembersList } from '@/components/team/team-members-list'
import { TeamReportsTab } from '@/components/team/team-reports-tab'
import { TeamSettingsDialog } from '@/components/team/team-settings-dialog'
import { TeamSubscriptionCard } from '@/components/team/team-subscription-card'
import { UserInvitationsList } from '@/components/team/user-invitations-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useUserInvitations } from '@/hooks/use-user-invitations'
import { queryKeys } from '@/lib/query-keys'
import type {
  Subscription,
  Team,
  TeamInvitation,
  TeamMember,
} from '@/lib/types'
import {
  getTeamInvitations,
  getTeamMembers,
  getTeamSubscription,
  getUserInvitations,
  getUserTeam,
  onTeamSubscriptionChange,
} from '@/services/team-service'

type TeamPageData = {
  team: Team | null
  members: TeamMember[]
  invitations: TeamInvitation[]
  subscription: Subscription | null
  currentUserRole: 'owner' | 'admin' | 'member'
  userInvitations: TeamInvitation[]
}

async function fetchTeamPageData(
  userId: string,
  userEmail: string,
): Promise<TeamPageData> {
  const userTeam = await getUserTeam(userId)
  if (userTeam) {
    const [teamMembers, teamInvitations, subscriptionData] = await Promise.all([
      getTeamMembers(userTeam.id),
      getTeamInvitations(userTeam.id),
      getTeamSubscription(userTeam.id),
    ])
    const currentMember = teamMembers.find((m) => m.id === userId)
    const currentUserRole = currentMember?.role ?? 'member'
    return {
      team: userTeam,
      members: teamMembers,
      invitations: teamInvitations,
      subscription: subscriptionData,
      currentUserRole,
      userInvitations: [],
    }
  }
  const pendingInvitations = await getUserInvitations(userEmail)
  return {
    team: null,
    members: [],
    invitations: [],
    subscription: null,
    currentUserRole: 'member',
    userInvitations: pendingInvitations,
  }
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const { toast } = useToast()
  const { refreshInvitations } = useUserInvitations()

  const {
    data,
    isLoading: pageLoading,
    isError: teamDataError,
    refetch: refetchTeamData,
  } = useQuery({
    queryKey: queryKeys.teamPageData(user?.uid ?? ''),
    queryFn: () => fetchTeamPageData(user!.uid, user!.email || ''),
    enabled: Boolean(user?.uid),
  })

  const team = data?.team ?? null
  const members = data?.members ?? []
  const invitations = data?.invitations ?? []
  const userInvitations = data?.userInvitations ?? []
  const subscription = data?.subscription ?? null
  const currentUserRole = data?.currentUserRole ?? 'member'

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [selectedTab, setSelectedTab] = useState('members')

  useEffect(() => {
    const success = searchParams.get('success') === 'true'
    const cancelled = searchParams.get('cancelled') === 'true'
    const tab = searchParams.get('tab')
    if (success || cancelled || tab === 'subscription') {
      queueMicrotask(() => setSelectedTab('subscription'))
    }
    if (success) {
      toast({
        title: t('teams.subscription'),
        description: t('landing.pricing.successToast'),
        variant: 'default',
      })
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'subscription')
      setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`)
      }, 1500)
    } else if (cancelled) {
      toast({
        title: t('teams.subscription'),
        description: t('landing.pricing.cancelledToast'),
        variant: 'destructive',
      })
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'subscription')
      setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`)
      }, 1500)
    }
  }, [searchParams, pathname, toast, t, router])

  useEffect(() => {
    if (!team?.id || !user?.uid) return
    const unsubscribe = onTeamSubscriptionChange(
      team.id,
      (updatedSubscription) => {
        queryClient.setQueryData<TeamPageData>(
          queryKeys.teamPageData(user.uid),
          (prev) =>
            prev ? { ...prev, subscription: updatedSubscription } : prev,
        )
      },
    )
    return () => unsubscribe()
  }, [team?.id, user?.uid, queryClient])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/team')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (teamDataError) {
      toast({
        title: t('common.error'),
        description: t('teams.failedToLoadTeamData'),
        variant: 'destructive',
      })
    }
  }, [teamDataError, toast, t])

  const handleTeamCreated = useCallback(
    (_newTeam: Team) => {
      void refetchTeamData()
    },
    [refetchTeamData],
  )

  const handleMembersChange = useCallback(
    (updatedMembers: TeamMember[]) => {
      if (!user?.uid) return
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) => (prev ? { ...prev, members: updatedMembers } : prev),
      )
    },
    [user, queryClient],
  )

  const handleInvitationsChange = useCallback(
    (updatedInvitations: TeamInvitation[]) => {
      if (!user?.uid) return
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) => (prev ? { ...prev, invitations: updatedInvitations } : prev),
      )
    },
    [user, queryClient],
  )

  const handleInvitationSent = useCallback(
    (invitation: TeamInvitation) => {
      if (!user?.uid) return
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) =>
          prev
            ? { ...prev, invitations: [...prev.invitations, invitation] }
            : prev,
      )
    },
    [user, queryClient],
  )

  const handleUserInvitationsChange = useCallback(
    async (updatedInvitations: TeamInvitation[]) => {
      if (!user?.uid) return
      await refreshInvitations()
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) =>
          prev ? { ...prev, userInvitations: updatedInvitations } : prev,
      )
      if (updatedInvitations.length < userInvitations.length) {
        void refetchTeamData()
      }
    },
    [
      user,
      userInvitations.length,
      queryClient,
      refreshInvitations,
      refetchTeamData,
    ],
  )

  const handleSubscriptionUpdate = useCallback(
    (updatedSubscription: Subscription | null) => {
      if (!user?.uid) return
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) =>
          prev ? { ...prev, subscription: updatedSubscription } : prev,
      )
    },
    [user, queryClient],
  )

  const handleTeamUpdated = useCallback(
    (updatedTeam: Team) => {
      if (!user?.uid) return
      queryClient.setQueryData<TeamPageData>(
        queryKeys.teamPageData(user.uid),
        (prev) => (prev ? { ...prev, team: updatedTeam } : prev),
      )
    },
    [user, queryClient],
  )

  const handleTeamDeleted = useCallback(async () => {
    if (!user?.uid) return
    queryClient.setQueryData<TeamPageData>(queryKeys.teamPageData(user.uid), {
      team: null,
      members: [],
      invitations: [],
      subscription: null,
      currentUserRole: 'member',
      userInvitations: [],
    })
    await refetchTeamData()
  }, [user, queryClient, refetchTeamData])

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-muted p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
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
      <div className="mx-auto max-w-4xl">
        {!team ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('teams.title')}
                </CardTitle>
                <CardDescription>{t('teams.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {t('teams.noTeamYet')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('teams.noTeamDescription')}
                  </p>
                  <CreateTeamDialog
                    userId={user.uid}
                    userEmail={user.email || ''}
                    onTeamCreated={handleTeamCreated}
                  />
                </div>
              </CardContent>
            </Card>

            {userInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t('teams.pendingInvitations')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.pendingInvitationsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserInvitationsList
                    invitations={userInvitations}
                    onInvitationsChange={handleUserInvitationsChange}
                    onInvitationAccepted={refetchTeamData}
                    currentUserEmail={user.email || ''}
                    currentUserId={user.uid}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle
                      className="flex items-center gap-2"
                      data-testid="team-name"
                    >
                      <Users className="h-5 w-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.description || t('teams.noDescriptionProvided')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-col md:flex-row">
                    {(currentUserRole === 'owner' ||
                      currentUserRole === 'admin') && (
                      <InviteMemberDialog
                        teamId={team.id}
                        invitedBy={user.uid}
                        onInvitationSent={handleInvitationSent}
                      />
                    )}
                    <TeamSettingsDialog
                      team={team}
                      currentUserRole={currentUserRole}
                      onTeamUpdated={handleTeamUpdated}
                      onTeamDeleted={handleTeamDeleted}
                    >
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('teams.settings')}
                      </Button>
                    </TeamSettingsDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="space-y-6"
            >
              <TabsList className="flex w-full flex-start bg-transparent p-0">
                <TabsTrigger
                  value="members"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {t('teams.teamMembers')} ({members.length})
                </TabsTrigger>
                {(currentUserRole === 'owner' ||
                  currentUserRole === 'admin') && (
                  <TabsTrigger
                    value="invitations"
                    className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('teams.pendingInvitationsTab')} ({invitations.length})
                  </TabsTrigger>
                )}
                {(currentUserRole === 'owner' ||
                  currentUserRole === 'admin') && (
                  <TabsTrigger
                    value="reports"
                    className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t('reports.tab')}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="subscription"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {t('teams.subscription')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('teams.teamMembers')}</CardTitle>
                    <CardDescription>
                      {t('teams.teamMembersDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamMembersList
                      teamId={team.id}
                      members={members}
                      currentUserRole={currentUserRole}
                      subscription={subscription}
                      currentUserId={user.uid}
                      onMembersChange={handleMembersChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                <TabsContent value="invitations">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('teams.pendingInvitationsTab')}</CardTitle>
                      <CardDescription>
                        {t('teams.pendingInvitationsTabDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TeamInvitationsList
                        invitations={invitations}
                        onInvitationsChange={handleInvitationsChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                <TabsContent value="reports">
                  <TeamReportsTab teamId={team?.id ?? null} members={members} />
                </TabsContent>
              )}

              <TabsContent value="subscription">
                <TeamSubscriptionCard
                  team={team}
                  members={members}
                  subscription={subscription}
                  onSubscriptionUpdate={handleSubscriptionUpdate}
                  onMembersChange={handleMembersChange}
                  currentUserRole={currentUserRole}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
