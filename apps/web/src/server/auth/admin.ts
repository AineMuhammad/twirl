/** Whether `email` is in the comma-separated `ADMIN_EMAILS` list (case-insensitive). */
export function isAdminEmail(email: string | null | undefined, adminEmails: string | undefined) {
  if (!email || !adminEmails) return false;
  const wanted = email.trim().toLowerCase();
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .some((e) => e !== '' && e === wanted);
}
