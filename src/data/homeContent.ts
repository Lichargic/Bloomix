import type { Season } from '../lib/theme'

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter']

export const SEASON_MARK: Record<Season, string> = {
  spring: '✿',
  summer: '☀',
  autumn: '❦',
  winter: '❄',
}

export const WHO_CARDS = [
  {
    title: 'Students',
    body: 'Balancing coursework, deadlines, and mental health. Bloomix fits around your schedule, not the other way around.',
  },
  {
    title: 'Deadline Havers',
    body: 'Stressed and overwhelmed? Bloomix keeps you moving without piling on pressure during an already hard stretch.',
  },
  {
    title: 'Burnout Recovery',
    body: 'When doing one thing a day is a win, Bloomix celebrates that. No comparison, no leaderboards.',
  },
  {
    title: 'Anxious Overthinkers',
    body: 'The app never punishes you for being human. It just waits.',
  },
]

export const BEATS = [
  {
    stage: 0,
    tag: 'Start',
    headline: 'Plant your seed',
    body: 'Your journey begins with one task. No lengthy setup, no onboarding wall. Just you and a tiny seed.',
  },
  {
    stage: 1,
    tag: 'What is Bloomix',
    headline: "Productivity without the guilt",
    body: 'Most apps reset your streak when you miss a day. Bloomix grows a pixel tree based on your total effort, not perfect attendance.',
  },
  {
    stage: 2,
    tag: 'Add your tasks',
    headline: 'Set tasks that fit your life',
    body: 'Studying, routines, self-care. No rigid templates. Tasks reset each day. You decide what progress looks like.',
  },
  {
    stage: 3,
    tag: 'Growth, not streaks',
    headline: 'Every day you try counts',
    body: 'Growth is based on total active days, not consecutive ones. One good day moves the tree. No streaks to break.',
  },
  {
    stage: 4,
    tag: 'Miss a day',
    headline: 'Your tree goes quiet, never deleted',
    body: 'Come back whenever. Complete one task and it blooms again. No lectures, no resets.',
  },
  {
    stage: 5,
    tag: 'Recovery',
    headline: 'Built for self-compassion',
    body: 'The app just waits for you. No comparison, no leaderboards. One thing done is worth celebrating.',
  },
  {
    stage: 6,
    tag: 'Your garden',
    headline: 'Every completed tree lives on',
    body: 'A gallery of your effort across seasons. Each one earned, none deleted.',
  },
]

export const TEAM_GROUPS = [
  {
    group: 'Core Direction',
    members: [
      { name: 'Muhammad Aman Ullah', role: 'Project Lead & Lead Full-Stack Developer', github: 'https://github.com/Lichargic',     src: '/assets/team/aman.jpg' },
      { name: 'Sai Sharanya',        role: 'UI Designer & Team Coordinator',           github: 'https://github.com/sxsha777',      src: '/assets/team/sai.jpg' },
    ],
  },
  {
    group: 'Creative & Promotion',
    members: [
      { name: 'Rinoa Eamilao Cabais', role: 'Pixel Art Asset Designer',          github: '#',                                    src: '/assets/team/rinoa.jpg' },
      { name: 'Vince Michael Dizon',  role: 'Music Composer & Audio Designer',   github: '#',                                    src: '/assets/team/vince.jpg' },
      { name: 'Abrar Maawia',         role: 'Social Media & Marketing Designer', github: 'https://github.com/abrarmaawia33',     src: '/assets/team/abrar.jpg' },
    ],
  },
  {
    group: 'Support & Testing',
    members: [
      { name: 'Aysa Akther Muskan', role: 'Documentation & Research Support', github: 'https://github.com/spid3rbyte',  src: '/assets/team/aysa.jpg' },
      { name: 'Vinz Patrick',       role: 'QA & User Feedback Tester',        github: 'https://github.com/vinzzzxy222', src: '/assets/team/vinz.jpg' },
    ],
  },
]
