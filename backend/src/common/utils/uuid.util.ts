export function resolveApplicantUuid(applicantId: string): string {
  if (!applicantId) {
    return '00000000-0000-0000-0000-000000000123';
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId)) {
    return applicantId;
  }
  const hex = Buffer.from(applicantId).toString('hex').padStart(12, '0').slice(-12);
  return `00000000-0000-0000-0000-${hex}`;
}
