import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../utils/api';

interface Participant {
  id: string;
  name: string;
}

interface CompetitionResultFormProps {
  competitionId: string;
  onResultAdded: () => void;
}

const CompetitionResultForm: React.FC<CompetitionResultFormProps> = ({
  competitionId,
  onResultAdded,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Array<{
    participantId: string;
    place: number;
    points: number;
  }>>([{ participantId: '', place: 1, points: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await api.get(`/competitions/${competitionId}/participants`);
        setParticipants(response.data);
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError('Не удалось загрузить список участников');
      }
    };

    fetchParticipants();
  }, [competitionId]);

  const handleAddResult = () => {
    setResults([...results, { participantId: '', place: results.length + 1, points: 0 }]);
  };

  const handleRemoveResult = (index: number) => {
    const newResults = results.filter((_, i) => i !== index);
    // Update places after removal
    newResults.forEach((result, i) => {
      result.place = i + 1;
    });
    setResults(newResults);
  };

  const handleResultChange = (
    index: number,
    field: 'participantId' | 'place' | 'points',
    value: string | number
  ) => {
    const newResults = [...results];
    newResults[index] = {
      ...newResults[index],
      [field]: value,
    };
    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post(`/competitions/${competitionId}/results`, { results });
      onResultAdded();
      setResults([{ participantId: '', place: 1, points: 0 }]);
    } catch (err) {
      console.error('Error adding results:', err);
      setError('Не удалось добавить результаты');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <select
                value={result.participantId}
                onChange={(e) => handleResultChange(index, 'participantId', e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                required
              >
                <option value="">Выберите участника</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <input
                type="number"
                value={result.place}
                onChange={(e) => handleResultChange(index, 'place', parseInt(e.target.value))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                min="1"
                required
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                value={result.points}
                onChange={(e) => handleResultChange(index, 'points', parseInt(e.target.value))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
                min="0"
                required
              />
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveResult(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleAddResult}
          className="flex items-center text-primary-600 hover:text-primary-700"
        >
          <Plus className="h-5 w-5 mr-1" />
          Добавить результат
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить результаты'}
        </button>
      </div>
    </form>
  );
};

export default CompetitionResultForm; 