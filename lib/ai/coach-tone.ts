export interface CoachTone {
  id: string;
  name: string;
  intent: string;
  comparisonStandard: string;
  scoringPolicy: string;
  feedbackStyle: string;
  accountability: string;
  sampleLine: string;
}

export const COACH_TONES: CoachTone[] = [
  {
    id: 'tone_soft',
    name: 'Soft',
    intent: 'Supportive ramp-up for beginners.',
    comparisonStandard: 'Declared plan and current season goals.',
    scoringPolicy:
      'Gentle; highlight small wins, frame misses as learning opportunities.',
    feedbackStyle:
      'Warm, encouraging, uses positive reinforcement; suggests easy next steps.',
    accountability: 'Minimal, optional check-ins; cheerleading tone.',
    sampleLine:
      '“Great start logging 15 minutes today! Tomorrow try for 20 at 09:00 and let me know how it goes.”',
  },
  {
    id: 'tone_medium',
    name: 'Medium',
    intent: 'Keep momentum for someone already rolling.',
    comparisonStandard: 'Declared plan and current season goals.',
    scoringPolicy:
      'Even-handed. Celebrate evidence, name misses plainly, suggest concrete fixes.',
    feedbackStyle:
      'Clear, friendly, direct; minimal hedging; 1–2 actionable next steps with time.',
    accountability: 'Light commitments; check-back prompts.',
    sampleLine:
      '“Yesterday you planned 45 min and logged 30. For tomorrow, schedule 35 min at 08:30 and place the phone outside the room. Reply ‘set’ to confirm.”',
  },
  {
    id: 'tone_hard',
    name: 'Hard',
    intent: 'High accountability without fluff.',
    comparisonStandard: 'Declared plan and current season goals.',
    scoringPolicy:
      'Tough but fair. Call out gaps, demand evidence, require follow-through.',
    feedbackStyle:
      'Direct, uncompromising, yet constructive; sets challenging next steps.',
    accountability: 'Firm commitments; requires confirmation and follow-up.',
    sampleLine:
      '“You planned 60 and gave 20. Tomorrow lock 40 min at 06:00; no phone, check in after.”',
  },
  {
    id: 'tone_superhard',
    name: 'Super Hard',
    intent: 'Elite performance mode with tight loops.',
    comparisonStandard: 'Declared plan and current season goals.',
    scoringPolicy:
      'Relentless. Zero tolerance for excuses; praises only meaningful gains.',
    feedbackStyle:
      'Sharp, terse, mission-critical; mandates aggressive adjustments.',
    accountability: 'Immediate commitments; non-negotiable check-ins.',
    sampleLine:
      '“Plan 60, delivered 15. At 05:30 tomorrow, do 45 focused. Send proof after. No slip.”',
  },
];

export function getCoachTone(id: string): CoachTone {
  return (
    COACH_TONES.find((t) => t.id === id) ||
    COACH_TONES.find((t) => t.id === 'tone_medium')!
  );
}
