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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <Icon name="HeartPulse" size={32} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Государственное учреждение</p>
              <h1 className="text-2xl font-bold text-primary">Антрацитовская центральная городская многопрофильная больница</h1>
              <p className="text-xs text-muted-foreground">Луганской Народной Республики</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">О нас</a>
            <a href="#doctors" className="text-foreground hover:text-primary transition-colors font-medium">Врачи</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">Услуги</a>
            <a href="#contacts" className="text-foreground hover:text-primary transition-colors font-medium">Контакты</a>
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
          <h2 className="text-4xl font-bold text-center mb-12">График приема врачей</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Icon name="Stethoscope" size={36} className="text-white" />
                  </div>
                  <CardTitle className="text-center">{doctor.name}</CardTitle>
                  <CardDescription className="text-center text-base font-medium">{doctor.specialty}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Clock" size={16} className="text-primary" />
                    <span>{doctor.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Briefcase" size={16} className="text-primary" />
                    <span>Опыт: {doctor.experience}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Наши услуги</h2>
          <Tabs defaultValue="consultation" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="consultation">Консультации</TabsTrigger>
              <TabsTrigger value="diagnostics">Диагностика</TabsTrigger>
              <TabsTrigger value="treatment">Лечение</TabsTrigger>
            </TabsList>
            <TabsContent value="consultation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Консультации специалистов</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Прием терапевта, кардиолога, педиатра, хирурга</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Онлайн-консультации с врачами в удобное время</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Повторные консультации по результатам анализов</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Профилактические осмотры и диспансеризация</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="diagnostics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Диагностика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Лабораторные анализы крови, мочи</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>УЗИ-диагностика всех органов</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>ЭКГ и холтеровское мониторирование</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Рентгенография и флюорография</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="treatment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Лечение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Амбулаторное и стационарное лечение</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Физиотерапевтические процедуры</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Хирургические операции различной сложности</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="text-primary mt-1" />
                    <p>Реабилитационные программы</p>
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

      <footer id="contacts" className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="MapPin" size={24} />
                Адрес
              </h3>
              <p className="text-white/90">г. Москва, ул. Здоровья, д. 25</p>
              <p className="text-white/90 mt-2">Метро "Университет"</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Phone" size={24} />
                Контакты
              </h3>
              <p className="text-white/90">+7 (495) 123-45-67</p>
              <p className="text-white/90 mt-2">info@medcentr.ru</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Clock" size={24} />
                Режим работы
              </h3>
              <p className="text-white/90">Пн-Пт: 8:00 - 20:00</p>
              <p className="text-white/90 mt-2">Сб-Вс: 9:00 - 18:00</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/80">
            <p>&copy; 2024 МедЦентр Здоровье. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;