export interface LlmSetup {
  provider: 'openai';
  model: string;
  temperature: number;
  top_p: number;
  maxTokens: number;
}

export const DEFAULT_LLM_SETUP: LlmSetup = {
  provider: 'openai',
  model: 'gpt-4.1',
  temperature: 0.2,
  top_p: 1,
  maxTokens: 800,
};

export function withOverrides(
  base: LlmSetup,
  overrides?: Partial<LlmSetup>,
): LlmSetup {
  return { ...base, ...overrides };
}
