import React, { useEffect, useState } from 'react';
import { teamsAPI } from '../utils/api';

interface Team {
	id: string;
	name: string;
	description: string;
	members: {
		id: string;
		firstName: string;
		lastName: string;
	}[];
	createdAt: string;
}

const TeamsPage: React.FC = () => {
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTeams = async () => {
			try {
				setLoading(true);
				const data = await teamsAPI.getAll();
				setTeams(data);
				setError(null);
			} catch (err) {
				setError('Ошибка при загрузке команд');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchTeams();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
					<strong className="font-bold">Ошибка!</strong>
					<span className="block sm:inline"> {error}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Команды</h1>

			{teams.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-gray-500">Команды не найдены</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{teams.map((team) => (
						<div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden">
							<div className="p-6">
								<h2 className="text-xl font-semibold mb-2">{team.name}</h2>
								<p className="text-gray-600 mb-4">{team.description}</p>

								<h3 className="font-medium mb-2">Участники:</h3>
								<ul className="space-y-1">
									{team.members.map((member) => (
										<li key={member.id} className="text-sm">
											{member.firstName} {member.lastName}
										</li>
									))}
								</ul>

								<div className="mt-4 text-sm text-gray-500">
									Создана: {new Date(team.createdAt).toLocaleDateString()}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default TeamsPage; 