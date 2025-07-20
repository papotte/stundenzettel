# Subscription Workflow E2E Tests

This directory contains comprehensive Playwright tests for the subscription workflow in the TimeWise Tracker application.

## Test Files

### `subscription.spec.ts`

Comprehensive tests covering all aspects of the subscription workflow:

- Pricing page flow (individual and team subscriptions)
- Subscription management page
- Team page functionality
- Subscription guard behavior
- Navigation and integration
- Error handling

### `checkout.spec.ts`

Specialized tests for checkout and payment flows:

- Checkout session creation
- Customer portal functionality
- Team checkout flow
- Success and cancel URL handling
- Subscription state management
- Webhook integration
- Payment method management
- Subscription lifecycle

### `subscription-simple.spec.ts`

Simplified version using helper functions:

- Demonstrates cleaner, more maintainable test code
- Uses reusable helper functions
- Covers the same functionality as the comprehensive tests
- Good starting point for understanding the test structure

### `subscription-helpers.ts`

Helper functions for subscription tests:

- Common operations like login, navigation, and verification
- API mocking and interception utilities
- Error handling and state verification functions
- Mobile layout and navigation testing helpers

## Running the Tests

### Prerequisites

1. Ensure the development server is running: `npm run dev`
2. Make sure Playwright is installed: `npx playwright install`

### Run All Subscription Tests

```bash
npm run test:e2e -- subscription
```

### Run Specific Test Files

```bash
# Run comprehensive subscription tests
npm run test:e2e -- subscription.spec.ts

# Run checkout and payment tests
npm run test:e2e -- checkout.spec.ts

# Run simplified subscription tests
npm run test:e2e -- subscription-simple.spec.ts
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug -- subscription
```

### Run Tests on Specific Browsers

```bash
# Run on Chromium only
npx playwright test subscription --project=chromium

# Run on all browsers
npx playwright test subscription --project=all
```

## Test Structure

### Authentication Flow

All tests start with authentication using mock users:

- Tests redirect unauthenticated users to login
- Verify returnUrl parameters are correctly set
- Test post-login redirects back to intended pages

### Pricing Page Tests

- Display of pricing plans and billing toggles
- Handling of unauthenticated vs authenticated users
- Monthly/yearly billing period switching
- Individual vs team subscription flows

### Subscription Management Tests

- Subscription page access and display
- No subscription state handling
- Upgrade button functionality
- Manage billing button behavior

### Team Page Tests

- Team page access and display
- Coming soon functionality
- Navigation and layout verification

### Subscription Guard Tests

- Protection of subscription-required pages
- Redirect behavior for unauthenticated users
- Action button functionality (choose plan, manage subscription)

### API Integration Tests

- Checkout session creation with correct parameters
- Customer portal session creation
- Error handling for API failures
- Webhook event handling

### Error Handling Tests

- Network error scenarios
- API failure responses
- Graceful degradation of functionality

### Mobile and Navigation Tests

- Mobile layout verification
- Navigation between subscription-related pages
- Back button functionality

## Helper Functions

The `subscription-helpers.ts` file provides reusable functions:

### Authentication Helpers

- `loginWithMockUser()` - Login with a mock user
- `testAuthRedirect()` - Test authentication redirects

### Navigation Helpers

- `navigateToPricing()` - Navigate to pricing page
- `navigateToSubscription()` - Navigate to subscription page
- `navigateToTeam()` - Navigate to team page

### Interaction Helpers

- `clickPricingPlan()` - Click on pricing plan buttons
- `toggleBillingPeriod()` - Toggle between monthly/yearly
- `clickManageBilling()` - Click manage billing button
- `clickUpgrade()` - Click upgrade button

### Verification Helpers

- `verifySubscriptionState()` - Verify subscription state
- `verifySubscriptionGuard()` - Verify subscription guard behavior
- `verifyCheckoutParameters()` - Verify checkout parameters
- `verifyPortalParameters()` - Verify portal parameters

### API Helpers

- `mockApiResponse()` - Mock API responses
- `interceptApiCall()` - Intercept API calls
- `waitForLoadingState()` - Wait for loading states
- `verifyErrorHandling()` - Verify error handling

### Layout Helpers

- `verifyMobileLayout()` - Verify mobile layout
- `testNavigationFlow()` - Test navigation flows

## Test Data and Mocking

### Mock Users

Tests use the existing mock user system:

- First mock user (Raquel) for most tests
- German language interface
- Consistent test environment

### API Mocking

Tests mock various API endpoints:

- `/api/create-checkout-session` - Checkout session creation
- `/api/create-customer-portal-session` - Customer portal creation
- `/api/subscriptions/*` - Subscription data fetching
- `/api/create-team-checkout-session` - Team checkout creation

### Error Scenarios

Tests cover various error scenarios:

- Network failures (500 errors)
- Missing data responses
- Timeout scenarios
- Invalid parameter handling

## Best Practices

### Test Organization

- Group related tests using `test.describe()`
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

### Selectors

- Use role-based selectors when possible
- Support both English and German text
- Use data-testid attributes for complex elements

### Error Handling

- Always test error scenarios
- Verify graceful degradation
- Check loading states and error messages

### Mobile Testing

- Test on mobile viewports
- Verify responsive behavior
- Check touch interactions

### API Testing

- Mock external dependencies
- Verify correct parameters
- Test error responses
- Validate response handling

## Troubleshooting

### Common Issues

1. **Tests failing due to timing**
   - Add appropriate `waitFor` calls
   - Use `waitForLoadState('networkidle')` for API calls
   - Increase timeouts for slow operations

2. **Element not found**
   - Check if text is in German vs English
   - Verify element is visible before interaction
   - Use more specific selectors

3. **API mocking not working**
   - Ensure route patterns match exactly
   - Check that mocking is set up before navigation
   - Verify response format matches expectations

4. **Mobile layout issues**
   - Set viewport size before testing
   - Check for mobile-specific elements
   - Verify touch interactions work

### Debug Tips

1. **Use debug mode**

   ```bash
   npm run test:e2e:debug -- subscription
   ```

2. **Add screenshots on failure**

   ```bash
   npx playwright test subscription --reporter=html
   ```

3. **Check browser console**
   - Look for JavaScript errors
   - Verify API calls are being made
   - Check for network issues

4. **Use Playwright Inspector**
   ```bash
   npx playwright test subscription --headed
   ```

## Future Enhancements

### Planned Improvements

1. **Real Stripe Integration Tests**
   - Test with actual Stripe test environment
   - Verify webhook handling
   - Test subscription lifecycle events

2. **Performance Testing**
   - Measure page load times
   - Test with large datasets
   - Verify API response times

3. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast verification

4. **Cross-browser Testing**
   - Safari-specific issues
   - Firefox compatibility
   - Edge browser testing

### Additional Test Scenarios

1. **Subscription Upgrades/Downgrades**
2. **Payment Method Changes**
3. **Billing Cycle Changes**
4. **Team Member Management**
5. **Subscription Cancellation Flow**
6. **Trial Period Handling**

## Contributing

When adding new subscription tests:

1. **Follow existing patterns** - Use helper functions when possible
2. **Test both languages** - Support German and English interfaces
3. **Mock external dependencies** - Don't rely on external services
4. **Add error scenarios** - Test failure cases
5. **Update documentation** - Keep this README current
6. **Use descriptive names** - Make test purpose clear
7. **Group related tests** - Use appropriate describe blocks
