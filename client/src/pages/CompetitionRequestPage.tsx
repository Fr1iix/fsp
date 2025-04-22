import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Info, User, Users, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import { useAuthStore } from '../store/authStore.ts';
import { applicationAPI } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

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
			// Создаем данные о соревновании
			const competitionData = {
				title: formData.title,
				description: formData.description,
				format: formData.format,
				discipline: formData.discipline,
				region: formData.region,
				startDate: formData.startDate,
				endDate: formData.endDate,
				maxParticipants: formData.maxParticipants,
			};

			console.log('Данные соревнования для заявки:', competitionData);

			// Создаем данные для заявки с JSON-строкой данных о соревновании в UUID
			const applicationData = {
				UserId: user.id,
				status: 'pending',
				UUID: JSON.stringify(competitionData)
			};

			console.log('Отправляемые данные заявки:', applicationData);

			// Отправляем заявку через API
			const response = await applicationAPI.create(applicationData);
			console.log('Ответ сервера:', response);

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
			<div className="min-h-screen bg-slate-50 pt-20 pb-12">
				<div className="container mx-auto max-w-2xl px-4 py-10">
					<Card className="overflow-hidden !bg-white shadow-lg rounded-xl border-none">
						<CardContent className="p-10 text-center">
							<div className="mx-auto w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mb-6 border-4 border-success-50 shadow-sm">
								<CheckCircle className="text-success-600 h-10 w-10" />
							</div>
							<h2 className="text-2xl font-bold text-neutral-800 mb-4">Заявка успешно отправлена!</h2>
							<p className="text-neutral-600 mb-8 text-lg">
								Ваша заявка на создание соревнования была успешно отправлена и будет рассмотрена представителем ФСП.
								Вы получите уведомление о решении в ближайшее время.
							</p>
							<div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-8 text-left">
								<p className="text-primary-700 flex items-start">
									<Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
									<span>
										После одобрения заявки соревнование будет автоматически создано и вы сможете управлять
										им в панели администратора соревнований.
									</span>
								</p>
							</div>
							<div className="flex flex-col sm:flex-row justify-center gap-4">
								<Button
									onClick={() => navigate('/profile')}
									variant="outline"
									className="flex items-center justify-center py-2.5"
								>
									<User className="h-4 w-4 mr-2" />
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
									className="flex items-center justify-center py-2.5"
								>
									<Calendar className="h-4 w-4 mr-2" />
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
		<div className="min-h-screen bg-slate-50 pt-20 pb-12">
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

				<div className="flex items-center mb-8">
					<Calendar className="h-8 w-8 mr-3 text-primary-600" />
					<h1 className="text-3xl font-bold text-neutral-800">Создание заявки на соревнование</h1>
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

				<Card className="overflow-hidden !bg-white shadow-lg rounded-xl border-none mb-8">
					<CardContent className="p-8">
						{submitError && (
							<div className="mb-8 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
								<p className="font-medium">Ошибка:</p>
								<p>{submitError}</p>
							</div>
						)}

						<form onSubmit={handleSubmit}>
							<div className="space-y-8">
								<div>
									<h3 className="text-lg font-semibold text-neutral-800 mb-6 pb-2 border-b border-neutral-100">
										Основная информация
									</h3>

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
									</div>
								</div>

								<div>
									<h3 className="text-lg font-semibold text-neutral-800 mb-6 pb-2 border-b border-neutral-100">
										Параметры соревнования
									</h3>

									<div className="space-y-6">
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
									</div>
								</div>

								<div>
									<h3 className="text-lg font-semibold text-neutral-800 mb-6 pb-2 border-b border-neutral-100">
										Даты и участники
									</h3>

									<div className="space-y-6">
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
													min={new Date().toISOString().split('T')[0]}
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
													min={formData.startDate || new Date().toISOString().split('T')[0]}
													className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
												/>
											</div>
										</div>

										<div>
											<label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="maxParticipants">
												Максимальное число участников *
											</label>
											<input
												type="number"
												id="maxParticipants"
												name="maxParticipants"
												required
												min={1}
												max={1000}
												value={formData.maxParticipants}
												onChange={handleChange}
												className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
											/>
										</div>
									</div>
								</div>

								<div className="pt-6">
									<Button
										type="submit"
										disabled={isSubmitting}
										className="w-full flex items-center justify-center py-3 text-lg shadow-md hover:shadow-lg transition-shadow"
									>
										{isSubmitting ? (
											<>
												<span className="mr-2 animate-spin">◌</span>
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