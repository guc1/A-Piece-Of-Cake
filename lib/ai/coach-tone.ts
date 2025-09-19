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
  {
    id: 'tone_custom',
    name: 'Custom',
    intent: 'Use the instructions you wrote below to define the tone.',
    comparisonStandard:
      'Follow the standards described in the custom instructions.',
    scoringPolicy:
      'Grade exactly how the custom instructions specify; ignore presets.',
    feedbackStyle:
      'Match the language, empathy, or edge described in the custom brief.',
    accountability:
      'Honor the accountability rules detailed in the custom instructions.',
    sampleLine:
      '“This tone is fully driven by the custom brief you provide in settings.”',
  },
];

export const CUSTOM_COACH_TEMPLATE = `{
  "id": "tone_custom",
  "name": "Custom",
  "intent": "Describe the core intent or philosophy for your coach.",
  "comparisonStandard": "Explain what progress is measured against.",
  "scoringPolicy": "Detail how the coach should grade wins and misses.",
  "feedbackStyle": "Share the voice, language, and energy you want.",
  "accountability": "Clarify follow-up expectations and commitments.",
  "sampleLine": "Write an example line your coach might say."
}`;

export function getCoachTone(id: string): CoachTone {
  return (
    COACH_TONES.find((t) => t.id === id) ||
    COACH_TONES.find((t) => t.id === 'tone_medium')!
  );
}

export function isCustomTone(id: string): boolean {
  return id === 'tone_custom';
}

export function getCoachTonePrompt(
  id: string,
  customInstructions?: string,
): string {
  if (isCustomTone(id)) {
    const trimmed = customInstructions?.trim();
    if (trimmed) {
      return trimmed;
    }
    // Fall back to medium tone instructions if no custom text is available.
    return JSON.stringify(getCoachTone('tone_medium'), null, 2);
  }
  return JSON.stringify(getCoachTone(id), null, 2);
}
