const sensitiveHeaderPatterns = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "apikey",
  "token",
  "secret",
  "signature",
  "webhook",
];

export const HeaderSecurityHelper = {
  isSensitive(name: string): boolean {
    const normalizedName = name.trim().toLowerCase();
    return sensitiveHeaderPatterns.some((pattern) => normalizedName === pattern || normalizedName.includes(pattern));
  },
};
