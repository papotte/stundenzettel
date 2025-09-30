'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  ArrowLeft,
  CreditCard,
  Mail,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { TeamInvitationsList } from '@/components/team/team-invitations-list'
import { TeamMembersList } from '@/components/team/team-members-list'
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

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

  const { toast } = useToast()
  const { refreshInvitations } = useUserInvitations()

  const [pageLoading, setPageLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [userInvitations, setUserInvitations] = useState<TeamInvitation[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<
    'owner' | 'admin' | 'member'
  >('member')

  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Use state for tab, but initialize to 'members' and update in useEffect
  const [selectedTab, setSelectedTab] = useState('members')

  // On mount or when searchParams changes, check for ?success, ?cancelled, or ?tab=subscription
  useEffect(() => {
    const success = searchParams.get('success') === 'true'
    const cancelled = searchParams.get('cancelled') === 'true'
    const tab = searchParams.get('tab')
    if (success || cancelled || tab === 'subscription') {
      setSelectedTab('subscription')
    }
    if (success) {
      toast({
        title: t('teams.subscription'),
        description: t('pricing.successToast'),
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
        description: t('pricing.cancelledToast'),
        variant: 'destructive',
      })
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'subscription')
      setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`)
      }, 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname, toast, t, router])

  const loadTeamData = useCallback(async () => {
    if (!user) return

    try {
      // Load user's team
      const userTeam = await getUserTeam(user.uid)
      if (userTeam) {
        setTeam(userTeam)

        // Load team members
        const teamMembers = await getTeamMembers(userTeam.id)
        setMembers(teamMembers)

        // Find current user's role
        const currentMember = teamMembers.find(
          (m: TeamMember) => m.id === user.uid,
        )
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
        }

        // Load team invitations (if admin/owner)
        const teamInvitations = await getTeamInvitations(userTeam.id)
        setInvitations(teamInvitations)

        // Load team subscription
        const subscriptionData = await getTeamSubscription(userTeam.id)
        setSubscription(subscriptionData)
      } else {
        // User doesn't have a team, load their pending invitations
        const pendingInvitations = await getUserInvitations(user.email || '')
        setUserInvitations(pendingInvitations)
      }
    } catch (error) {
      console.error('Error loading team data:', error)
      toast({
        title: t('common.error'),
        description: t('teams.failedToLoadTeamData'),
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }, [user, toast, t])

  // Set up real-time subscription listener when team is loaded
  useEffect(() => {
    if (!team?.id) return

    // Set up real-time subscription listener
    const unsubscribe = onTeamSubscriptionChange(
      team.id,
      (updatedSubscription) => {
        setSubscription(updatedSubscription)
      },
    )

    // Cleanup subscription on unmount or when team changes
    return () => {
      unsubscribe()
    }
  }, [team?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/team')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadTeamData()
    }
  }, [user, loadTeamData])

  const handleTeamCreated = (newTeam: Team) => {
    setTeam(newTeam)
    setCurrentUserRole('owner')
    loadTeamData() // Reload to get complete data
  }

  const handleMembersChange = (updatedMembers: TeamMember[]) => {
    setMembers(updatedMembers)
  }

  const handleInvitationsChange = (updatedInvitations: TeamInvitation[]) => {
    setInvitations(updatedInvitations)
  }

  const handleInvitationSent = (invitation: TeamInvitation) => {
    setInvitations((prev) => [...prev, invitation])
  }

  const handleUserInvitationsChange = async (
    updatedInvitations: TeamInvitation[],
  ) => {
    setUserInvitations(updatedInvitations)
    // Refresh the global invitations state for the user menu
    await refreshInvitations()

    // If invitations were reduced (one was accepted), reload team data
    // This handles the case where user accepts an invitation and joins a team
    if (updatedInvitations.length < userInvitations.length) {
      await loadTeamData()
    }
  }

  const handleSubscriptionUpdate = (
    updatedSubscription: Subscription | null,
  ) => {
    setSubscription(updatedSubscription)
  }

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeam(updatedTeam)
  }

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
        <Button asChild variant="outline" className="mb-8">
          <Link href="/tracker">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToTracker')}
          </Link>
        </Button>

        {!team ? (
          // No team - show create team option and pending invitations
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

            {/* Show pending invitations if any */}
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
                    onInvitationAccepted={loadTeamData}
                    currentUserEmail={user.email || ''}
                    currentUserId={user.uid}
                  />
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
                      <Users className="h-5 w-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.description || t('teams.noDescriptionProvided')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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

              <TabsContent value="subscription">
                <TeamSubscriptionCard
                  team={team}
                  members={members}
                  subscription={subscription}
                  onSubscriptionUpdate={handleSubscriptionUpdate}
                  onMembersChange={handleMembersChange}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
