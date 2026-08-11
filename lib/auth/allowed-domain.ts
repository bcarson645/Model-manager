/**
 * Restrict Model Manager to company email domains.
 * Set ALLOWED_EMAIL_DOMAIN (single) or ALLOWED_EMAIL_DOMAINS (comma-separated).
 * Defaults to sportradar.com.
 */
export function allowedEmailDomains(): string[] {
  const multi = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
  const single = process.env.ALLOWED_EMAIL_DOMAIN?.trim();
  const raw = multi || single || "sportradar.com";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function emailMatchesAllowedDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowedEmailDomains().includes(domain);
}

export function anyEmailMatchesAllowedDomain(
  emails: Array<string | null | undefined>
): boolean {
  return emails.some((e) => emailMatchesAllowedDomain(e));
}
