const DEFAULT_REPO = "https://github.com/jerrodtuck/cursor-sdk-web";

export const siteLinks = {
  sdkTypeScript: "https://cursor.com/docs/sdk/typescript",
  sdkPython: "https://cursor.com/docs/sdk/python",
  apiKey: "https://cursor.com/dashboard/integrations",
  mcp: "https://cursor.com/docs/mcp",
  repo: process.env.NEXT_PUBLIC_REPO_URL?.trim() || DEFAULT_REPO,
  x: "https://x.com/jerrodtuck",
  author: "https://jerrodtuck.com",
} as const;

export type SiteLinkKey = keyof typeof siteLinks;
