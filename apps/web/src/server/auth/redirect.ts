/** A same-site path to return to after sign-in; anything else (absolute URLs, `//host`) is ignored. */
export function safeReturnPath(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  if (value.startsWith('/\\')) return fallback;
  return value;
}

/** Friendly messages for Auth.js error codes (`/signin?error=…`). */
export function signInErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'Verification':
      return 'That sign-in link has expired or was already used. Request a new one.';
    case 'OAuthAccountNotLinked':
      return 'This email is already linked to another sign-in method. Use that method instead.';
    case 'AccessDenied':
      return 'Sign-in was cancelled or denied.';
    case 'Configuration':
      return 'Sign-in is temporarily unavailable. Please try again later.';
    default:
      return 'Something went wrong while signing in. Please try again.';
  }
}
