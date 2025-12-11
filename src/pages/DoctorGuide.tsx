import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const DoctorGuide = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'login',
      icon: 'LogIn',
      title: 'Вход в систему',
      content: [
        'Откройте страницу входа по адресу /doctor',
        'Введите логин и пароль (выданные администрацией)',
        'После 5 неудачных попыток учетная запись блокируется на 15 минут'
      ]
    },
    {
      id: 'calendar',
      icon: 'CalendarDays',
      title: 'Годовой календарь работы',
      subsections: [
        {
          title: 'Работа с календарем',
          steps: [
            'Откройте вкладку "Календарь" (первая вкладка)',
            'Выберите год из выпадающего списка (2025-2030)',
            'Отображаются все 12 месяцев с календарной сеткой',
            'Зеленый цвет = рабочий день, красный = выходной'
          ]
        },
        {
          title: 'Отметка выходных дней',
          steps: [
            'Нажмите на любой день в календаре',
            'День переключится: рабочий → выходной или наоборот',
            'Изменения сохраняются автоматически',
            'Текущий день выделен синей рамкой'
          ]
        },
        {
          title: 'Планирование отпусков и праздников',
          steps: [
            'Отметьте все дни отпуска красным цветом',
            'Календарь имеет ПРИОРИТЕТ над еженедельным расписанием',
            'Пациенты не смогут записаться на выходные дни',
            'Планируйте отпуска заранее на весь год'
          ]
        },
        {
          title: 'Важно знать',
          steps: [
            '⚠️ Календарь важнее расписания: даже если в расписании стоит рабочий день, выходной в календаре запретит запись',
            'Используйте календарь для исключений: праздники, больничные, командировки',
            'Выходные дни автоматически скрываются при записи пациентов'
          ]
        }
      ]
    },
    {
      id: 'schedule',
      icon: 'Calendar',
      title: 'Еженедельное расписание',
      subsections: [
        {
          title: 'Добавление рабочего дня',
          steps: [
            'Перейдите на вкладку "Расписание"',
            'Нажмите кнопку "Добавить день"',
            'Выберите день недели',
            'Укажите время начала и окончания приема',
            'Опционально: добавьте время перерыва',
            'Нажмите "Сохранить"'
          ]
        },
        {
          title: 'Изменение расписания',
          steps: [
            'Найдите нужный день в списке',
            'Нажмите кнопку "Изменить"',
            'Измените время приема или перерыва',
            'Сохраните изменения'
          ]
        },
        {
          title: 'Копирование на другие дни',
          steps: [
            'Нажмите "Копировать" на карточке дня',
            'Выберите дни, на которые хотите скопировать',
            'Подтвердите копирование'
          ]
        },
        {
          title: 'Деактивация дня',
          steps: [
            'Нажмите "Деактивировать" для временного отключения',
            'Пациенты не смогут записаться на этот день',
            'Для возобновления нажмите "Активировать"'
          ]
        }
      ]
    },
    {
      id: 'appointments',
      icon: 'Users',
      title: 'Записи пациентов',
      subsections: [
        {
          title: 'Просмотр записей',
          steps: [
            'Переключитесь на вкладку "Записи пациентов"',
            'Записи группируются по датам',
            'Используйте фильтры для поиска нужных записей'
          ]
        },
        {
          title: 'Завершение приема',
          steps: [
            'Найдите запись пациента',
            'Нажмите кнопку ✅ (Завершить прием)',
            'Подтвердите действие',
            'Статус изменится на "Завершено"'
          ]
        },
        {
          title: 'Отмена записи',
          steps: [
            'Найдите запись пациента',
            'Нажмите кнопку ❌ (Отменить)',
            'Подтвердите отмену',
            'Рекомендуется уведомить пациента по телефону'
          ]
        }
      ]
    },
    {
      id: 'notifications',
      icon: 'Bell',
      title: 'Уведомления',
      content: [
        'Система автоматически проверяет новые записи каждые 15-120 секунд',
        'При появлении новой записи прозвучит сигнал (если звук включен)',
        'Появится всплывающее уведомление с данными пациента',
        'Настройте интервал проверки и звук по своему усмотрению'
      ]
    }
  ];

  const faqs = [
    {
      question: 'В чем разница между календарем и расписанием?',
      answer: 'Расписание — это ваш обычный график работы по дням недели. Календарь — это конкретные даты года, где вы можете отметить выходные, отпуска, праздники. Календарь всегда имеет приоритет: если день в календаре красный (выходной), пациенты не смогут записаться, даже если в расписании этот день недели рабочий.'
    },
    {
      question: 'Как запланировать отпуск на 2 недели?',
      answer: 'Откройте вкладку "Календарь", выберите нужный год, найдите месяцы вашего отпуска и поочередно нажмите на каждый день отпуска, чтобы отметить их красным цветом. Пациенты автоматически не увидят эти дни при записи.'
    },
    {
      question: 'Как изменить пароль?',
      answer: 'Обратитесь к администратору больницы. Самостоятельная смена пароля пока не реализована.'
    },
    {
      question: 'Что делать, если пациент не пришел на прием?',
      answer: 'Отметьте запись как "Отменено". Это поможет собрать статистику неявок.'
    },
    {
      question: 'Можно ли вернуть удаленное расписание?',
      answer: 'Нет, удаление необратимо. Но вы можете создать расписание заново с теми же параметрами.'
    },
    {
      question: 'Не слышу звуковые уведомления. Что делать?',
      answer: 'Проверьте: 1) Кнопка "Звук вкл" активна 2) Звук в браузере включен 3) Системная громкость не на минимуме 4) Нажмите "Тест" для проверки'
    },
    {
      question: 'Сколько времени дается на один прием?',
      answer: 'Система автоматически создает слоты по 15 минут. Пациент занимает один слот.'
    },
    {
      question: 'Как посмотреть записи за прошедший период?',
      answer: 'Система показывает записи на 14 дней вперед от текущей даты.'
    },
    {
      question: 'Что если я случайно отметил рабочий день как выходной?',
      answer: 'Просто нажмите на этот день еще раз в календаре, и он снова станет рабочим (зеленым). Изменения сохраняются моментально.'
    }
  ];

  const statuses = [
    {
      icon: 'Clock',
      color: 'text-green-600',
      bg: 'bg-green-100',
      title: 'Запланировано',
      description: 'Пациент записан, прием еще не состоялся'
    },
    {
      icon: 'CheckCircle',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      title: 'Завершено',
      description: 'Прием завершен успешно'
    },
    {
      icon: 'XCircle',
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      title: 'Отменено',
      description: 'Запись отменена врачом или пациентом'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/files/d1c15da6-7ffe-46bb-b5db-3d114b408cec.jpg" 
              alt="Логотип АЦГМБ ЛНР" 
              className="w-12 h-12 object-contain mix-blend-multiply"
            />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">ГБУЗ "АЦГМБ" ЛНР</p>
              <h1 className="text-sm font-bold text-primary leading-tight">
                Инструкция для врачей
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/doctor')}>
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Личный кабинет
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">📘 Инструкция для врачей</h1>
            <p className="text-xl text-muted-foreground">
              Руководство по работе с личным кабинетом врача
            </p>
          </div>

          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Icon name="Info" size={32} className="text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2 text-blue-900">Возможности личного кабинета:</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Годовой календарь работы с отметкой выходных и отпусков
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Управление еженедельным расписанием по дням недели
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Просмотр записей пациентов на 14 дней вперед
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Автоматические уведомления о новых записях
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Управление статусами приемов (завершение, отмена)
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8 mb-12">
            {sections.map((section) => (
              <Card key={section.id} id={section.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon name={section.icon as any} size={24} className="text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content && (
                    <ul className="space-y-3">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Icon name="ChevronRight" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {section.subsections && (
                    <div className="space-y-6">
                      {section.subsections.map((subsection, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-primary/20">
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Icon name="ArrowRight" size={18} className="text-primary" />
                            {subsection.title}
                          </h4>
                          <ol className="space-y-2 list-decimal list-inside">
                            {subsection.steps.map((step, stepIdx) => (
                              <li key={stepIdx} className="text-muted-foreground ml-4">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-8 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Icon name="Info" size={24} />
                Статусы записей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {statuses.map((status, idx) => (
                  <div key={idx} className={`${status.bg} p-4 rounded-lg border-2 border-transparent hover:border-${status.color.replace('text-', 'border-')} transition-colors`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name={status.icon as any} size={24} className={status.color} />
                      <h4 className="font-bold">{status.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{status.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">❓ Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <Icon name="HelpCircle" size={20} className="text-primary flex-shrink-0 mt-1" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Icon name="CheckSquare" size={24} />
                Ежедневный чек-лист
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Войти в систему в начале рабочего дня</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Проверить список запланированных пациентов</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Убедиться, что звук уведомлений включен</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>После каждого приема отмечать запись как "Завершено"</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>При отмене пациента — отменить запись в системе</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Phone" size={24} className="text-primary" />
                Техническая поддержка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Телефоны:</h4>
                <p className="text-muted-foreground">Регистратура: +7-857-312-51-02</p>
                <p className="text-muted-foreground">Приемная главного врача: +7-857-312-51-02</p>
                <p className="text-muted-foreground">Коммутатор: +7-857-312-60-57</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email:</h4>
                <p className="text-muted-foreground">antrasit_1gorbolnica@mail.ru</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Режим работы:</h4>
                <p className="text-muted-foreground">Пн-Пт: 8:00 - 18:00</p>
                <p className="text-muted-foreground">Сб: 8:00 - 14:00</p>
                <p className="text-muted-foreground">Вс: выходной</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Icon name="AlertCircle" size={32} className="text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2 text-orange-900">Важные напоминания:</h3>
                  <ul className="space-y-2 text-orange-800">
                    <li className="flex items-start gap-2">
                      <Icon name="ChevronRight" size={16} className="text-orange-600 flex-shrink-0 mt-1" />
                      <span>Изменения в расписании влияют только на будущие записи</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="ChevronRight" size={16} className="text-orange-600 flex-shrink-0 mt-1" />
                      <span>При отмене записи пациент НЕ получает автоматическое уведомление</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="ChevronRight" size={16} className="text-orange-600 flex-shrink-0 mt-1" />
                      <span>Удаление расписания необратимо — будьте внимательны</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="ChevronRight" size={16} className="text-orange-600 flex-shrink-0 mt-1" />
                      <span>Все слоты фиксированные — 15 минут на пациента</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <Button size="lg" onClick={() => navigate('/doctor')} className="gap-2">
              <Icon name="Stethoscope" size={20} />
              Перейти в личный кабинет
            </Button>
            <p className="text-sm text-muted-foreground">
              Версия инструкции: 1.0 от 11 декабря 2024 года
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-primary text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/90">
            <p className="text-sm">© 2024 ГБУЗ «Антрацитовская центральная городская многопрофильная больница» ЛНР</p>
            <p className="text-xs mt-2 text-white/70">Все права защищены</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DoctorGuide;