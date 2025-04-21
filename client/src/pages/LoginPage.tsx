import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore.ts';
import { Code, Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card.tsx';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password);
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Code className="h-12 w-12 text-primary-600 mx-auto mb-2" />
          <h1 className="text-3xl font-bold">Вход в систему</h1>
          <p className="text-neutral-600 mt-2">
            Войдите в свою учетную запись Федерации спортивного программирования
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md animate-fade-in">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              
              <Button 
                type="submit" 
                fullWidth 
                isLoading={isLoading}
              >
                Войти
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-neutral-200">
            <p className="text-center text-sm text-neutral-600">
              Еще нет учетной записи?{' '}
              <Link to="/register" className="text-primary-600 hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;