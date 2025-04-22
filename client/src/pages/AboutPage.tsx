import React from 'react';

const AboutPage: React.FC = () => {
	return (
		<div className="container mx-auto px-4 py-12 max-w-6xl mt-14 sm:mt-16 md:mt-20">
			{/* Hero секция */}
			<div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 mb-10 text-white shadow-xl">
				<h1 className="text-4xl md:text-5xl font-bold mb-4">О нас</h1>
				<p className="text-xl md:text-2xl font-light max-w-3xl">
					Федерация спортивного программирования — создаем будущее технологий через соревнования и развитие талантов
				</p>
			</div>

			{/* Миссия */}
			<div className="mb-16">
				<div className="flex flex-col md:flex-row items-center gap-8">
					<div className="md:w-1/2">
						<h2 className="text-3xl font-bold mb-6 text-gray-800">Наша миссия</h2>
						<p className="text-lg text-gray-700 mb-4 leading-relaxed">
							Федерация спортивного программирования — это организация, объединяющая талантливых разработчиков
							по всей России для создания инновационных решений через соревнования и обмен опытом.
						</p>
						<p className="text-lg text-gray-700 leading-relaxed">
							Мы стремимся создать экосистему для развития профессиональных навыков,
							творческого мышления и командной работы через проведение
							соревнований различного уровня и формата.
						</p>
					</div>
					<div className="md:w-1/2 flex justify-center">
						<div className="w-full max-w-md aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-md">
							<img src="/about.png" alt="About" className="w-full h-full object-cover rounded-xl" />
						</div>
					</div>
				</div>
			</div>

			{/* Цели и дисциплины */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="bg-white/95 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
					<div className="bg-blue-600 py-4 px-6">
						<h3 className="text-xl font-bold text-white">Наши цели</h3>
					</div>
					<div className="p-6">
						<ul className="space-y-4">
							{[
								'Повышение интереса к программированию среди молодежи',
								'Проведение региональных и федеральных соревнований',
								'Формирование сообщества талантливых программистов',
								'Подготовка к международным соревнованиям',
								'Создание инновационных образовательных программ'
							].map((item, index) => (
								<li key={index} className="flex items-start">
									<svg className="w-5 h-5 text-blue-600 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">{item}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="bg-white/95 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
					<div className="bg-indigo-600 py-4 px-6">
						<h3 className="text-xl font-bold text-white">Наши дисциплины</h3>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{[
								{ title: 'Алгоритмы', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
								{ title: 'Разработка продуктов', icon: 'M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z' },
								{ title: 'Кибербезопасность', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
								{ title: 'Робототехника', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
								{ title: 'Беспилотники', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
								{ title: 'Машинное обучение', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
							].map((item, index) => (
								<div key={index} className="flex items-center p-3 bg-indigo-50 rounded-lg">
									<svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
										<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
									</svg>
									<span className="text-gray-800 font-medium">{item.title}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AboutPage; 