import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Mail, Phone, Calendar, MapPin, Github, Info } from 'lucide-react';

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
			<div className="container mx-auto max-w-2xl px-4 py-16 flex items-center justify-center">
				<div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pt-24 pb-12">
			<div className="container mx-auto max-w-2xl px-4">
				<h1 className="text-3xl font-bold mb-6">Редактирование профиля</h1>

				<Card className="!bg-white shadow">
					<CardHeader>
						<CardTitle className="flex items-center">
							<User className="h-5 w-5 mr-2 text-primary-600" />
							Личная информация
						</CardTitle>
					</CardHeader>

					<form onSubmit={handleSubmit(onSubmit)}>
						<CardContent className="space-y-4">
							{error && (
								<div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
									{error}
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									label="Имя"
									fullWidth
									leftIcon={<User className="h-4 w-4" />}
									error={errors.firstName?.message}
									{...register('firstName', {
										required: 'Имя обязательно'
									})}
								/>

								<Input
									label="Фамилия"
									fullWidth
									leftIcon={<User className="h-4 w-4" />}
									error={errors.lastName?.message}
									{...register('lastName', {
										required: 'Фамилия обязательна'
									})}
								/>
							</div>

							<Input
								label="Отчество"
								fullWidth
								leftIcon={<User className="h-4 w-4" />}
								{...register('middleName')}
							/>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="block text-sm font-medium text-neutral-700">Пол</label>
									<select
										className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
										{...register('gender')}
									>
										<option value="">Выберите пол</option>
										<option value="мужской">Мужской</option>
										<option value="женский">Женский</option>
										<option value="не указан">Предпочитаю не указывать</option>
									</select>
								</div>

								<Input
									label="Дата рождения"
									type="date"
									fullWidth
									leftIcon={<Calendar className="h-4 w-4" />}
									{...register('birthday')}
								/>
							</div>

							<Input
								label="Телефон"
								fullWidth
								leftIcon={<Phone className="h-4 w-4" />}
								{...register('phone')}
							/>

							<Input
								label="Адрес"
								fullWidth
								leftIcon={<MapPin className="h-4 w-4" />}
								{...register('address')}
							/>

							<Input
								label="GitHub"
								fullWidth
								leftIcon={<Github className="h-4 w-4" />}
								{...register('github')}
							/>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-neutral-700 flex items-center">
									<Info className="h-4 w-4 mr-1" />
									О себе
								</label>
								<textarea
									className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px]"
									placeholder="Расскажите о себе..."
									{...register('discription')}
								></textarea>
							</div>
						</CardContent>

						<CardFooter className="flex justify-between border-t border-neutral-100 pt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate('/profile')}
							>
								Отмена
							</Button>

							<Button
								type="submit"
								isLoading={isSaving}
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