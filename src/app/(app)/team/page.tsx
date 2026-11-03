'use client'

import { useEffect, useState } from 'react'

import {
  CreditCard,
  FileSpreadsheet,
  Mail,
  Settings,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ProjectsCard } from '@/components/projects-card'
import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { TeamInvitationsList } from '@/components/team/team-invitations-list'
import { TeamMembersList } from '@/components/team/team-members-list'
import { TeamOptionsCard } from '@/components/team/team-options-card'
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
import { useTeamPageData, useTeamSubscriptionListener } from '@/hooks/use-team'
import { useToast } from '@/hooks/use-toast'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

  const { toast } = useToast()

  const {
    data,
    isLoading: pageLoading,
    isError: teamDataError,
  } = useTeamPageData(user)

  const team = data?.team ?? null
  const members = data?.members ?? []
  const invitations = data?.invitations ?? []
  const userInvitations = data?.userInvitations ?? []
  const subscription = data?.subscription ?? null
  const currentUserRole = data?.currentUserRole ?? 'member'
  const hasWritePermissions =
    currentUserRole === 'owner' || currentUserRole === 'admin'

  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Use state for tab, but initialize to 'members' and update in useEffect
  const [selectedTab, setSelectedTab] = useState('members')

  // Sync the selected tab from URL params when they change (render-time state adjustment).
  const searchParamsString = searchParams.toString()
  const [prevSearchParamsString, setPrevSearchParamsString] =
    useState(searchParamsString)
  if (prevSearchParamsString !== searchParamsString) {
    setPrevSearchParamsString(searchParamsString)
    const tab = searchParams.get('tab')
    if (tab && ['members', 'subscription', 'team-settings'].includes(tab)) {
      setSelectedTab(tab)
    }
    if (
      searchParams.get('success') === 'true' ||
      searchParams.get('cancelled') === 'true'
    ) {
      setSelectedTab('subscription')
    }
  }

  // On mount or when searchParams changes, handle checkout flags.
  useEffect(() => {
    const success = searchParams.get('success') === 'true'
    const cancelled = searchParams.get('cancelled') === 'true'
    if (success) {
      toast({
        title: t('teams.subscription'),
        description: t('landing.pricing.successToast'),
        variant: 'default',
      })
      // Remove success/cancelled, add tab=subscription
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

  // Bridge the Firestore realtime subscription listener into the cache.
  useTeamSubscriptionListener(team?.id, user?.uid)

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
    <div className="min-h-screen bg-muted p-4 pb-20 sm:p-8 md:pb-8">
      <div className="mx-auto max-w-4xl">
        {!team ? (
          // No team - show create team option and pending invitations
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  {t('teams.title')}
                </CardTitle>
                <CardDescription>{t('teams.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">
                    {t('teams.noTeamYet')}
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    {t('teams.noTeamDescription')}
                  </p>
                  <CreateTeamDialog
                    userId={user.uid}
                    userEmail={user.email || ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Show pending invitations if any */}
            {userInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="size-5" />
                    {t('teams.pendingInvitations')}
                  </CardTitle>
                  <CardDescription>
                    {t('teams.pendingInvitationsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserInvitationsList invitations={userInvitations} />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Has team - show team management interface
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle
                      className="flex items-center gap-2"
                      data-testid="team-name"
                    >
                      <Users className="size-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.description || t('teams.noDescriptionProvided')}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row">
                    {hasWritePermissions && (
                      <InviteMemberDialog
                        teamId={team.id}
                        invitedBy={user.uid}
                      />
                    )}
                    <TeamSettingsDialog
                      team={team}
                      currentUserRole={currentUserRole}
                    >
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 size-4" />
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
              <TabsList className="flex w-full items-start justify-start bg-transparent p-0">
                <TabsTrigger
                  value="members"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Users className="size-4" />
                  {t('teams.teamMembers')} ({members.length})
                </TabsTrigger>
                {hasWritePermissions && (
                  <TabsTrigger
                    value="invitations"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <UserPlus className="size-4" />
                    {t('teams.pendingInvitationsTab')} ({invitations.length})
                  </TabsTrigger>
                )}
                {hasWritePermissions && (
                  <TabsTrigger
                    value="reports"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <FileSpreadsheet className="size-4" />
                    {t('reports.tab')}
                  </TabsTrigger>
                )}
                {hasWritePermissions && (
                  <TabsTrigger
                    value="team-settings"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <SlidersHorizontal className="size-4" />
                    {t('teams.teamWideSettings')}
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="subscription"
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <CreditCard className="size-4" />
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
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {hasWritePermissions && (
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
                        teamId={team.id}
                        invitations={invitations}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {hasWritePermissions && (
                <TabsContent value="reports">
                  <TeamReportsTab teamId={team?.id ?? null} members={members} />
                </TabsContent>
              )}

              {hasWritePermissions && (
                <TabsContent value="team-settings">
                  <div className="space-y-6">
                    <TeamOptionsCard
                      teamId={team.id}
                      canEdit={hasWritePermissions}
                    />
                    <ProjectsCard
                      scope={{ kind: 'team', teamId: team.id }}
                      canEdit={hasWritePermissions}
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="subscription">
                <TeamSubscriptionCard
                  team={team}
                  members={members}
                  subscription={subscription}
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
