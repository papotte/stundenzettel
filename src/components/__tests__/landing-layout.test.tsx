import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import LandingLayout from '../landing-layout'

jest.mock('next/link', () => {
  const Link = (
    props: React.PropsWithChildren<
      React.AnchorHTMLAttributes<HTMLAnchorElement>
    >,
  ) => <a {...props}>{props.children}</a>
  Link.displayName = 'MockNextLink'
  return Link
})

jest.mock('../language-switcher', () => {
  const MockLanguageSwitcher = () => (
    <div data-testid="language-switcher">LanguageSwitcher</div>
  )
  MockLanguageSwitcher.displayName = 'MockLanguageSwitcher'
  return MockLanguageSwitcher
})

jest.mock('../time-wise-icon', () => {
  const MockTimeWiseIcon = () => <div data-testid="timewise-icon">Icon</div>
  MockTimeWiseIcon.displayName = 'MockTimeWiseIcon'
  return MockTimeWiseIcon
})

describe('LandingLayout', () => {
  it('renders top navigation, language switcher, login button, and footer', () => {
    render(
      <LandingLayout>
        <div data-testid="main-content">Main Content</div>
      </LandingLayout>,
    )
    // Top nav
    expect(screen.getByTestId('top-nav')).toBeInTheDocument()
    // Language switcher
    expect(
      screen.getAllByTestId('language-switcher').length,
    ).toBeGreaterThanOrEqual(1)
    // Login button
    expect(screen.getByTestId('login-link')).toBeVisible()
    // Footer
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    // Main content
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  it('renders legal links in the footer', () => {
    render(
      <LandingLayout>
        <div>Main Content</div>
      </LandingLayout>,
    )
    expect(screen.getByText('landing.footer.terms')).toBeInTheDocument()
    expect(screen.getByText('landing.footer.privacy')).toBeInTheDocument()
    expect(screen.getByText('landing.footer.imprint')).toBeInTheDocument()
  })

  it('footer links have correct hrefs', () => {
    render(
      <LandingLayout>
        <div>Main Content</div>
      </LandingLayout>,
    )
    expect(
      screen.getByText('landing.footer.terms').closest('a'),
    ).toHaveAttribute('href', '/terms')
    expect(
      screen.getByText('landing.footer.privacy').closest('a'),
    ).toHaveAttribute('href', '/privacy')
    expect(
      screen.getByText('landing.footer.imprint').closest('a'),
    ).toHaveAttribute('href', '/imprint')
  })

  it('top navigation links are present and correct', () => {
    render(
      <LandingLayout>
        <div>Main Content</div>
      </LandingLayout>,
    )
    expect(screen.getByText('nav.top.features').closest('a')).toHaveAttribute(
      'href',
      '/features',
    )
    expect(screen.getByText('nav.top.pricing').closest('a')).toHaveAttribute(
      'href',
      '/pricing',
    )
  })

  it('renders children', () => {
    render(
      <LandingLayout>
        <div data-testid="child-content">Child Content</div>
      </LandingLayout>,
    )
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('login button has correct href', () => {
    render(
      <LandingLayout>
        <div>Main Content</div>
      </LandingLayout>,
    )
    expect(screen.getByTestId('login-link')).toHaveAttribute('href', '/login')
  })
})
