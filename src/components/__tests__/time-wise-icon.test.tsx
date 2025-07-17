import React from 'react'

import { render, screen } from '@testing-library/react'

import TimeWiseIcon from '../time-wise-icon'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    className,
    style,
    width,
    height,
    draggable,
    decoding,
  }: any) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        width={width}
        height={height}
        data-draggable={draggable}
        data-decoding={decoding}
        data-testid="time-wise-icon"
      />
    )
  }
})

describe('TimeWiseIcon', () => {
  it('renders with default props', () => {
    render(<TimeWiseIcon />)

    const icon = screen.getByTestId('time-wise-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('src', '/favicon.png')
    expect(icon).toHaveAttribute('alt', 'TimeWise Tracker Logo')
    expect(icon).toHaveAttribute('width', '128')
    expect(icon).toHaveAttribute('height', '128')
    expect(icon).toHaveAttribute('data-draggable', 'false')
    expect(icon).toHaveAttribute('data-decoding', 'async')
  })

  it('applies custom className', () => {
    render(<TimeWiseIcon className="custom-class" />)

    const icon = screen.getByTestId('time-wise-icon')
    expect(icon).toHaveClass('custom-class')
  })

  it('applies custom style', () => {
    const customStyle = { color: 'red', fontSize: '20px' }
    render(<TimeWiseIcon style={customStyle} />)

    const icon = screen.getByTestId('time-wise-icon')
    expect(icon).toHaveStyle('color: red; font-size: 20px')
  })

  it('applies both className and style', () => {
    const customStyle = { backgroundColor: 'blue' }
    render(<TimeWiseIcon className="test-class" style={customStyle} />)

    const icon = screen.getByTestId('time-wise-icon')
    expect(icon).toHaveClass('test-class')
    expect(icon).toHaveStyle('background-color: blue')
  })

  it('renders without className and style', () => {
    render(<TimeWiseIcon />)

    const icon = screen.getByTestId('time-wise-icon')
    expect(icon).not.toHaveClass('custom-class')
    expect(icon).not.toHaveStyle('color: red')
  })
})
