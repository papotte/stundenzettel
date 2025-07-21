import { render, screen } from '@testing-library/react'

import ColorfulBackground from '../colorful-background'

describe('ColorfulBackground', () => {
  it('renders children correctly', () => {
    render(
      <ColorfulBackground>
        <div data-testid="test-content">Test Content</div>
      </ColorfulBackground>,
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ColorfulBackground className="custom-class">
        <div>Test Content</div>
      </ColorfulBackground>,
    )

    const container = screen.getByText('Test Content').parentElement
    expect(container).toHaveClass('custom-class')
    expect(container).toHaveClass('relative')
    expect(container).toHaveClass('isolate')
  })

  it('renders without className', () => {
    render(
      <ColorfulBackground>
        <div>Test Content</div>
      </ColorfulBackground>,
    )

    const container = screen.getByText('Test Content').parentElement
    expect(container).toHaveClass('relative')
    expect(container).toHaveClass('isolate')
  })
})
