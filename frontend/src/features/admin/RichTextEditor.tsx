'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Minus, Quote, Redo, Undo, Unlink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MediaPickerDialog } from './MediaPicker';

function ToolButton({ label, active, onClick, children, disabled }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded text-ink hover:bg-surface-strong disabled:opacity-40 ${active ? 'bg-brand-100 text-brand-800' : ''}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (https://… or /page):', prev ?? '');
    if (url === null) return;
    if (!url) return editor.chain().focus().unsetLink().run();
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(url)) {
      window.alert('Enter a full address starting with https:// or a site path starting with /.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const c = () => editor.chain().focus();
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-line bg-surface p-1.5">
      <ToolButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" aria-hidden />
      </ToolButton>
      <span className="mx-1 w-px bg-line" aria-hidden />
      <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}>
        <Bold className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}>
        <Italic className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Remove link" disabled={!editor.isActive('link')} onClick={() => c().unsetLink().run()}>
        <Unlink className="size-4" aria-hidden />
      </ToolButton>
      <span className="mx-1 w-px bg-line" aria-hidden />
      <ToolButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}>
        <List className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}>
        <Quote className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => c().setHorizontalRule().run()}>
        <Minus className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Insert image from media library" onClick={onImage}>
        <ImagePlus className="size-4" aria-hidden />
      </ToolButton>
      <span className="mx-1 w-px bg-line" aria-hidden />
      <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => c().undo().run()}>
        <Undo className="size-4" aria-hidden />
      </ToolButton>
      <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => c().redo().run()}>
        <Redo className="size-4" aria-hidden />
      </ToolButton>
    </div>
  );
}

/** Rich-text field. Output HTML is sanitised again by the API before it is stored. */
export function RichTextEditor({ id, value, onChange, labelledBy }: { id: string; value: string; onChange: (html: string) => void; labelledBy: string }) {
  const [picking, setPicking] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ['mailto', 'tel'] }),
      Image.configure({ inline: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        id,
        'aria-labelledby': labelledBy,
        'aria-multiline': 'true',
        role: 'textbox',
        class: 'prose-cms min-h-64 px-4 py-3 outline-none',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Load server content when the record arrives after first render.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-(--radius-card) border border-line bg-white focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-100">
      {editor && <Toolbar editor={editor} onImage={() => setPicking(true)} />}
      <EditorContent editor={editor} />
      {picking && (
        <MediaPickerDialog
          kind="image"
          onClose={() => setPicking(false)}
          onSelect={(m) => {
            editor?.chain().focus().setImage({ src: m.url!, alt: m.alt_text ?? '' }).run();
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
