
/** Providers that MUST receive every lead for the given service */
export const MANDATORY_RULES: Record<string, string[]> = {
  "service-1": ["Provider 1"],
  "service-2": ["Provider 5"],
  "service-3": ["Provider 1", "Provider 4"],
};

/** Ordered pools for round-robin fair selection per service */
export const FAIR_POOL_RULES: Record<string, string[]> = {
  "service-1": ["Provider 2", "Provider 3", "Provider 4"],
  "service-2": ["Provider 6", "Provider 7", "Provider 8"],
  "service-3": ["Provider 2", "Provider 3", "Provider 5", "Provider 6", "Provider 7", "Provider 8"],
};
