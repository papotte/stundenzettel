import React, { ReactNode, createContext, useContext } from 'react'

import { useTimeTracker } from '@/hooks/use-time-tracker'
import type { Toast } from '@/hooks/use-toast'

interface TimeTrackerProviderProps {
  user: { uid: string } | null
  toast: (options: Toast) => void
  t: (key: string, params?: Record<string, string | number>) => string
  children: ReactNode
}

// The type returned by useTimeTracker
// (You may want to import this type from the hook if exported)
type TimeTrackerContextType = ReturnType<typeof useTimeTracker>

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(
  undefined,
)

export const TimeTrackerProvider = ({
  user,
  toast,
  t,
  children,
}: TimeTrackerProviderProps) => {
  const value = useTimeTracker(user, toast, t)
  return (
    <TimeTrackerContext.Provider value={value}>
      {children}
    </TimeTrackerContext.Provider>
  )
}

export const useTimeTrackerContext = () => {
  const ctx = useContext(TimeTrackerContext)
  if (!ctx)
    throw new Error(
      'useTimeTrackerContext must be used within a TimeTrackerProvider',
    )
  return ctx
}
