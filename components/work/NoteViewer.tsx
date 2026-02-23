'use client';

import ReactMarkdown from 'react-markdown';

interface NoteViewerProps {
  title: string;
  body: string;
  categoryName?: string | null;
  updatedAt: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NoteViewer({
  title,
  body,
  categoryName,
  updatedAt,
  onEdit,
  onDelete,
}: NoteViewerProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 border-b border-neutral-200 px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">{title || 'Untitled'}</h2>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {categoryName && (
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg font-medium">
                {categoryName}
              </span>
            )}
            <span>{new Date(updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-neutral prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-neutral-200 pl-4 my-4 text-neutral-600 italic">
                  {children}
                </blockquote>
              ),
              code: ({ inline, className, children, ...props }) =>
                inline ? (
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-neutral-100 p-4 rounded-xl overflow-x-auto text-sm my-4">
                    <code {...props}>{children}</code>
                  </pre>
                ),
            }}
          >
            {body || '*No content*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
