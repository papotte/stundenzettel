'use client'

import { useEffect, useState } from 'react'

import {
  ArrowLeft,
  CreditCard,
  Mail,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { useTranslation } from '@/context/i18n-context'
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
} from '@/services/team-service'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnUrl=/team')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadTeamData()
    }
  }, [user])

  const loadTeamData = async () => {
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
        title: 'Error',
        description: 'Failed to load team data',
        variant: 'destructive',
      })
    } finally {
      setPageLoading(false)
    }
  }

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
                  Team Management
                </CardTitle>
                <CardDescription>
                  Create and manage your team to collaborate with others.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Team Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create a team to invite members and manage subscriptions
                    together.
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
                    Pending Invitations
                  </CardTitle>
                  <CardDescription>
                    You have been invited to join teams. Accept or decline these
                    invitations.
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
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.description || 'No description provided'}
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
                        Settings
                      </Button>
                    </TeamSettingsDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="members" className="space-y-6">
              <TabsList className="flex w-full flex-start bg-transparent p-0">
                <TabsTrigger
                  value="members"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Members ({members.length})
                </TabsTrigger>
                {(currentUserRole === 'owner' ||
                  currentUserRole === 'admin') && (
                  <TabsTrigger
                    value="invitations"
                    className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invitations ({invitations.length})
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="subscription"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your team members and their roles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamMembersList
                      teamId={team.id}
                      members={members}
                      currentUserId={user.uid}
                      currentUserRole={currentUserRole}
                      onMembersChange={handleMembersChange}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                <TabsContent value="invitations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Invitations</CardTitle>
                      <CardDescription>
                        Manage pending team invitations.
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
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
