import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
import { Site } from '@datadog/browser-core/cjs/domain/intakeSites';

// Initialize Datadog RUM
export const initDatadogRUM = () => {
  console.log('Initializing Datadog RUM')
  // Only initialize if DD_RUM is available and not already initialized
  if (process.env.NODE_ENV === 'test') return
  datadogRum.init({
    applicationId: '4cd903ec-0640-4108-903c-78e7d354d29d',
    clientToken: 'pub4d4742161e2b13f8c69231110524a3b1',
    site: 'datadoghq.eu',
    service:'timewise-frontend',
    env: 'dev',
    
    // Specify a version number to identify the deployed version of your application in Datadog
    // version: '1.0.0',
    sessionSampleRate:  100,
    sessionReplaySampleRate: 20,
    defaultPrivacyLevel: 'mask-user-input',
    plugins: [reactPlugin({ router: true })],
});
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || '',
    clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || '',
    site: process.env.NEXT_PUBLIC_DD_SITE as Site || 'datadoghq.eu',
    service: process.env.NEXT_PUBLIC_DD_SERVICE || 'stundenzettel-frontend',
    env: process.env.NEXT_PUBLIC_DD_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'latest',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    plugins: [reactPlugin({ router: true })],
  })
}

// Browser-side metrics tracking
export const browserMetrics = {
  // Track user interactions
  trackAction: (actionName: string, attributes?: Record<string, any>) => {
    datadogRum.addAction(actionName, attributes)
  },

  // Track errors
  trackError: (error: Error, context?: Record<string, any>) => {
    datadogRum.addError(error, context)
  },

  // Track custom timings
  trackTiming: (name: string, time?: number) => {
    datadogRum.addTiming(name, time)
  },

  // Set user information
  setUser: (user: { id?: string; name?: string; email?: string; plan?: string }) => {
    datadogRum.setUser(user)
  },

  // Track page views
  startView: (name?: string, attributes?: Record<string, any>) => {
    datadogRum.startView(name)
  },

  stopView: (attributes?: Record<string, any>) => {
    datadogRum.stopSession()
  },

  // Track feature usage
  trackFeatureUsage: (feature: string, userId?: string) => {
    datadogRum.addAction('feature_used', { feature, userId })
  },

  // Track form submissions
  trackFormSubmission: (formName: string, success: boolean, userId?: string) => {
    datadogRum.addAction('form_submission', { formName, success, userId })
  },

  // Track button clicks
  trackButtonClick: (buttonName: string, page: string, userId?: string) => {
    datadogRum.addAction('button_click', { buttonName, page, userId })
  },

  // Track navigation
  trackNavigation: (from: string, to: string, userId?: string) => {
    datadogRum.addAction('navigation', { from, to, userId })
  },

  // Track performance metrics
  trackPerformance: (metric: string, value: number, attributes?: Record<string, any>) => {
    datadogRum.addTiming(metric, value)
  },
}
