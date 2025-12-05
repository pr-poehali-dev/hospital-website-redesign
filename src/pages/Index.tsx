import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URLS = {
  appointments: 'https://functions.poehali.dev/2147bb97-ded9-4502-b750-cc52ffabe545',
  consultations: 'https://functions.poehali.dev/d77bf8b2-a03f-4774-81ca-c6ae5f643a02',
  complaints: 'https://functions.poehali.dev/a6c04c63-0223-4bcc-b146-24acdef33536',
};

const Index = () => {
  const { toast } = useToast();
  const [appointmentForm, setAppointmentForm] = useState({ name: '', phone: '', doctor: '', date: '' });
  const [complaintForm, setComplaintForm] = useState({ name: '', email: '', message: '' });
  const [consultationForm, setConsultationForm] = useState({ name: '', phone: '', issue: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctors = [
    { name: 'Др. Иванова Мария', specialty: 'Терапевт', schedule: 'Пн-Пт: 9:00-17:00', experience: '15 лет' },
    { name: 'Др. Петров Алексей', specialty: 'Кардиолог', schedule: 'Вт-Сб: 10:00-18:00', experience: '12 лет' },
    { name: 'Др. Сидорова Елена', specialty: 'Педиатр', schedule: 'Пн-Пт: 8:00-16:00', experience: '20 лет' },
    { name: 'Др. Козлов Дмитрий', specialty: 'Хирург', schedule: 'Ср-Вс: 11:00-19:00', experience: '18 лет' },
  ];

  const handleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Запись успешна!",
          description: "Мы свяжемся с вами для подтверждения приема.",
        });
        setAppointmentForm({ name: '', phone: '', doctor: '', date: '' });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать запись",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_URLS.complaints, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Жалоба отправлена",
          description: "Мы рассмотрим ваше обращение в ближайшее время.",
        });
        setComplaintForm({ name: '', email: '', message: '' });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось отправить жалобу",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_URLS.consultations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultationForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Запрос принят!",
          description: "Врач свяжется с вами в течение 24 часов для онлайн-консультации.",
        });
        setConsultationForm({ name: '', phone: '', issue: '' });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать запрос",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <Icon name="HeartPulse" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">ГУ АЦГМБ ЛНР</p>
              <h1 className="text-sm font-bold text-primary leading-tight">Антрацитовская центральная<br />городская многопрофильная больница</h1>
            </div>
          </div>
          <nav className="hidden lg:flex gap-4 text-sm">
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">О нас</a>
            <a href="#doctors" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">График приема граждан</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Структура ГУ "АЦГМБ" ЛНР</a>
            <a href="#contacts" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Контакты</a>
          </nav>
        </div>
      </header>

      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center shadow-2xl animate-fade-in">
            <Icon name="Hospital" size={64} className="text-white" />
          </div>
          <p className="text-lg text-muted-foreground mb-2 animate-fade-in">Государственное учреждение</p>
          <h2 className="text-5xl font-bold mb-2 text-foreground animate-fade-in">Антрацитовская центральная городская многопрофильная больница</h2>
          <p className="text-lg text-muted-foreground mb-8 animate-fade-in">Луганской Народной Республики</p>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Современная медицинская помощь с заботой о каждом пациенте. Квалифицированные специалисты и передовые технологии.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-scale-in">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                  <Icon name="Calendar" size={20} />
                  Записаться на прием
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Запись на прием</DialogTitle>
                  <DialogDescription>Заполните форму, и мы свяжемся с вами</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAppointment} className="space-y-4">
                  <Input
                    placeholder="Ваше имя"
                    value={appointmentForm.name}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Телефон"
                    type="tel"
                    value={appointmentForm.phone}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Специалист"
                    value={appointmentForm.doctor}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
                    required
                  />
                  <Input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                  <Icon name="Video" size={20} />
                  Онлайн-консультация
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Онлайн-консультация</DialogTitle>
                  <DialogDescription>Врач свяжется с вами в течение 24 часов</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleConsultation} className="space-y-4">
                  <Input
                    placeholder="Ваше имя"
                    value={consultationForm.name}
                    onChange={(e) => setConsultationForm({ ...consultationForm, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Телефон"
                    type="tel"
                    value={consultationForm.phone}
                    onChange={(e) => setConsultationForm({ ...consultationForm, phone: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Опишите вашу проблему"
                    value={consultationForm.issue}
                    onChange={(e) => setConsultationForm({ ...consultationForm, issue: e.target.value })}
                    required
                    rows={4}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">О нас</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Award" size={32} className="text-primary" />
                </div>
                <CardTitle>Опыт более 25 лет</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Наша клиника работает с 1998 года, предоставляя качественную медицинскую помощь тысячам пациентов.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Users" size={32} className="text-primary" />
                </div>
                <CardTitle>Опытные врачи</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  В нашем центре работают квалифицированные специалисты высшей категории с многолетним стажем.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Microscope" size={32} className="text-primary" />
                </div>
                <CardTitle>Современное оборудование</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Используем передовые технологии и новейшее медицинское оборудование для точной диагностики.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="doctors" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">График приема граждан</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Прием граждан по личным вопросам осуществляется руководством и специалистами больницы
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                  <Icon name="UserCheck" size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg">Бровкин Е.В.</CardTitle>
                <CardDescription className="text-base font-medium">Главный врач</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Понедельник</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Среда</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                  <Icon name="Briefcase" size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg">Суялкин О.П.</CardTitle>
                <CardDescription className="text-base font-medium">Зам. главного врача по медицинской части</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Вторник</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Четверг</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                  <Icon name="ClipboardCheck" size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg">Авдеева А.В.</CardTitle>
                <CardDescription className="text-base font-medium">Зам. главного врача по экспертизе ВН</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Среда</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Пятница</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                  <Icon name="Stethoscope" size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg">Чумак А.А.</CardTitle>
                <CardDescription className="text-base font-medium">Зам. главного врача по мед. обслуживанию</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Четверг</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Пятница</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                  <Icon name="HeartPulse" size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg">Станкевич Л.К.</CardTitle>
                <CardDescription className="text-base font-medium">Главная медицинская сестра</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Вторник</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Четверг</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={20} className="text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Пятница</p>
                    <p className="text-sm text-muted-foreground">09:00 - 15:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 max-w-4xl mx-auto bg-primary/5 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Icon name="Info" size={28} className="text-primary" />
                Как записаться на прием
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">Позвоните в приемную</p>
                      <p className="text-sm text-muted-foreground">Телефон: +7-857-312-51-02</p>
                      <p className="text-sm text-muted-foreground">Время работы: Пн-Пт 09:00-17:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">Укажите данные</p>
                      <p className="text-sm text-muted-foreground">ФИО, контактный телефон, суть вопроса</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">Выберите должностное лицо</p>
                      <p className="text-sm text-muted-foreground">Специалист запишет вас на удобное время приема</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-semibold">Получите подтверждение</p>
                      <p className="text-sm text-muted-foreground">Вам сообщат дату, время и место приема</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Icon name="AlertCircle" size={24} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-2">Важная информация:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Прием осуществляется строго по предварительной записи</li>
                      <li>При себе иметь документ, удостоверяющий личность</li>
                      <li>Просьба приходить за 5-10 минут до назначенного времени</li>
                      <li>В случае невозможности прийти, просьба заранее предупредить по телефону</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Структура ГУ "АЦГМБ" ЛНР</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            В состав больницы входят специализированные отделения и службы, обеспечивающие комплексную медицинскую помощь
          </p>
          <Tabs defaultValue="clinical" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clinical">Клинические отделения</TabsTrigger>
              <TabsTrigger value="diagnostic">Диагностические службы</TabsTrigger>
              <TabsTrigger value="administration">Администрация</TabsTrigger>
            </TabsList>
            <TabsContent value="clinical" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Клинические отделения</CardTitle>
                  <CardDescription>Основные лечебные подразделения</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Activity" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Терапевтическое отделение</p>
                      <p className="text-sm text-muted-foreground">Лечение заболеваний внутренних органов, 40 коек</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Heart" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Кардиологическое отделение</p>
                      <p className="text-sm text-muted-foreground">Диагностика и лечение сердечно-сосудистых заболеваний, 25 коек</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Scissors" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Хирургическое отделение</p>
                      <p className="text-sm text-muted-foreground">Плановые и экстренные операции, 30 коек</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Baby" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Педиатрическое отделение</p>
                      <p className="text-sm text-muted-foreground">Лечение детей от 0 до 18 лет, 35 коек</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Users" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Отделение реанимации и интенсивной терапии</p>
                      <p className="text-sm text-muted-foreground">Круглосуточная помощь тяжелобольным, 10 коек</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Ambulance" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Приемное отделение</p>
                      <p className="text-sm text-muted-foreground">Круглосуточный прием экстренных пациентов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="diagnostic" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Диагностические службы</CardTitle>
                  <CardDescription>Подразделения для диагностики заболеваний</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="TestTube" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Клиническая лаборатория</p>
                      <p className="text-sm text-muted-foreground">Общеклинические, биохимические анализы</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="ScanLine" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Рентгенологическое отделение</p>
                      <p className="text-sm text-muted-foreground">Рентгенография, флюорография, маммография</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Waves" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Отделение УЗИ-диагностики</p>
                      <p className="text-sm text-muted-foreground">Ультразвуковое исследование всех органов</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Activity" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Кабинет функциональной диагностики</p>
                      <p className="text-sm text-muted-foreground">ЭКГ, холтеровское мониторирование, спирометрия</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Microscope" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Патологоанатомическое отделение</p>
                      <p className="text-sm text-muted-foreground">Гистологические и цитологические исследования</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Pill" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Аптека</p>
                      <p className="text-sm text-muted-foreground">Обеспечение медикаментами стационарных пациентов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="administration" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Административно-управленческий персонал</CardTitle>
                  <CardDescription>Руководство и обслуживающие службы</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="UserCheck" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Администрация</p>
                      <p className="text-sm text-muted-foreground">Главный врач, заместители, заведующие отделениями</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="ClipboardList" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Регистратура</p>
                      <p className="text-sm text-muted-foreground">Запись на прием, оформление документов</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="FileText" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Юридическая служба</p>
                      <p className="text-sm text-muted-foreground">Правовое сопровождение деятельности</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Calculator" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Бухгалтерия</p>
                      <p className="text-sm text-muted-foreground">Финансовый учет и отчетность</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Wrench" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Хозяйственная служба</p>
                      <p className="text-sm text-muted-foreground">Обслуживание зданий и оборудования</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Shield" size={20} className="text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Отдел кадров</p>
                      <p className="text-sm text-muted-foreground">Управление персоналом, документооборот</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" size={24} className="text-primary" />
                  Книга жалоб и предложений
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleComplaint} className="space-y-4">
                  <Input
                    placeholder="Ваше имя"
                    value={complaintForm.name}
                    onChange={(e) => setComplaintForm({ ...complaintForm, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={complaintForm.email}
                    onChange={(e) => setComplaintForm({ ...complaintForm, email: e.target.value })}
                    required
                  />
                  <Textarea
                    placeholder="Ваше сообщение"
                    value={complaintForm.message}
                    onChange={(e) => setComplaintForm({ ...complaintForm, message: e.target.value })}
                    required
                    rows={4}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="ExternalLink" size={24} className="text-primary" />
                  Полезные ссылки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <a href="#forum">
                    <Icon name="Users" size={20} />
                    Форум пациентов
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <a href="#contacts">
                    <Icon name="Phone" size={20} />
                    Контакты
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <a href="#faq">
                    <Icon name="HelpCircle" size={20} />
                    Часто задаваемые вопросы
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <a href="#services">
                    <Icon name="FileText" size={20} />
                    Прайс-лист услуг
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="contacts" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Контактные данные</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Связь с администрацией и специалистами ГУ «АЦГМБ» ЛНР
          </p>

          <div className="max-w-5xl mx-auto space-y-8">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Icon name="MapPin" size={28} className="text-primary" />
                  Адрес
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-lg">
                  <span className="font-semibold">294613</span>, Российская Федерация, Луганская Народная Республика, город Антрацит, улица Толстоусова, дом 1
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Icon name="Phone" size={24} className="text-primary" />
                  Административно-управленческий персонал
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Icon name="Phone" size={20} className="text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Приемная главного врача</p>
                        <p className="text-base">+7-857-312-51-02</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="Mail" size={20} className="text-primary mt-1" />
                      <div>
                        <p className="text-base break-all">antrasit_1gorbolnica@mail.ru</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Icon name="Phone" size={20} className="text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Коммутатор ГУ «АЦГМБ» ЛНР</p>
                        <p className="text-base">+7-857-312-60-57</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="UserCheck" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Главный врач</p>
                          <p className="text-lg font-bold text-primary">Бровкин Евгений Владимирович</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={16} className="text-primary" />
                        <span className="text-sm">+7-857-312-60-62</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="Briefcase" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Зам. главного врача</p>
                          <p className="text-sm text-muted-foreground">по медицинской части</p>
                          <p className="text-base font-bold text-primary">Суялкин Олег Павлович</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={16} className="text-primary" />
                        <span className="text-sm">+7-857-312-93-77</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="Stethoscope" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Зам. главного врача</p>
                          <p className="text-sm text-muted-foreground">по мед. обслуживанию</p>
                          <p className="text-base font-bold text-primary">Чумак Анна Анатольевна</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={16} className="text-primary" />
                        <span className="text-sm">+7-857-312-60-57 (коммутатор)</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="Shield" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Отдел кадров</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Phone" size={16} className="text-primary" />
                        <span className="text-sm">+7-857-312-56-28</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="Calculator" size={24} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Централизованная бухгалтерия</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon name="Phone" size={16} className="text-primary" />
                      <span className="text-sm">+7-857-312-88-95</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Mail" size={16} className="text-primary" />
                      <span className="text-sm">buh1gb@mail.ru</span>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/90">
            <p className="text-sm">&copy; 2024 Государственное учреждение «Антрацитовская центральная городская многопрофильная больница» ЛНР</p>
            <p className="text-xs mt-2 text-white/70">Все права защищены</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;