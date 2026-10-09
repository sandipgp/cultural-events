import { AARTI_DATES, SLOTS, PROGRAMS, AGE_GROUPS } from './festival.js'

// Shared defaults used by both the client (festivalContext) and server routes
// (creating events). Plain module — safe to import anywhere.

export const DEFAULT_THEME = {
  brand: '#c026a3',
  brand2: '#f97316',
  gold: '#e0a920',
  bg1: '#fff1e6', // app background gradient (top)
  bg2: '#ffe3ef', // app background gradient (bottom)
}

export const MODULE_DEFAULTS = {
  rota: { enabled: true, label: 'Aarti', dates: AARTI_DATES, slots: SLOTS },
  participation: {
    enabled: true,
    label: 'Cultural Programs',
    ageGroups: AGE_GROUPS,
    categories: PROGRAMS,
    allowOther: true,
    winners: true,
    // Home tiles this module contributes (independently toggleable).
    showForm: true, // the "Participate" tile (/program)
    showList: true, // the "Participants" tile (/program/list)
    // Which optional fields the participation form shows to users.
    fields: { ageGroup: true, flat: false, description: true },
  },
  contest: { enabled: true, label: 'Photo Contest', aiCheck: false },
  schedule: { enabled: true, label: 'Events Schedule' },
}
