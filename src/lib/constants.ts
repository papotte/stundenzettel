export const SPECIAL_LOCATION_KEYS = [
  'SICK_LEAVE',
  'PTO',
  'BANK_HOLIDAY',
  'TIME_OFF_IN_LIEU',
] as const

export type SpecialLocationKey = (typeof SPECIAL_LOCATION_KEYS)[number]
