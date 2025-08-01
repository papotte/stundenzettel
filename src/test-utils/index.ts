export * from './auth-mocks'

// Re-export common testing utilities
export { render, screen, waitFor, fireEvent } from '@jest-setup'
export { userEvent } from '@testing-library/user-event'
