'use client';

import { useRef, useCallback, useState } from 'react';
import { Bold, Italic, Heading2, List, ListOrdered, Code, Type, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface NoteEditorProps {
  title: string;
  body: string;
  categoryId: string | null;
  categories: { id: string; name: string }[];
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}

function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  prefix: string,
  suffix: string = prefix
): string | null {
  if (!textarea) return null;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);
  const before = text.slice(0, start);
  const after = text.slice(end);
  return before + prefix + selected + suffix + after;
}

export default function NoteEditor({
  title,
  body,
  categoryId,
  categories,
  onTitleChange,
  onBodyChange,
  onCategoryChange,
  onSave,
  onCancel,
  isNew = false,
}: NoteEditorProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const applyFormat = useCallback(
    (prefix: string, suffix?: string) => {
      const newBody = insertAtCursor(bodyRef.current, prefix, suffix ?? prefix);
      if (newBody != null) onBodyChange(newBody);
    },
    [onBodyChange]
  );

  const formatButtons = [
    { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
    { icon: Italic, label: 'Italic', prefix: '*', suffix: '*' },
    { icon: Heading2, label: 'Heading', prefix: '## ' },
    { icon: List, label: 'Bullet list', prefix: '\n- ' },
    { icon: ListOrdered, label: 'Numbered list', prefix: '\n1. ' },
    { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
    { icon: Type, label: 'Blockquote', prefix: '\n> ' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex items-center gap-2 flex-wrap">
        {formatButtons.map(({ icon: Icon, label, prefix, suffix }) => (
          <button
            key={label}
            type="button"
            onClick={() => applyFormat(prefix, suffix)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div className="ml-auto flex rounded-lg bg-neutral-200 p-0.5">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !showPreview ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              showPreview ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 text-lg font-semibold bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <select
          value={categoryId || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="px-4 py-2 bg-neutral-50 rounded-xl border-0 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {showPreview ? (
          <div className="min-h-[280px] px-4 py-3 bg-neutral-50 rounded-xl prose prose-neutral prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium mt-3 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-neutral-300 pl-4 my-3 text-neutral-600 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) =>
                  !className ? (
                    <code className="bg-neutral-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-neutral-200 p-3 rounded-lg overflow-x-auto text-sm my-3">
                      <code {...props}>{children}</code>
                    </pre>
                  ),
              }}
            >
              {body || '*Nothing to preview*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            placeholder="Write your note... (supports Markdown: **bold**, *italic*, ## headings, - lists)"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            className="w-full min-h-[280px] px-4 py-3 bg-neutral-50 rounded-xl border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent resize-y font-mono text-sm leading-relaxed"
            spellCheck
          />
        )}
      </div>

      <div className="flex-shrink-0 border-t border-neutral-200 px-6 py-4 flex gap-3">
        <button
          onClick={onSave}
          className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
        >
          {isNew ? 'Create note' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-600 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
