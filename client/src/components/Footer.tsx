import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Code className="h-8 w-8 text-primary-400" />
              <span className="font-bold text-xl">ФСП</span>
            </div>
            <p className="text-neutral-400 mb-6">
              Федерация спортивного программирования объединяет лучших в области программирования по всей России
            </p>
            <div className="flex space-x-4">
              <a href="https://vk.com/russiafsp" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.597v1.575c0 .424-.135.676-1.251.676-1.844 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.926 4 8.504c0-.254.102-.491.593-.491h1.744c.44 0 .61.237.779.813.847 2.44 2.27 4.574 2.863 4.574.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.372 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.608 2.18-3.608.119-.254.373-.491.779-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.779.779 1.168 1.253.813.88 1.422 1.624 1.59 2.134.17.475-.085.745-.576.745z" />
                </svg>
              </a>
              <a href="https://t.me/fsprussia" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.336.016.126.036.367.021.569z" />
                </svg>
              </a>
              <a href="mailto:info@fsport.ru" className="text-neutral-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Соревнования</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/competitions?discipline=product" className="text-neutral-400 hover:text-white transition-colors">
                  Продуктовое программирование
                </Link>
              </li>
              <li>
                <Link to="/competitions?discipline=security" className="text-neutral-400 hover:text-white transition-colors">
                  Информационная безопасность
                </Link>
              </li>
              <li>
                <Link to="/competitions?discipline=algorithm" className="text-neutral-400 hover:text-white transition-colors">
                  Алгоритмическое программирование
                </Link>
              </li>
              <li>
                <Link to="/competitions?discipline=robotics" className="text-neutral-400 hover:text-white transition-colors">
                  Программирование робототехники
                </Link>
              </li>
              <li>
                <Link to="/competitions?discipline=drones" className="text-neutral-400 hover:text-white transition-colors">
                  Программирование БПЛА
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Ресурсы</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/rules" className="text-neutral-400 hover:text-white transition-colors">
                  Правила участия
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-neutral-400 hover:text-white transition-colors">
                  Часто задаваемые вопросы
                </Link>
              </li>
              <li>
                <Link to="/regions" className="text-neutral-400 hover:text-white transition-colors">
                  Региональные представительства
                </Link>
              </li>
              <li>
                <Link to="/documents" className="text-neutral-400 hover:text-white transition-colors">
                  Нормативные документы
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Контакты</h3>
            <address className="not-italic text-neutral-400">
              <p className="mb-2">г. Москва, 2-я Брестская, д.8, этаж 9</p>
              <p className="mb-2">
                <a href="tel:+74996780305" className="hover:text-white transition-colors">
                  +7 (499) 678-03-05
                </a>
              </p>
              <p>
                <a href="mailto:press@fsp-russia.ru" className="hover:text-white transition-colors">
                  info@fsport.ru
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 text-neutral-500 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>© 2024-2025 Федерация спортивного программирования. Все права защищены.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;