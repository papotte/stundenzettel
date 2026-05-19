import { Timestamp } from 'firebase/firestore'

/**
 * Recursively removes keys whose value is `undefined` so data is safe for
 * `setDoc` / `addDoc` / `updateDoc` (Firestore rejects undefined).
 */
export function clearUndefinedValues(value: unknown): unknown {
  if (value === null) return null
  if (isFirestoreTimestamp(value)) return value
  if (Array.isArray(value)) {
    return value.map((item) => clearUndefinedValues(item))
  }
  if (isPlainRecord(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue
      out[k] = clearUndefinedValues(v)
    }
    return out
  }
  return value
}

function isFirestoreTimestamp(value: unknown): boolean {
  if (
    typeof Timestamp === 'function' &&
    typeof value === 'object' &&
    value !== null &&
    value instanceof Timestamp
  ) {
    return true
  }
  // Tests may mock `Timestamp` without a constructor; real SDK timestamps
  // expose seconds/nanoseconds + toDate.
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const o = value as Record<string, unknown>
  return (
    typeof o.toDate === 'function' &&
    typeof o.seconds === 'number' &&
    typeof o.nanoseconds === 'number'
  )
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  if (isFirestoreTimestamp(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
