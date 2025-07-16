'use client'

import React, { useEffect, useState } from 'react'

import { CreditCard, Plus, Settings, UserPlus, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTranslation } from '@/context/i18n-context'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Subscription, Team, TeamMember } from '@/lib/types'
import { paymentService } from '@/services/payment-service'
import { subscriptionService } from '@/services/subscription-service'
import { teamService } from '@/services/team-service'

export default function TeamsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamSubscription, setTeamSubscription] = useState<Subscription | null>(
    null,
  )

  useEffect(() => {
    if (user) {
      loadUserTeams()
    }
  }, [user])

  useEffect(() => {
    if (selectedTeam) {
      loadTeamDetails(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadUserTeams = async () => {
    if (!user) return

    try {
      const userTeams = await teamService.getUserTeams(user.uid)
      setTeams(userTeams)

      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0])
      }
    } catch (error) {
      console.error('Error loading teams:', error)
      toast({
        title: t('teams.errorLoadingTitle'),
        description: t('teams.errorLoadingDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTeamDetails = async (teamId: string) => {
    try {
      const [members, subscription] = await Promise.all([
        teamService.getTeamMembers(teamId),
        teamService.getTeamSubscription(teamId),
      ])

      setTeamMembers(members)
      setTeamSubscription(subscription)
    } catch (error) {
      console.error('Error loading team details:', error)
    }
  }

  const handleCreateTeam = () => {
    window.location.href = '/teams/create'
  }

  const handleManageSubscription = async (team: Team) => {
    if (!user) return

    try {
      const { url } = await paymentService.createCustomerPortalSession(
        user.uid,
        `${window.location.origin}/teams`,
      )
      await paymentService.redirectToCustomerPortal(url)
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      toast({
        title: t('teams.errorPortalTitle'),
        description: t('teams.errorPortalDescription'),
        variant: 'destructive',
      })
    }
  }

  const handleUpgradeTeam = async (team: Team) => {
    const teamPlans = paymentService.getTeamPlans()
    if (teamPlans.length > 0) {
      window.location.href = `/teams/${team.id}/upgrade`
    }
  }

  const handleInviteMember = (team: Team) => {
    window.location.href = `/teams/${team.id}/invite`
  }

  const handleManageTeam = (team: Team) => {
    window.location.href = `/teams/${team.id}/settings`
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 pb-20 md:pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('teams.title')}
            </h1>
            <p className="text-gray-600 mt-2">{t('teams.subtitle')}</p>
          </div>
          <Button onClick={handleCreateTeam} className="mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('teams.createTeam')}
          </Button>
        </div>

        {teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('teams.noTeamsTitle')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('teams.noTeamsDescription')}
              </p>
              <Button onClick={handleCreateTeam}>
                <Plus className="mr-2 h-4 w-4" />
                {t('teams.createFirstTeam')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Team List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t('teams.yourTeams')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {team.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {team.description}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {team.ownerId === user?.uid
                            ? t('teams.owner')
                            : t('teams.member')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Team Details */}
            {selectedTeam && (
              <div className="lg:col-span-2 space-y-6">
                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTeam.name}</CardTitle>
                        <CardDescription>
                          {selectedTeam.description}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInviteMember(selectedTeam)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t('teams.inviteMember')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageTeam(selectedTeam)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {t('teams.manage')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Subscription Status */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <CardTitle>{t('teams.subscription')}</CardTitle>
                      </div>
                      <Badge
                        variant={
                          subscriptionService.isSubscriptionActive(
                            teamSubscription,
                          )
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {subscriptionService.formatSubscriptionStatus(
                          teamSubscription,
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamSubscription ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">
                              {t('teams.currentPeriod')}:
                            </span>
                            <p className="font-medium">
                              {teamSubscription.currentPeriodStart.toLocaleDateString()}{' '}
                              -{' '}
                              {teamSubscription.currentPeriodEnd.toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              {t('teams.licensedUsers')}:
                            </span>
                            <p className="font-medium">
                              {teamSubscription.quantity || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleManageSubscription(selectedTeam)
                            }
                          >
                            {t('teams.manageBilling')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpgradeTeam(selectedTeam)}
                          >
                            {t('teams.upgrade')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">
                          {t('teams.noSubscription')}
                        </p>
                        <Button onClick={() => handleUpgradeTeam(selectedTeam)}>
                          {t('teams.getStarted')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t('teams.members')} ({teamMembers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{member.email}</p>
                            <p className="text-sm text-gray-600">
                              {t(`teams.roles.${member.role}`)} •{' '}
                              {t('teams.joined')}{' '}
                              {member.joinedAt.toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {t(`teams.roles.${member.role}`)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
