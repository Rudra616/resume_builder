/** Shared field validators used by the editor forms and the assistant rules. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** Accepts international formats without being prescriptive about separators. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Suggests a conventionally formatted phone number where we can infer one. */
export function formatPhoneHint(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 12 && value.trim().startsWith("+")) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return null;
}

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!url.hostname.includes(".")) return false;
    // Reject hostnames with spaces or an invalid TLD.
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function isLinkedInUrl(value: string): boolean {
  return isValidUrl(value) && /linkedin\.com\/(in|pub|company)\//i.test(value);
}

export function isGitHubUrl(value: string): boolean {
  return isValidUrl(value) && /github\.(com|io)\//i.test(value.replace(/\/$/, "") + "/");
}
