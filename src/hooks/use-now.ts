import { useState } from 'react'

/**
 * Returns the date/time captured once when the component mounts.
 * Use instead of calling `new Date()` during render, which is impure.
 * For time displays that must tick, add an interval in an effect instead.
 */
export function useNow(): Date {
  const [now] = useState(() => new Date())
  return now
}
