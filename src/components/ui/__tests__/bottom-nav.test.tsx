import React from 'react'

import { render, screen } from '@jest-setup'

import BottomNav from '@/components/ui/bottom-nav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/tracker',
}))

jest.mock('@/context/subscription-context', () => ({
  useSubscriptionContext: () => ({ hasValidSubscription: true }),
}))

describe('BottomNav', () => {
  it('renders navigation with Home, Export, and Stats links', () => {
    render(<BottomNav />)
    expect(
      screen.getByRole('link', { name: /nav\.bottom\.home|Home/i }),
    ).toHaveAttribute('href', '/tracker')
    expect(
      screen.getByRole('link', { name: /nav\.bottom\.export|Export/i }),
    ).toHaveAttribute('href', '/export')
    expect(
      screen.getByRole('link', { name: /nav\.bottom\.stats|Stats/i }),
    ).toHaveAttribute('href', '/stats')
  })

  it('has accessible nav landmark', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', {
      name: 'Bottom navigation',
    })
    expect(nav).toBeInTheDocument()
  })
})
