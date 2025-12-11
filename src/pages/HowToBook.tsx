import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const HowToBook = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      icon: 'Smartphone',
      title: 'Установите мессенджер MAX',
      description: 'Скачайте приложение MAX на ваш телефон. Это нужно для получения кода подтверждения.',
      details: [
        'Android: Google Play',
        'iOS: App Store', 
        'Компьютер: max.ru'
      ]
    },
    {
      number: 2,
      icon: 'MousePointerClick',
      title: 'Нажмите "Записаться на прием"',
      description: 'На главной странице сайта найдите и нажмите кнопку "Записаться на прием".',
      details: []
    },
    {
      number: 3,
      icon: 'UserCog',
      title: 'Выберите врача',
      description: 'Просмотрите список врачей и выберите нужного специалиста.',
      details: [
        'Смотрите специализацию врача',
        'Читайте информацию о стаже',
        'Нажмите "Выбрать"'
      ]
    },
    {
      number: 4,
      icon: 'Calendar',
      title: 'Выберите дату',
      description: 'Выберите удобную дату приема. Запись доступна на 14 дней вперед.',
      details: [
        'Зеленые дни — врач принимает',
        'Серые дни — врач не работает'
      ]
    },
    {
      number: 5,
      icon: 'Clock',
      title: 'Выберите время',
      description: 'Выберите свободное время приема из доступных слотов.',
      details: [
        '□ Свободно — можно записаться',
        '■ Занято — выберите другое время',
        '☕ Перерыв — обеденный перерыв врача'
      ]
    },
    {
      number: 6,
      icon: 'FileText',
      title: 'Заполните данные',
      description: 'Введите ваши личные данные для записи.',
      details: [
        'ФИО полностью',
        'Телефон в формате +79991234567',
        'Описание жалоб (необязательно)'
      ]
    },
    {
      number: 7,
      icon: 'MessageSquare',
      title: 'Получите код в MAX',
      description: 'После отправки формы вам придет SMS-код в мессенджер MAX.',
      details: [
        'Откройте MAX на телефоне',
        'Найдите сообщение от больницы',
        'Запомните 6-значный код'
      ]
    },
    {
      number: 8,
      icon: 'Key',
      title: 'Введите код подтверждения',
      description: 'Введите полученный код из MAX на сайте для подтверждения записи.',
      details: [
        'Код действителен 10 минут',
        'Максимум 5 попыток ввода'
      ]
    },
    {
      number: 9,
      icon: 'CheckCircle',
      title: 'Запись подтверждена!',
      description: 'Поздравляем! Вы успешно записаны на прием.',
      details: [
        'Распечатайте талон',
        'Или сохраните скриншот',
        'Приходите за 10 минут до приема'
      ]
    }
  ];

  const faqs = [
    {
      question: 'Что делать, если не пришел код в MAX?',
      answer: 'Проверьте, что мессенджер MAX установлен и работает. Убедитесь, что вы правильно ввели номер телефона. Если код не пришел, он будет показан на экране как запасной вариант.'
    },
    {
      question: 'Код не подходит, что делать?',
      answer: 'Убедитесь, что вводите правильный код (6 цифр). Проверьте, не истек ли срок действия (10 минут). Попробуйте запросить новый код.'
    },
    {
      question: 'Как отменить запись?',
      answer: 'Позвоните в регистратуру: +7-857-312-51-02 или напишите в книгу жалоб на сайте.'
    },
    {
      question: 'Можно ли записаться без мессенджера MAX?',
      answer: 'В таком случае код будет показан прямо на экране. Но мы настоятельно рекомендуем установить MAX для удобства.'
    },
    {
      question: 'На сколько дней вперед можно записаться?',
      answer: 'Запись доступна на 14 дней вперед.'
    },
    {
      question: 'Сколько раз в день можно запрашивать код?',
      answer: 'Максимум 3 кода в день на один номер телефона. Это сделано для защиты от спама.'
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
                Как записаться на прием
              </h1>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Icon name="Home" size={16} className="mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">📋 Как записаться на прием к врачу</h1>
            <p className="text-xl text-muted-foreground">
              Пошаговая инструкция для пациентов
            </p>
          </div>

          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Icon name="Info" size={32} className="text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2 text-blue-900">Что вам понадобится:</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Номер телефона
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Мессенджер MAX (установлен на телефоне)
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon name="Check" size={16} className="text-blue-600" />
                      Доступ к интернету
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 mb-12">
            {steps.map((step) => (
              <Card key={step.number} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon name={step.icon as any} size={24} className="text-primary" />
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
                {step.details.length > 0 && (
                  <CardContent>
                    <ul className="space-y-2 ml-16">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Icon name="ChevronRight" size={16} className="text-primary" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

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
                Контрольный чек-лист перед визитом
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>У меня есть подтвержденная запись (дата + время)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Я распечатал талон (или сохранил скриншот)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Я знаю, к какому врачу иду (ФИО + кабинет)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>У меня с собой документы (паспорт, полис)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-green-600 rounded"></div>
                  <span>Я приду за 10 минут до приема</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Phone" size={24} className="text-primary" />
                Контакты для помощи
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Телефоны:</h4>
                <p className="text-muted-foreground">Регистратура: +7-857-312-51-02</p>
                <p className="text-muted-foreground">Приемная главного врача: +7-857-312-51-02</p>
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

          <div className="text-center space-y-4">
            <Button size="lg" onClick={() => navigate('/')} className="gap-2">
              <Icon name="Calendar" size={20} />
              Записаться на прием сейчас
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

export default HowToBook;
