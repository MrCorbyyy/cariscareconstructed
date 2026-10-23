import { describe, expect, it } from 'vitest';
import { formatDate, formatDateRange, formatFileSize, isExternal, truncate } from '@/lib/format';

describe('formatting helpers', () => {
  it('formats dates in Ghana time', () => {
    expect(formatDate('2026-07-10T00:00:00Z')).toBe('10 July 2026');
    expect(formatDate(null)).toBe('');
  });

  it('formats date ranges compactly', () => {
    expect(formatDateRange('2026-07-06T00:00:00Z', '2026-07-08T23:59:59Z', true)).toBe('6–8 July 2026');
    expect(formatDateRange('2026-06-30T00:00:00Z', '2026-07-02T00:00:00Z', true)).toBe('30 June – 2 July 2026');
    expect(formatDateRange('2026-06-03T09:00:00Z', '2026-06-03T15:00:00Z')).toBe('3 June 2026, 9:00 am – 3:00 pm GMT');
  });

  it('formats file sizes and detects external links', () => {
    expect(formatFileSize(2_400_000)).toBe('2.3 MB');
    expect(formatFileSize(512)).toBe('1 KB');
    expect(isExternal('https://summit2026.carisca.org/')).toBe(true);
    expect(isExternal('/about')).toBe(false);
  });

  it('truncates on word boundaries', () => {
    expect(truncate('Strong supply chains for strong communities', 18)).toBe('Strong supply…');
    expect(truncate('Short', 18)).toBe('Short');
  });
});
