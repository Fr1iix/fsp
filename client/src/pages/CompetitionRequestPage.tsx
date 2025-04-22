import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Info, User, Users } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { useAuthStore } from '../store/authStore.ts';
import api from '../utils/api';

const CompetitionRequestPage: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const [formData, setFormData] = useState({
		title: '',
		description: '',
		format: 'regional' as 'open' | 'regional' | 'federal',
		discipline: 'product' as 'product' | 'security' | 'algorithm' | 'robotics' | 'drones',
		region: '',
		startDate: '',
		endDate: '',
		maxParticipants: 50,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			setSubmitError('Вы должны быть авторизованы для создания заявки');
			return;
		}

		if (user.role !== 'regional') {
			setSubmitError('Только региональные представители могут создавать заявки на соревнования');
			return;
		}

		setIsSubmitting(true);
		setSubmitError(null);

		try {
			// В будущем здесь будет отправка запроса на сервер
			// Сейчас просто имитируем успешную отправку
			await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация запроса

			// Здесь будет реальная отправка запроса на бэкенд
			// await api.post('/competitions/request', {
			//   ...formData,
			//   requesterId: user.id,
			// });

			setSubmitSuccess(true);
		} catch (error: any) {
			console.error('Ошибка при отправке заявки:', error);
			setSubmitError(error.response?.data?.message || 'Произошла ошибка при отправке заявки');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (submitSuccess) {
		return (
			<div className="min-h-screen bg-slate-50 pt-20">
				<div className="container mx-auto max-w-2xl px-4 py-10">
					<Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
						<CardContent className="p-8 text-center">
							<div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
								<span className="text-success-600 text-3xl">✓</span>
							</div>
							<h2 className="text-2xl font-bold text-neutral-800 mb-4">Заявка успешно отправлена!</h2>
							<p className="text-neutral-600 mb-6">
								Ваша заявка на создание соревнования была успешно отправлена и будет рассмотрена представителем ФСП.
								Вы получите уведомление о решении в ближайшее время.
							</p>
							<div className="flex justify-center gap-4">
								<Button
									onClick={() => navigate('/profile')}
									variant="outline"
								>
									Вернуться в профиль
								</Button>
								<Button
									onClick={() => {
										setSubmitSuccess(false);
										setFormData({
											title: '',
											description: '',
											format: 'regional',
											discipline: 'product',
											region: '',
											startDate: '',
											endDate: '',
											maxParticipants: 50,
										});
									}}
								>
									Создать ещё одну заявку
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pt-20">
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<div className="mb-6">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Назад
					</button>
				</div>
				<div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-10">
					<h3 className="text-primary-800 font-semibold mb-3 flex items-center">
						<Info className="h-5 w-5 mr-2 text-primary-600" />
						Важная информация
					</h3>
					<p className="text-sm text-primary-700 mb-4">
						После отправки заявки она будет рассмотрена представителем Федерации спортивного программирования.
						Вы получите уведомление о решении в течение нескольких рабочих дней.
					</p>
					<p className="text-sm text-primary-700">
						При одобрении заявки соревнование будет автоматически создано и вы сможете управлять им в панели
						администратора соревнований.
					</p>
				</div>

				<Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none mb-8">
					<CardHeader className="rounded-xl bg-neutral-50 border-b border-neutral-100 py-5">
						<CardTitle className="text-xl font-semibold text-neutral-800 flex items-center justify-center">
							<Calendar className="h-5 w-5 mr-2 text-primary-600" />
							Создание заявки на соревнование
						</CardTitle>
					</CardHeader>

					<CardContent className="p-6">
						{submitError && (
							<div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
								<p className="font-medium">Ошибка:</p>
								<p>{submitError}</p>
							</div>
						)}

						<form onSubmit={handleSubmit}>
							<div className="space-y-6">
								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="title">
										Название соревнования *
									</label>
									<input
										type="text"
										id="title"
										name="title"
										required
										value={formData.title}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										placeholder="Введите название соревнования"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="description">
										Описание соревнования *
									</label>
									<textarea
										id="description"
										name="description"
										required
										value={formData.description}
										onChange={handleChange}
										rows={5}
										className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										placeholder="Опишите цель, задачи и условия соревнования"
									></textarea>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="format">
											Формат соревнования *
										</label>
										<select
											id="format"
											name="format"
											required
											value={formData.format}
											onChange={handleChange}
											className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										>
											<option value="open">Открытый</option>
											<option value="regional">Региональный</option>
											<option value="federal">Федеральный</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="discipline">
											Дисциплина *
										</label>
										<select
											id="discipline"
											name="discipline"
											required
											value={formData.discipline}
											onChange={handleChange}
											className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										>
											<option value="product">Продуктовая разработка</option>
											<option value="security">Информационная безопасность</option>
											<option value="algorithm">Алгоритмы</option>
											<option value="robotics">Робототехника</option>
											<option value="drones">Дроны</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="region">
										Регион проведения *
									</label>
									<input
										type="text"
										id="region"
										name="region"
										required
										value={formData.region}
										onChange={handleChange}
										className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										placeholder="Введите регион проведения"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="startDate">
											Дата начала *
										</label>
										<input
											type="date"
											id="startDate"
											name="startDate"
											required
											value={formData.startDate}
											onChange={handleChange}
											className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="endDate">
											Дата окончания *
										</label>
										<input
											type="date"
											id="endDate"
											name="endDate"
											required
											value={formData.endDate}
											onChange={handleChange}
											className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="maxParticipants">
										Максимальное количество участников
									</label>
									<input
										type="number"
										id="maxParticipants"
										name="maxParticipants"
										value={formData.maxParticipants}
										onChange={handleChange}
										min={1}
										max={1000}
										className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
									/>
								</div>

								<div className="pt-4 flex justify-end">
									<Button
										type="submit"
										disabled={isSubmitting}
										className="px-6 shadow-sm hover:shadow transition-all"
									>
										{isSubmitting ? (
											<>
												<span className="mr-2 inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
												Отправка...
											</>
										) : (
											'Отправить заявку'
										)}
									</Button>
								</div>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default CompetitionRequestPage; 