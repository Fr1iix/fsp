import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Award, Users, Layers } from 'lucide-react';
import { useCompetitionStore } from '../store/competitionStore.ts';
import { Competition } from '../types';
import CompetitionCard from '../components/CompetitionCard.tsx';
import Button from '../components/ui/Button.tsx';
import Header from '../components/Header.tsx';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { competitions, fetchCompetitions, isLoading } = useCompetitionStore();
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    const loadCompetitions = async () => {
      // Загружаем соревнования с открытой регистрацией или начинающиеся в ближайшее время
      await fetchCompetitions({
        status: 'registration'
      });

      // Фильтруем и берем только 3 ближайших
      const now = new Date();
      const upcoming = competitions
        .filter(comp => new Date(comp.startDate) > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3);

      setUpcomingCompetitions(upcoming);
    };

    loadCompetitions();
  }, [fetchCompetitions]);

  return (
    <div className="pt-16">
      {/* Hero секция */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-700 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">
                Федерация спортивного программирования
              </h1>
              <p className="text-xl mb-8 text-primary-50 animate-fade-in">
                Раскройте свой потенциал в программировании, соревнуйтесь с лучшими и развивайте навыки вместе с нами!
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-in">
                <Button
                  className="bg-white/100 backdrop-blur-sm text-primary-700 hover:bg-primary-50/80"
                  size="lg"
                  onClick={() => navigate('/competitions')}
                >
                  Найти соревнование
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-primary-600"
                  onClick={() => navigate('/register')}
                >
                  Присоединиться
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-primary-500 rounded-lg opacity-20 blur-2xl animate-pulse"></div>
                <Code className="w-72 h-72 mx-auto text-white opacity-90 animate-squeeze" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция дисциплин */}
      <section className="py-20 px-4 bg-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent animate-fade-in">
              Дисциплины
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto animate-fade-in">
              Выберите интересующую вас дисциплину и начните свой путь в спортивном программировании
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate('/competitions?discipline=product')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Layers className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-primary-900 group-hover:text-primary-800 transition-colors">Продуктовое программирование</h3>
                <p className="text-neutral-600 mb-6">Создание продуктов с фокусом на пользовательский опыт</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-primary-700 font-medium">Прогресс</span>
                      <span className="text-primary-700">75%</span>
                    </div>
                    <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-500 group-hover:bg-primary-600" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary-700">12</div>
                      <div className="text-neutral-500">Соревнований</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary-700">156</div>
                      <div className="text-neutral-500">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary-700">8</div>
                      <div className="text-neutral-500">Тренеров</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-error-50 to-error-100 p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate('/competitions?discipline=security')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-error-500/10 to-error-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="h-10 w-10 text-error-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <path d="M7 7.007V16.99"></path>
                    <path d="M12 7v10"></path>
                    <path d="M17 7v10"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-error-900 group-hover:text-error-800 transition-colors">Информационная безопасность</h3>
                <p className="text-neutral-600 mb-6">Защита систем и данных от киберугроз</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-error-700 font-medium">Прогресс</span>
                      <span className="text-error-700">60%</span>
                    </div>
                    <div className="h-2 bg-error-100 rounded-full overflow-hidden">
                      <div className="h-full bg-error-500 rounded-full transition-all duration-500 group-hover:bg-error-600" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-error-700">8</div>
                      <div className="text-neutral-500">Соревнований</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-error-700">98</div>
                      <div className="text-neutral-500">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-error-700">5</div>
                      <div className="text-neutral-500">Тренеров</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate('/competitions?discipline=algorithm')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 to-secondary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Code className="h-10 w-10 text-secondary-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-secondary-900 group-hover:text-secondary-800 transition-colors">Алгоритмическое программирование</h3>
                <p className="text-neutral-600 mb-6">Разработка эффективных алгоритмов и структур данных</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-secondary-700 font-medium">Прогресс</span>
                      <span className="text-secondary-700">85%</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary-500 rounded-full transition-all duration-500 group-hover:bg-secondary-600" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-secondary-700">15</div>
                      <div className="text-neutral-500">Соревнований</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-secondary-700">203</div>
                      <div className="text-neutral-500">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-secondary-700">12</div>
                      <div className="text-neutral-500">Тренеров</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-success-50 to-success-100 p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate('/competitions?discipline=robotics')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-success-500/10 to-success-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="h-10 w-10 text-success-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 5.5C19 7 20.5 9 21 11c.5 2 .5 4 0 6-1 4-4.5 6-7 6.5-1.5.5-4.5.5-6.5-1-2-1.5-3-4-3-6.5 0-3.5 2-6.5 4-8.5 1.5-1.5 3.5-2.5 5-3 1.5-.5 3.5-.5 5.5 0 1.5.5 2.5 1 3 1.5z"></path>
                    <path d="M13 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                    <path d="M9 16c-3.5 0-7 2-8 5"></path>
                    <path d="M22 22c-1-3-4.5-5-8-5"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-success-900 group-hover:text-success-800 transition-colors">Робототехника</h3>
                <p className="text-neutral-600 mb-6">Создание и программирование роботизированных систем</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-success-700 font-medium">Прогресс</span>
                      <span className="text-success-700">50%</span>
                    </div>
                    <div className="h-2 bg-success-100 rounded-full overflow-hidden">
                      <div className="h-full bg-success-500 rounded-full transition-all duration-500 group-hover:bg-success-600" style={{ width: '50%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-success-700">6</div>
                      <div className="text-neutral-500">Соревнований</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-success-700">87</div>
                      <div className="text-neutral-500">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-success-700">4</div>
                      <div className="text-neutral-500">Тренеров</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning-50 to-warning-100 p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
              onClick={() => navigate('/competitions?discipline=drones')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-warning-500/10 to-warning-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <svg className="h-10 w-10 text-warning-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.74 2.32a1 1 0 0 0-1.48 0l-2 2.42-2.74.73a1 1 0 0 0-.53 1.59l1.97 2.72v3.14L5.74 16a1 1 0 0 0 .26 1.13l2 2.42 2.74.73a1 1 0 0 0 1.24-.59l1.02-2.82h2l1.02 2.82a1 1 0 0 0 1.24.59l2.74-.73 2-2.42a1 1 0 0 0 .26-1.13L16 12.92V9.78l1.97-2.72a1 1 0 0 0-.53-1.59l-2.74-.73-2-2.42z"></path>
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-warning-900 group-hover:text-warning-800 transition-colors">БПЛА</h3>
                <p className="text-neutral-600 mb-6">Программирование беспилотных летательных аппаратов</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-warning-700 font-medium">Прогресс</span>
                      <span className="text-warning-700">40%</span>
                    </div>
                    <div className="h-2 bg-warning-100 rounded-full overflow-hidden">
                      <div className="h-full bg-warning-500 rounded-full transition-all duration-500 group-hover:bg-warning-600" style={{ width: '40%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-bold text-warning-700">4</div>
                      <div className="text-neutral-500">Соревнований</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-warning-700">65</div>
                      <div className="text-neutral-500">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-warning-700">3</div>
                      <div className="text-neutral-500">Тренеров</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Предстоящие соревнования */}
      <section className="py-16 px-4 bg-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Предстоящие соревнования</h2>
            <Button
              className="bg-white/100 backdrop-blur-sm text-primary-700 hover:bg-primary-50/80"
              size="lg"
              onClick={() => navigate('/competitions')}
            >
              Все соревнования
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : upcomingCompetitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCompetitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <p className="text-lg text-neutral-600">
                В настоящее время нет предстоящих соревнований. Проверьте позже!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Почему мы */}
      <section className="py-16 px-4 bg-transparent">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Почему ФСП</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-neutral-200 rounded-lg hover:shadow-md transition-all animate-fade-in bg-white/95">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Признание достижений</h3>
              <p className="text-neutral-600">
                Официальные результаты соревнований признаются по всей России, что дает преимущества при поступлении и трудоустройстве
              </p>
            </div>

            <div className="p-6 border border-neutral-200 rounded-lg hover:shadow-md transition-all animate-fade-in bg-white/95">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Сообщество</h3>
              <p className="text-neutral-600">
                Станьте частью активного сообщества программистов со всей России, обменивайтесь опытом и заводите полезные знакомства
              </p>
            </div>

            <div className="p-6 border border-neutral-200 rounded-lg hover:shadow-md transition-all animate-fade-in bg-white/95">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"></path>
                  <path d="M8 7h6"></path>
                  <path d="M8 11h8"></path>
                  <path d="M8 15h6"></path>
                </svg>
              </div>
              <h3 className="font-semibold text-xl mb-3">Развитие навыков</h3>
              <p className="text-neutral-600">
                Развивайте навыки в реальных проектах, решайте сложные задачи и постоянно совершенствуйтесь в разных дисциплинах
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      <section className="py-16 px-4 bg-primary-800 text-white text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Присоединяйтесь к Федерации спортивного программирования и станьте частью нашего сообщества
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              className="bg-white/100 text-primary-700 hover:bg-primary-50/80"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Зарегистрироваться
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-primary-700"
              onClick={() => navigate('/competitions')}
            >
              Найти соревнование
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;