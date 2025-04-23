import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Code, User, LogOut } from 'lucide-react';
import Button from './ui/Button.tsx';
import { useAuthStore } from '../store/authStore.ts';


const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-50 border-b border-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center space-x-3">
            <Code className="w-8 h-8 text-primary-600" />
            <div className="hidden md:block">
              <div className="text-sm font-medium">
                <span className="hidden lg:inline">Федерация Компьютерного Спорта</span>
                <span className="lg:hidden">ФКС</span>
              </div>
              <div className="text-xs text-neutral-600">Спортивное программирование</div>
            </div>
          </Link>

          {/* Навигация - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm text-neutral-700 hover:text-primary-600">
              Главная
            </Link>
            <Link to="/competitions" className="text-sm text-neutral-700 hover:text-primary-600">
              Соревнования
            </Link>
            <Link to="/teams" className="text-sm text-neutral-700 hover:text-primary-600">
              Команды
            </Link>
            <Link to="/about" className="text-sm text-neutral-700 hover:text-primary-600">
              О нас
            </Link>
          </nav>

          {/* Правая часть - Desktop */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {/* Социальные сети */}
            <div className="flex items-center space-x-2 ml-4 lg:ml-8">
              <a href="https://vk.com/russiafsp" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.597v1.575c0 .424-.135.676-1.251.676-1.844 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.926 4 8.504c0-.254.102-.491.593-.491h1.744c.44 0 .61.237.779.813.847 2.44 2.27 4.574 2.863 4.574.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.372 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.608 2.18-3.608.119-.254.373-.491.779-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.779.779 1.168 1.253.813.88 1.422 1.624 1.59 2.134.17.475-.085.745-.576.745z" />
                </svg>
              </a>
              <a href="https://t.me/fsprussia" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.336.016.126.036.367.021.569z" />
                </svg>
              </a>
            </div>

            {/* Кнопки авторизации или профиля */}
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<User className="h-4 w-4" />}
                    onClick={() => navigate('/profile')}
                  >
                    Профиль
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={handleLogout}
                  >
                    Выйти
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Войти
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/register')}
                  >
                    Регистрация
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Мобильное меню */}
          <button className="md:hidden p-2 text-neutral-600" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Мобильная навигация */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/80 backdrop-blur-sm border-t border-neutral-100">
          <div className="px-4 py-2 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base text-neutral-700 hover:bg-neutral-50 rounded-md">
              Главная
            </Link>
            <Link to="/competitions" className="block px-3 py-2 text-base text-neutral-700 hover:bg-neutral-50 rounded-md">
              Соревнования
            </Link>
            <Link to="/teams" className="block px-3 py-2 text-base text-neutral-700 hover:bg-neutral-50 rounded-md">
              Команды
            </Link>
            <Link to="/about" className="block px-3 py-2 text-base text-neutral-700 hover:bg-neutral-50 rounded-md">
              О нас
            </Link>

            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    leftIcon={<User className="h-4 w-4 mr-2" />}
                    onClick={() => navigate('/profile')}
                  >
                    Профиль
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center"
                    leftIcon={<LogOut className="h-4 w-4 mr-2" />}
                    onClick={handleLogout}
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Войти
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => navigate('/register')}
                  >
                    Регистрация
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;