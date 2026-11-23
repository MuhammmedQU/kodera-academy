import type {
  AccountStatus,
  ApplicationStatus,
  ContentStatus,
  CourseDifficulty,
  EnrollmentStatus,
} from '@shared/types/domain';

export function formatDifficultyAz(difficulty: CourseDifficulty): string {
  switch (difficulty) {
    case 'beginner':
      return 'Başlanğıc';
    case 'intermediate':
      return 'Orta səviyyə';
    case 'advanced':
      return 'İrəliləmiş';
  }
}

export function formatDurationAz(minutes: number): string {
  if (minutes <= 0) return 'Təxminən 1 saat';
  if (minutes < 60) return `${minutes} dəqiqə`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} saat` : `${hours} saat ${rem} dəq`;
}

export function formatApplicationStatusAz(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'Gözləmədə (PENDING)';
    case 'approved':
      return 'Təsdiqləndi (APPROVED)';
    case 'rejected':
      return 'Rədd edildi (REJECTED)';
  }
}

export function formatAccountStatusAz(status: AccountStatus): string {
  switch (status) {
    case 'pending':
      return 'Gözləmədə';
    case 'active':
      return 'Aktiv';
    case 'rejected':
      return 'Rədd edilib';
    case 'suspended':
      return 'Dondurulub';
    case 'archived':
      return 'Arxivlənib';
  }
}

export function formatContentStatusAz(status: ContentStatus): string {
  switch (status) {
    case 'draft':
      return 'Qaralama';
    case 'published':
      return 'Dərc olunub';
    case 'archived':
      return 'Arxivlənib';
  }
}

export function formatEnrollmentStatusAz(status: EnrollmentStatus): string {
  switch (status) {
    case 'active':
      return 'Aktiv giriş';
    case 'revoked':
      return 'Ləğv edilib';
    case 'completed':
      return 'Tamamlanıb';
  }
}

export function formatDateAz(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Validates that a URL uses an allowed safe scheme (`https:`, `http:` in dev, `mailto:`, or relative `/`).
 * Prevents `javascript:` or `data:` XSS injection in user/CMS links and images.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}
