import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { ArrowLeft, Dumbbell, Plus, Edit2, Trash2, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lift, LiftEntry } from '../types';

const GymNotes = () => {
  const navigate = useNavigate();
  const { state, addLift, updateLift, deleteLift, addLiftEntry, deleteLiftEntry } = useApp();
  const [showAddLift, setShowAddLift] = useState(false);
  const [editingLift, setEditingLift] = useState<Lift | null>(null);
  const [newLiftName, setNewLiftName] = useState('');
  const [newLiftWeight, setNewLiftWeight] = useState('');
  const [newLift1RM, setNewLift1RM] = useState('');
  const [selectedLift, setSelectedLift] = useState<Lift | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryWeight, setEntryWeight] = useState('');
  const [entryReps, setEntryReps] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const lifts = (state.lifts || []).sort((a, b) => a.name.localeCompare(b.name));

  const handleAddLift = async () => {
    if (!newLiftName.trim()) return;

    try {
      const lift: Lift = {
        id: `lift-${Date.now()}-${Math.random()}`,
        name: newLiftName.trim(),
        currentWeight: parseFloat(newLiftWeight) || 0,
        oneRepMax: parseFloat(newLift1RM) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addLift(lift);
      setNewLiftName('');
      setNewLiftWeight('');
      setNewLift1RM('');
      setShowAddLift(false);
    } catch (error: any) {
      console.error('Error adding lift:', error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        alert(`Database error: The 'lifts' table doesn't exist.\n\nPlease run the SUPABASE_ADD_GYM_NOTES.sql migration in Supabase SQL Editor.`);
      } else {
        alert(`Failed to add lift: ${errorMsg}`);
      }
    }
  };

  const handleUpdateLift = async (lift: Lift, field: 'currentWeight' | 'oneRepMax', value: number) => {
    try {
      await updateLift({
        ...lift,
        [field]: value,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating lift:', error);
      alert(`Failed to update lift: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteLift = async (id: string) => {
    if (confirm('Are you sure you want to delete this lift? This will also delete all associated entries.')) {
      await deleteLift(id);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedLift || !entryWeight || !entryReps) return;

    try {
      const entry: LiftEntry = {
        id: `entry-${Date.now()}-${Math.random()}`,
        liftId: selectedLift.id,
        weight: parseFloat(entryWeight),
        reps: parseInt(entryReps),
        date: entryDate,
        notes: entryNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addLiftEntry(entry);
      
      // Update lift's current weight if this is the most recent entry
      const allEntries = (state.liftEntries || []).filter(e => e.liftId === selectedLift.id);
      const latestEntry = allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (!latestEntry || new Date(entryDate) >= new Date(latestEntry.date)) {
        await handleUpdateLift(selectedLift, 'currentWeight', parseFloat(entryWeight));
      }

      setEntryWeight('');
      setEntryReps('');
      setEntryNotes('');
      setEntryDate(format(new Date(), 'yyyy-MM-dd'));
      setShowEntryForm(false);
    } catch (error: any) {
      console.error('Error adding entry:', error);
      alert(`Failed to add entry: ${error?.message || 'Unknown error'}`);
    }
  };

  const selectedLiftEntries = (state.liftEntries || [])
    .filter(e => e.liftId === selectedLift?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateEstimated1RM = (weight: number, reps: number): number => {
    // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 * reps)
    if (reps === 1) return weight;
    return Math.round(weight / (1.0278 - 0.0278 * reps));
  };

  if (!state || state.loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading gym notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-accent" />
                <h1 className="text-2xl font-bold text-neutral-900">Gym Notes</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Lifts List */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Lifts</h2>
                <button
                  onClick={() => {
                    setShowAddLift(true);
                    setEditingLift(null);
                    setNewLiftName('');
                    setNewLiftWeight('');
                    setNewLift1RM('');
                  }}
                  className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-neutral-600" />
                </button>
              </div>

              {showAddLift && (
                <div className="mb-4 p-4 bg-neutral-50 rounded-card border border-neutral-200">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Lift name (e.g., Bench Press)"
                      value={newLiftName}
                      onChange={(e) => setNewLiftName(e.target.value)}
                      className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Current Weight (lbs)"
                        value={newLiftWeight}
                        onChange={(e) => setNewLiftWeight(e.target.value)}
                        className="input text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      <input
                        type="number"
                        placeholder="1RM (lbs)"
                        value={newLift1RM}
                        onChange={(e) => setNewLift1RM(e.target.value)}
                        className="input text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddLift}
                        className="btn-primary flex-1 text-sm"
                        disabled={!newLiftName.trim()}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddLift(false);
                          setNewLiftName('');
                          setNewLiftWeight('');
                          setNewLift1RM('');
                        }}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {lifts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>No lifts yet. Add your first lift!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lifts.map((lift) => (
                    <button
                      key={lift.id}
                      onClick={() => {
                        setSelectedLift(lift);
                        setShowEntryForm(false);
                      }}
                      className={`w-full text-left p-3 rounded-button transition-all ${
                        selectedLift?.id === lift.id
                          ? 'bg-accent text-white shadow-card'
                          : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                      }`}
                    >
                      <div className="font-medium">{lift.name}</div>
                      <div className={`text-sm mt-1 ${selectedLift?.id === lift.id ? 'text-white/90' : 'text-neutral-600'}`}>
                        {lift.currentWeight > 0 && (
                          <span>Current: {lift.currentWeight} lbs</span>
                        )}
                        {lift.currentWeight > 0 && lift.oneRepMax > 0 && ' • '}
                        {lift.oneRepMax > 0 && (
                          <span>1RM: {lift.oneRepMax} lbs</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Lift Details & Entries */}
          <div className="lg:col-span-2">
            {selectedLift ? (
              <div className="space-y-6">
                {/* Lift Stats */}
                <div className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900 mb-2">{selectedLift.name}</h2>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setEditingLift(selectedLift)}
                          className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteLift(selectedLift.id)}
                          className="p-2 rounded-button hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingLift?.id === selectedLift.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Current Weight (lbs)
                          </label>
                          <input
                            type="number"
                            value={editingLift.currentWeight}
                            onChange={(e) => {
                              const updated = {
                                ...editingLift,
                                currentWeight: parseFloat(e.target.value) || 0,
                              };
                              setEditingLift(updated);
                            }}
                            className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            1 Rep Max (lbs)
                          </label>
                          <input
                            type="number"
                            value={editingLift.oneRepMax}
                            onChange={(e) => {
                              const updated = {
                                ...editingLift,
                                oneRepMax: parseFloat(e.target.value) || 0,
                              };
                              setEditingLift(updated);
                            }}
                            className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await updateLift({
                              ...editingLift,
                              updatedAt: new Date().toISOString(),
                            });
                            setEditingLift(null);
                          }}
                          className="btn-primary text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingLift(null)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-card border border-accent/20">
                        <div className="text-sm text-neutral-600 mb-1">Current Weight</div>
                        <div className="text-2xl font-bold text-neutral-900">
                          {selectedLift.currentWeight > 0 ? `${selectedLift.currentWeight} lbs` : '—'}
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-card border border-yellow-400/20">
                        <div className="flex items-center gap-1 text-sm text-neutral-600 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          1 Rep Max
                        </div>
                        <div className="text-2xl font-bold text-yellow-700">
                          {selectedLift.oneRepMax > 0 ? `${selectedLift.oneRepMax} lbs` : '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Entry Form */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Add Entry</h3>
                    <button
                      onClick={() => {
                        setShowEntryForm(!showEntryForm);
                        if (!showEntryForm) {
                          setEntryWeight('');
                          setEntryReps('');
                          setEntryNotes('');
                          setEntryDate(format(new Date(), 'yyyy-MM-dd'));
                        }
                      }}
                      className="p-2 rounded-button hover:bg-neutral-100 transition-colors"
                    >
                      {showEntryForm ? <X className="w-4 h-4 text-neutral-600" /> : <Plus className="w-4 h-4 text-neutral-600" />}
                    </button>
                  </div>

                  {showEntryForm && (
                    <div className="p-4 bg-neutral-50 rounded-card border border-neutral-200 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Weight (lbs)</label>
                          <input
                            type="number"
                            placeholder="185"
                            value={entryWeight}
                            onChange={(e) => setEntryWeight(e.target.value)}
                            className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reps</label>
                          <input
                            type="number"
                            placeholder="5"
                            value={entryReps}
                            onChange={(e) => setEntryReps(e.target.value)}
                            className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Date</label>
                          <input
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      </div>
                      {entryWeight && entryReps && (
                        <div className="p-3 bg-accent/10 rounded-card border border-accent/20">
                          <div className="text-sm text-neutral-600 mb-1">Estimated 1RM</div>
                          <div className="text-lg font-semibold text-accent">
                            {calculateEstimated1RM(parseFloat(entryWeight), parseInt(entryReps))} lbs
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes (optional)</label>
                        <textarea
                          placeholder="How did it feel? Any notes?"
                          value={entryNotes}
                          onChange={(e) => setEntryNotes(e.target.value)}
                          className="input w-full text-base py-2.5 px-4 bg-white border-2 border-neutral-300 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[80px] resize-none"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={handleAddEntry}
                        className="btn-primary w-full"
                        disabled={!entryWeight || !entryReps}
                      >
                        Add Entry
                      </button>
                    </div>
                  )}
                </div>

                {/* Entries History */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">History</h3>
                  {selectedLiftEntries.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      <p>No entries yet. Add your first entry above!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLiftEntries.map((entry) => {
                        const estimated1RM = calculateEstimated1RM(entry.weight, entry.reps);
                        return (
                          <div
                            key={entry.id}
                            className="p-4 bg-neutral-50 rounded-card border border-neutral-200 hover:border-neutral-300 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-xl font-bold text-neutral-900">{entry.weight} lbs</span>
                                  <span className="text-neutral-600">×</span>
                                  <span className="text-lg font-medium text-neutral-700">{entry.reps} reps</span>
                                  <span className="text-sm text-neutral-500">
                                    ({format(new Date(entry.date), 'MMM d, yyyy')})
                                  </span>
                                </div>
                                {estimated1RM > 0 && (
                                  <div className="text-sm text-neutral-600 mb-1">
                                    Est. 1RM: <span className="font-semibold text-accent">{estimated1RM} lbs</span>
                                  </div>
                                )}
                                {entry.notes && (
                                  <div className="text-sm text-neutral-700 mt-2 italic">{entry.notes}</div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteLiftEntry(entry.id)}
                                className="p-2 rounded-button hover:bg-red-50 transition-colors ml-3"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Select a Lift</h3>
                <p className="text-neutral-600">Choose a lift from the left to view details and track progress</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GymNotes;
