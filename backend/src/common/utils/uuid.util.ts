export function resolveApplicantUuid(applicantId: string): string {
  if (!applicantId || applicantId === 'default' || applicantId === '123') {
    return '00000000-0000-0000-0000-000000000123';
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicantId)) {
    return applicantId;
  }
  if (applicantId === 'abc' || applicantId === 'demo-fully-populated-123' || applicantId === 'demo-applicant-123' || applicantId.includes('rahul')) {
    return '00000000-0000-0000-0000-000000000123';
  }
  if (applicantId === 'demo-fresh-1' || applicantId.includes('sarah') || applicantId.includes('nurse')) {
    return '00000000-0000-0000-0000-000000000002';
  }
  if (applicantId === 'demo-fresh-2' || applicantId.includes('devon') || applicantId.includes('cloud')) {
    return '00000000-0000-0000-0000-000000000003';
  }
  const hex = Buffer.from(applicantId).toString('hex').padStart(12, '0').slice(-12);
  return `00000000-0000-0000-0000-${hex}`;
}

