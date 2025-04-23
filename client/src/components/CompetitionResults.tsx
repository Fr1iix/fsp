import React, { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import api from '../utils/api';

interface Result {
  id: string;
  participantId: string;
  participantName: string;
  place: number;
  points: number;
  createdAt: string;
}

interface CompetitionResultsProps {
  competitionId: string;
}

const CompetitionResults: React.FC<CompetitionResultsProps> = ({ competitionId }) => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/competitions/${competitionId}/results`);
      setResults(response.data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Не удалось загрузить результаты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    // Add event listener for refresh
    const resultsElement = document.querySelector('[data-results-component]');
    if (resultsElement) {
      resultsElement.addEventListener('refreshResults', fetchResults);
    }

    // Cleanup
    return () => {
      if (resultsElement) {
        resultsElement.removeEventListener('refreshResults', fetchResults);
      }
    };
  }, [competitionId]);

  const getMedalColor = (place: number) => {
    switch (place) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-neutral-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">Результаты пока не добавлены</p>
      </div>
    );
  }

  return (
    <div data-results-component className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-4 text-neutral-600 font-medium">Место</th>
            <th className="text-left py-3 px-4 text-neutral-600 font-medium">Участник</th>
            <th className="text-left py-3 px-4 text-neutral-600 font-medium">Баллы</th>
          </tr>
        </thead>
        <tbody>
          {results
            .sort((a, b) => a.place - b.place)
            .map((result) => (
              <tr key={result.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {result.place <= 3 ? (
                      <Medal className={`h-5 w-5 mr-2 ${getMedalColor(result.place)}`} />
                    ) : null}
                    <span>{result.place}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{result.participantName}</td>
                <td className="py-3 px-4">{result.points}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompetitionResults; 