import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Mail, Phone, Calendar, MapPin, Github, Info, ArrowLeft } from 'lucide-react';

interface ProfileFormData {
	firstName: string;
	lastName: string;
	middleName: string;
	gender: string;
	birthday: string;
	phone: string;
	address: string;
	github: string;
	discription: string;
}

const ProfileEditPage: React.FC = () => {
	const navigate = useNavigate();
	const { user, userInfo, isLoading, error, updateUserInfo, loadUserInfo } = useAuthStore();
	const [isSaving, setIsSaving] = useState(false);

	const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
		defaultValues: {
			firstName: '',
			lastName: '',
			middleName: '',
			gender: '',
			birthday: '',
			phone: '',
			address: '',
			github: '',
			discription: ''
		}
	});

	useEffect(() => {
		// Если пользователь не авторизован, перенаправляем на страницу входа
		if (!user && !isLoading) {
			navigate('/login');
		} else if (user) {
			// Загружаем информацию о пользователе, если еще не загружена
			if (!userInfo) {
				loadUserInfo(user.id);
			} else {
				// Заполняем форму данными пользователя
				setValue('firstName', userInfo.firstName || '');
				setValue('lastName', userInfo.lastName || '');
				setValue('middleName', userInfo.middleName || '');
				setValue('gender', userInfo.gender || '');
				setValue('birthday', userInfo.birthday ? new Date(userInfo.birthday).toISOString().split('T')[0] : '');
				setValue('phone', userInfo.phone || '');
				setValue('address', userInfo.address || '');
				setValue('github', userInfo.github || '');
				setValue('discription', userInfo.discription || '');
			}
		}
	}, [user, userInfo, isLoading, navigate, setValue, loadUserInfo]);

	const onSubmit = async (data: ProfileFormData) => {
		if (!user) return;

		setIsSaving(true);
		try {
			await updateUserInfo(user.id, data);
			navigate('/profile');
		} catch (error) {
			console.error('Ошибка при обновлении профиля:', error);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="h-screen bg-slate-50 flex items-center justify-center">
				<div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pt-24 pb-12">
			<div className="container mx-auto max-w-2xl px-4">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">Редактирование профиля</h1>
					<Button
						variant="ghost"
						className="text-neutral-600 hover:text-primary-600"
						onClick={() => navigate('/profile')}
						leftIcon={<ArrowLeft className="h-4 w-4" />}
					>
						Назад
					</Button>
				</div>

				<Card className="!bg-white shadow-md rounded-xl border-none overflow-hidden">
					<CardHeader className="rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white py-5 relative">
						<div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
						<div className="flex flex-col items-center justify-center text-center relative z-10">
							<div className="flex items-center justify-center mb-2">
								<User className="h-6 w-6 text-white mr-2" />
								<h3 className="text-xl font-semibold">Личная информация</h3>
							</div>
							<p className="text-primary-100 text-sm max-w-md">
								Заполните информацию о себе, чтобы другие участники могли узнать вас лучше
							</p>
						</div>
					</CardHeader>

					<form onSubmit={handleSubmit(onSubmit)}>
						<CardContent className="space-y-6 p-6">
							{error && (
								<div className="p-4 bg-error-50 border border-error-200 text-error-700 rounded-lg flex items-center">
									<span className="text-error-500 mr-2">⚠</span>
									{error}
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								<Input
									label="Фамилия"
									fullWidth
									leftIcon={<User className="h-4 w-4 text-neutral-500" />}
									error={errors.lastName?.message}
									className="bg-neutral-50 focus:bg-white transition-colors"
									{...register('lastName', {
										required: 'Фамилия обязательна'
									})}
								/>

								<Input
									label="Имя"
									fullWidth
									leftIcon={<User className="h-4 w-4 text-neutral-500" />}
									error={errors.firstName?.message}
									className="bg-neutral-50 focus:bg-white transition-colors"
									{...register('firstName', {
										required: 'Имя обязательно'
									})}
								/>

								<Input
									label="Отчество"
									fullWidth
									leftIcon={<User className="h-4 w-4 text-neutral-500" />}
									className="bg-neutral-50 focus:bg-white transition-colors"
									{...register('middleName')}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center">
										<User className="h-4 w-4 mr-1.5 text-neutral-500" />
										Пол
									</label>
									<div className="relative h-[42px]">
										<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
											<User className="h-4 w-4 text-neutral-500" />
										</div>
										<select
											className="appearance-none w-full h-full pl-10 pr-10 py-2 border border-neutral-200 bg-neutral-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
											{...register('gender')}
										>
											<option value="">Выберите пол</option>
											<option value="мужской">Мужской</option>
											<option value="женский">Женский</option>
											<option value="не указан">Предпочитаю не указывать</option>
										</select>
										<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
											<svg className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</div>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center">
										<Calendar className="h-4 w-4 mr-1.5 text-neutral-500" />
										Дата рождения
									</label>
									<div className="relative h-[42px]">
										<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
											<Calendar className="h-4 w-4 text-neutral-500" />
										</div>
										<input
											type="date"
											className="w-full h-full pl-10 pr-4 py-2 border border-neutral-200 bg-neutral-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
											{...register('birthday')}
										/>
									</div>
								</div>
							</div>

							<Input
								label="Телефон"
								fullWidth
								leftIcon={<Phone className="h-4 w-4 text-neutral-500" />}
								className="bg-neutral-50 focus:bg-white transition-colors"
								placeholder="+7 (___) ___-__-__"
								{...register('phone')}
							/>

							<Input
								label="Адрес"
								fullWidth
								leftIcon={<MapPin className="h-4 w-4 text-neutral-500" />}
								className="bg-neutral-50 focus:bg-white transition-colors"
								placeholder="Город, улица, дом"
								{...register('address')}
							/>

							<Input
								label="GitHub"
								fullWidth
								leftIcon={<Github className="h-4 w-4 text-neutral-500" />}
								className="bg-neutral-50 focus:bg-white transition-colors"
								placeholder="Ваше имя пользователя на GitHub"
								{...register('github')}
							/>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-neutral-700 flex items-center">
									<Info className="h-4 w-4 mr-1.5 text-neutral-500" />
									О себе
								</label>
								<textarea
									className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors min-h-[140px] resize-y"
									placeholder="Расскажите о своем опыте, интересах и целях..."
									{...register('discription')}
								></textarea>
								<p className="text-xs text-neutral-500 mt-1">
									Эта информация будет отображаться в вашем публичном профиле
								</p>
							</div>
						</CardContent>

						<CardFooter className="flex justify-between border-t border-neutral-100 p-6 bg-neutral-50">
							<Button
								type="button"
								variant="outline"
								className="border-neutral-200 hover:bg-neutral-100 transition-colors text-neutral-700"
								onClick={() => navigate('/profile')}
							>
								Отмена
							</Button>

							<Button
								type="submit"
								isLoading={isSaving}
								className="px-6 shadow-sm hover:shadow transition-all"
							>
								Сохранить изменения
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>
		</div>
	);
};

export default ProfileEditPage; 