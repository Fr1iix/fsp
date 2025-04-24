import React, { useEffect, useState } from 'react';
import { Medal, Trophy, Award, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

interface ResultTeam {
  id: string;
  name: string;
}

interface ResultUser {
  id: string;
  email: string;
  user_info?: {
    firstName: string;
    lastName: string;
    middleName?: string;
  };
}

interface Result {
  id: string;
  place: number;
  points: number;
  isConfirmed: boolean;
  createdAt: string;
  user: ResultUser;
  team?: ResultTeam;
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
      const data = await api.results.getByCompetition(competitionId);
      setResults(data);
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

  const getMedalIcon = (place: number) => {
    switch (place) {
      case 1:
        return <Trophy className="h-6 w-6 mr-2 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 mr-2 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 mr-2 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 mr-2 text-neutral-300" />;
    }
  };

  const getParticipantName = (result: Result): string => {
    const { user } = result;
    if (user.user_info) {
      const { firstName, lastName, middleName } = user.user_info;
      return `${lastName || ''} ${firstName || ''} ${middleName || ''}`.trim();
    }
    return user.email || 'Неизвестный участник';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-neutral-600">Загрузка результатов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <div className="flex justify-center mb-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <p className="text-neutral-700 font-medium mb-1">Не удалось загрузить результаты</p>
        <p className="text-neutral-500 text-sm">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 font-medium"
          onClick={fetchResults}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="flex justify-center mb-3">
          <Trophy className="h-10 w-10 text-neutral-300" />
        </div>
        <p className="text-neutral-700 font-medium mb-1">Результаты пока не добавлены</p>
        <p className="text-neutral-500 text-sm">Результаты будут доступны после завершения соревнования</p>
      </div>
    );
  }

  // Группируем результаты по командам, если они есть
  const hasTeams = results.some(r => r.team);

  if (hasTeams) {
    // Создаем уникальный список команд
    const teams = Array.from(new Set(results.filter(r => r.team).map(r => r.team?.id)))
      .map(teamId => {
        const teamResult = results.find(r => r.team?.id === teamId);
        return {
          id: teamId,
          name: teamResult?.team?.name || 'Неизвестная команда',
          place: teamResult?.place || 999,
          points: teamResult?.points || 0
        };
      })
      .sort((a, b) => a.place - b.place);

    return (
      <div data-results-component>
        <div className="bg-neutral-50 p-4 rounded-t-md">
          <h3 className="text-lg font-medium text-neutral-800 mb-1">Командный зачет</h3>
          <p className="text-sm text-neutral-600">Результаты команд-участников</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-white">
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">Место</th>
                <th className="text-left py-3 px-4 text-neutral-600 font-medium">Команда</th>
                <th className="text-right py-3 px-4 text-neutral-600 font-medium">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 w-24">
                    <div className="flex items-center">
                      {getMedalIcon(team.place)}
                      <span className="font-semibold">{team.place}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{team.name}</td>
                  <td className="py-3 px-4 text-right">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Если команд нет, показываем индивидуальные результаты
  return (
    <div data-results-component className="overflow-x-auto">
      <div className="bg-neutral-50 p-4 rounded-t-md border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-800 mb-1">Индивидуальный зачет</h3>
        <p className="text-sm text-neutral-600">Результаты участников соревнования</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-white">
            <th className="text-left py-3 px-4 text-neutral-600 font-medium">Место</th>
            <th className="text-left py-3 px-4 text-neutral-600 font-medium">Участник</th>
            <th className="text-right py-3 px-4 text-neutral-600 font-medium">Баллы</th>
          </tr>
        </thead>
        <tbody>
          {results
            .sort((a, b) => a.place - b.place)
            .map((result) => (
              <tr key={result.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 w-24">
                  <div className="flex items-center">
                    {getMedalIcon(result.place)}
                    <span className="font-semibold">{result.place}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{getParticipantName(result)}</td>
                <td className="py-3 px-4 text-right">{result.points}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompetitionResults; 