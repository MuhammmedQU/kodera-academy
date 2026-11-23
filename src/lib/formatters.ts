import type {
  AccountStatus,
  ApplicationStatus,
  AttemptStatus,
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

export function formatAttemptStatusAz(status: AttemptStatus): string {
  switch (status) {
    case 'passed':
      return 'Keçdi';
    case 'failed':
      return 'Uğursuz';
    case 'error':
      return 'İcra xətası';
    case 'timeout':
      return 'Vaxt limiti';
  }
}

export function formatAuditActionAz(action: string): string {
  const labels: Record<string, string> = {
    'application.approved': 'Müraciət təsdiqləndi',
    'application.rejected': 'Müraciət rədd edildi',
    'application_note.created': 'Müraciət qeydi əlavə edildi',
    'student.suspended': 'Tələbə hesabı donduruldu',
    'student.reactivated': 'Tələbə hesabı aktivləşdirildi',
    'enrollment.assigned': 'Kurs təyin edildi',
    'enrollment.revoked': 'Kurs təyinatı ləğv edildi',
    'course.created': 'Yeni kurs yaradıldı',
    'course.updated': 'Kurs yeniləndi',
    'module.created': 'Yeni modul yaradıldı',
    'module.updated': 'Modul yeniləndi',
    'module.visibility_changed': 'Modul görünürlüyü dəyişdirildi',
    'lesson.created': 'Yeni dərs yaradıldı',
    'lesson.updated': 'Dərs yeniləndi',
    'lesson_block.created': 'Dərs bloku yaradıldı',
    'lesson_block.updated': 'Dərs bloku yeniləndi',
    'lesson_block.deleted': 'Dərs bloku silindi',
    'exercise.created': 'Yeni məşq yaradıldı',
    'quiz.created': 'Yeni quiz yaradıldı',
    'settings.updated': 'Platforma tənzimləmələri yeniləndi',
  };
  return labels[action] ?? action;
}

export function slugifyAz(input: string): string {
  const map: Record<string, string> = {
    ə: 'e',
    Ə: 'e',
    ş: 's',
    Ş: 's',
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ö: 'o',
    Ö: 'o',
    ü: 'u',
    Ü: 'u',
    ı: 'i',
    İ: 'i',
  };
  return input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
 * Validates that a link URL uses an allowed safe scheme (`https:`, `mailto:`, or safe relative `/`).
 * Prevents `javascript:`, `data:`, and protocol-relative (`//` or `/\`) injection.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

/**
 * Validates that an image `src` URL uses `https:` or safe relative `/` (never `mailto:`, `javascript:`, or `data:`).
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return !import.meta.env.PROD;
    }
    return false;
  } catch {
    return false;
  }
}
