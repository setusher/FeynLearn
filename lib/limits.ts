// Input caps shared by the client and the API routes.
export const LIMITS = {
  topic: 200,
  message: 2000,
  history: 40,
  notes: 6500,
} as const;
