import sanitizeHtml from 'sanitize-html';

/**
 * Allow-list for rich-text produced by the admin editor (TipTap) and migrated WordPress content.
 * Scripts, inline event handlers, iframes from unknown hosts and style attributes are removed.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    ol: ['start', 'type'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? '');
      return {
        tagName,
        attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
  },
  exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
};

export const sanitizeRichText = (html: string | null | undefined): string | null =>
  html == null ? null : sanitizeHtml(html, RICH_TEXT_OPTIONS).trim() || null;

/** Plain text for excerpts, meta descriptions and search snippets. */
export function stripHtml(html: string | null | undefined, maxLength?: number): string {
  if (!html) return '';
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (!maxLength || text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), maxLength - 20))}…`;
}
