import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { authAPI } from '../utils/api';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, user } = useAuthStore();
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Если пользователь авторизован, перенаправляем на страницу профиля
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setEmailCheckLoading(true);
      setRegistrationError(null);
      setEmailExistsError(null);

      // Проверяем существование email перед регистрацией
      console.log('Checking if email exists:', data.email);
      try {
        const emailExists = await authAPI.checkEmail(data.email);
        console.log('Email exists check result:', emailExists);

        if (emailExists) {
          setEmailExistsError('Пользователь с таким email уже зарегистрирован');
          setEmailCheckLoading(false);
          return;
        }
      } catch (checkError) {
        console.error('Error checking email:', checkError);
        // Если произошла ошибка при проверке email, продолжаем регистрацию
        // так как сервер может перепроверить это
      }

      setEmailExistsError(null);
      setEmailCheckLoading(false);

      // Если email не существует, регистрируем пользователя
      console.log('Registering new user:', data.email);
      await registerUser(data.email, data.password, 'athlete');
      console.log('Registration successful, navigating to profile');

      // useEffect выше перенаправит пользователя, когда user будет установлен
    } catch (error: any) {
      setEmailCheckLoading(false);
      console.error('Registration error:', error);
      setRegistrationError(
        error?.response?.data?.message ||
        'Ошибка при регистрации. Пожалуйста, попробуйте позже.'
      );
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
            {(error || emailExistsError || registrationError) && (
              <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  {emailExistsError || registrationError || error}
                </div>
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

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading || emailCheckLoading}
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