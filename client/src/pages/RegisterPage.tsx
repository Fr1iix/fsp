import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, ChevronDown } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { User } from '../types';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: User['role'];
}

const ROLE_LABELS = {
  fsp: 'Федерация спортивного программирования',
  regional: 'Региональный представитель',
  athlete: 'Спортсмен'
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuthStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'athlete'
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.role, {});
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="text-primary-600 mt-2">
            Создайте учетную запись в Федерации спортивного программирования
          </p>
        </div>

        <Card className="!bg-white !bg-opacity-100 !backdrop-blur-none shadow-md">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <Input
                label="Email"
                type="email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                fullWidth
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некорректный email'
                  }
                })}
              />

              {/* Пароль */}
              <Input
                label="Пароль"
                type="password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                fullWidth
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен содержать минимум 6 символов'
                  }
                })}
              />

              {/* Подтверждение пароля */}
              <Input
                label="Подтвердите пароль"
                type="password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                fullWidth
                {...register('confirmPassword', {
                  required: 'Подтвердите пароль',
                  validate: value =>
                    value === password || 'Пароли не совпадают'
                })}
              />

              {/* Выбор роли (выпадающий список) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Выберите роль
                </label>
                <div className="relative">
                  <select
                    {...register('role', { required: 'Выберите роль' })}
                    className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm 
                             focus:outline-none focus:ring-primary-500 focus:border-primary-500
                             text-base placeholder-neutral-400"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {errors.role && (
                  <p className="text-sm text-error-600 mt-1">{errors.role.message}</p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                Зарегистрироваться
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-neutral-200">
            <p className="text-center text-sm text-neutral-600">
              Уже есть учетная запись?{' '}
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Войти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;