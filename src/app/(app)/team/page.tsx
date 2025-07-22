'use client'

import { useEffect, useState } from 'react'

import { ArrowLeft, Users, Settings, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { TeamMembersList } from '@/components/team/team-members-list'
import { TeamInvitationsList } from '@/components/team/team-invitations-list'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Team, TeamMember, TeamInvitation, Subscription } from '@/lib/types'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  
  const [pageLoading, setPageLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member')

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
      const teamResponse = await fetch(`/api/teams?userId=${user.uid}`)
      if (teamResponse.ok) {
        const { team: userTeam } = await teamResponse.json()
        if (userTeam) {
          setTeam(userTeam)
          
          // Load team members
          const membersResponse = await fetch(`/api/teams/${userTeam.id}/members`)
          if (membersResponse.ok) {
            const { members: teamMembers } = await membersResponse.json()
            setMembers(teamMembers)
            
            // Find current user's role
            const currentMember = teamMembers.find((m: TeamMember) => m.email === user.email)
            if (currentMember) {
              setCurrentUserRole(currentMember.role)
            }
          }
          
          // Load team invitations (if admin/owner)
          const invitationsResponse = await fetch(`/api/teams/${userTeam.id}/invitations`)
          if (invitationsResponse.ok) {
            const { invitations: teamInvitations } = await invitationsResponse.json()
            setInvitations(teamInvitations)
          }
        }
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
    setInvitations(prev => [...prev, invitation])
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
          // No team - show create team option
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
                <h3 className="text-lg font-medium mb-2">
                  No Team Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create a team to invite members and manage subscriptions together.
                </p>
                <CreateTeamDialog userId={user.uid} onTeamCreated={handleTeamCreated} />
              </div>
            </CardContent>
          </Card>
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
                  {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                    <div className="flex gap-2">
                      <InviteMemberDialog
                        teamId={team.id}
                        invitedBy={user.uid}
                        onInvitationSent={handleInvitationSent}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="members" className="space-y-4">
              <TabsList>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                  <TabsTrigger value="invitations">
                    Invitations ({invitations.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Team Subscription
                    </CardTitle>
                    <CardDescription>
                      Manage your team's subscription and seat assignments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Subscription Management
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Team subscription features will be available soon.
                      </p>
                      <Button variant="outline" disabled>
                        Manage Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
