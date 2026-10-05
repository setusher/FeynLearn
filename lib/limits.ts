// Input caps shared by the client and the API routes.
export const LIMITS = {
  topic: 200,
  message: 2000,
  history: 40,
  notes: 6500,
  /**
   * Cap for text the server generated and the client sends back in a later
   * request (AI replies, scenarios, paragraphs). Generators clamp their output
   * to this, so a follow-up request never fails validation on our own text.
   */
  generated: 4000,
  label: 120,
} as const;

export const clamp = (text: string, max: number = LIMITS.generated) => text.trim().slice(0, max);
