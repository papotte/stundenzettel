import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '../password-input'

// Mock for react-hook-form field
const createMockField = (value = '') => ({
  name: 'password',
  value,
  onChange: jest.fn(),
  onBlur: jest.fn(),
  ref: jest.fn(),
})

describe('PasswordInput Component', () => {
  const defaultProps = {
    field: createMockField(),
    showPassword: false,
    onToggleVisibility: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders password input with correct type when showPassword is false', () => {
    render(<PasswordInput {...defaultProps} data-testid="password-input" />)
    
    const input = screen.getByTestId('password-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders text input when showPassword is true', () => {
    render(
      <PasswordInput 
        {...defaultProps} 
        showPassword={true} 
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('displays placeholder text when provided', () => {
    const placeholder = 'Enter your password'
    render(
      <PasswordInput 
        {...defaultProps} 
        placeholder={placeholder}
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    expect(input).toHaveAttribute('placeholder', placeholder)
  })

  it('renders disabled input when disabled prop is true', () => {
    render(
      <PasswordInput 
        {...defaultProps} 
        disabled={true}
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    const toggleButton = screen.getByRole('button')
    
    expect(input).toBeDisabled()
    expect(toggleButton).toBeDisabled()
  })

  it('displays Eye icon when password is hidden', () => {
    render(
      <PasswordInput 
        {...defaultProps} 
        showPassword={false}
        toggleTestId="toggle-button"
      />
    )
    
    const toggleButton = screen.getByTestId('toggle-button')
    const eyeIcon = toggleButton.querySelector('svg')
    expect(eyeIcon).toBeInTheDocument()
  })

  it('displays EyeOff icon when password is visible', () => {
    render(
      <PasswordInput 
        {...defaultProps} 
        showPassword={true}
        toggleTestId="toggle-button"
      />
    )
    
    const toggleButton = screen.getByTestId('toggle-button')
    const eyeOffIcon = toggleButton.querySelector('svg')
    expect(eyeOffIcon).toBeInTheDocument()
  })

  it('calls onToggleVisibility when toggle button is clicked', async () => {
    const user = userEvent.setup()
    const mockToggle = jest.fn()
    
    render(
      <PasswordInput 
        {...defaultProps} 
        onToggleVisibility={mockToggle}
        toggleTestId="toggle-button"
      />
    )
    
    const toggleButton = screen.getByTestId('toggle-button')
    await user.click(toggleButton)
    
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('calls field.onChange when input value changes', async () => {
    const user = userEvent.setup()
    const mockField = createMockField()
    
    render(
      <PasswordInput 
        {...defaultProps} 
        field={mockField}
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    await user.type(input, 'test123')
    
    expect(mockField.onChange).toHaveBeenCalled()
  })

  it('calls field.onBlur when input loses focus', async () => {
    const user = userEvent.setup()
    const mockField = createMockField()
    
    render(
      <PasswordInput 
        {...defaultProps} 
        field={mockField}
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    await user.click(input)
    await user.tab()
    
    expect(mockField.onBlur).toHaveBeenCalled()
  })

  it('displays the field value correctly', () => {
    const fieldValue = 'mypassword123'
    const mockField = createMockField(fieldValue)
    
    render(
      <PasswordInput 
        {...defaultProps} 
        field={mockField}
        data-testid="password-input" 
      />
    )
    
    const input = screen.getByTestId('password-input')
    expect(input).toHaveValue(fieldValue)
  })

  it('has correct accessibility attributes', () => {
    render(
      <PasswordInput 
        {...defaultProps}
        data-testid="password-input" 
        toggleTestId="toggle-button"
      />
    )
    
    const toggleButton = screen.getByTestId('toggle-button')
    expect(toggleButton).toHaveAttribute('type', 'button')
  })
})