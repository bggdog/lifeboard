import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';

const JournalModule = () => {
  const { getTodayNote, addNote, updateNote } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayNote = getTodayNote();
  const [content, setContent] = useState(todayNote?.content || '');

  useEffect(() => {
    if (todayNote) {
      setContent(todayNote.content);
    } else {
      setContent('');
    }
  }, [todayNote]);

  const handleSave = async () => {
    if (!content.trim()) return;
    if (todayNote) {
      await updateNote({ ...todayNote, content: content.trim(), updatedAt: new Date().toISOString() });
    } else {
      await addNote({
        id: `note-${Date.now()}`,
        content: content.trim(),
        date: today,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-neutral-600" />
        <h3 className="text-lg font-semibold text-neutral-900">Journal</h3>
      </div>
      <textarea
        placeholder="What's on your mind today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSave}
        className="input min-h-[120px] resize-none"
        rows={5}
      />
      <div className="mt-2 text-xs text-neutral-500">
        {format(new Date(), 'EEEE, MMMM d')}
      </div>
    </div>
  );
};

export default JournalModule;
