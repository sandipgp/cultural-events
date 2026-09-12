// Central place for event-wide constants — change the society name or the
// festival dates here and every screen updates.
export const SOCIETY_NAME = 'Vivantalife Vedika'
export const FESTIVAL = 'Ganeshotsav 2026'

// Aarti runs 14–20 Sep. Stored as these exact strings.
export const AARTI_DATES = [
  '14 Sep',
  '15 Sep',
  '16 Sep',
  '17 Sep',
  '18 Sep',
  '19 Sep',
  '20 Sep',
]
export const SLOTS = ['Morning', 'Evening']

// Cultural program categories (multi-select on the Participate form).
export const PROGRAMS = ['Dance', 'Drama', 'Fancy Dress', 'Singing']

// Helpers for sorting list rows in a sensible order.
export const dateIndex = (d) => AARTI_DATES.indexOf(d)
export const slotIndex = (s) => SLOTS.indexOf(s)
