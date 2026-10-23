import { Download, FileText } from 'lucide-react';
import { fileTypeLabel, formatFileSize } from '@/lib/format';
import type { Media } from '@/types/api';

/** Download link with file type and size, as recommended for accessible document links. */
export function FileDownload({ file, label, compact = false }: { file: Media; label?: string; compact?: boolean }) {
  const type = fileTypeLabel(file.mime_type);
  const size = formatFileSize(file.size_bytes);
  const text = label ?? file.title ?? file.original_name;
  if (compact) {
    return (
      <a href={file.url} className="link inline-flex items-center gap-1.5" target="_blank" rel="noopener noreferrer">
        <Download aria-hidden className="size-4" />
        {text}
        <span className="text-sm font-normal text-muted">
          ({type}
          {size ? `, ${size}` : ''})
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card) transition hover:border-brand-300"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-700">
        <FileText aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold text-ink group-hover:text-brand-700">{text}</span>
        <span className="text-sm text-muted">
          {type}
          {size ? ` · ${size}` : ''}
        </span>
      </span>
      <Download aria-hidden className="size-5 text-brand-600" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
