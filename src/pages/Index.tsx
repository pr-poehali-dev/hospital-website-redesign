import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URLS = {
  appointments: 'https://functions.poehali.dev/a7f148cd-e1c2-40e3-9762-cc8b2bc2dffb',
  doctors: 'https://functions.poehali.dev/68f877b2-aeda-437a-ad67-925a3414d688',
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
  consultations: 'https://functions.poehali.dev/d77bf8b2-a03f-4774-81ca-c6ae5f643a02',
  complaints: 'https://functions.poehali.dev/a6c04c63-0223-4bcc-b146-24acdef33536',
  smsVerify: 'https://functions.poehali.dev/7ea5c6f5-d200-4cc0-b34b-10144a995d69',
};

const Index = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorSchedule, setDoctorSchedule] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any>({});
  const [allTimeSlotsForDate, setAllTimeSlotsForDate] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({ 
    patient_name: '', 
    patient_phone: '', 
    appointment_time: '',
    description: '' 
  });
  const [verificationStep, setVerificationStep] = useState<'form' | 'code' | 'verified'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [complaintForm, setComplaintForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [maxTextIndex, setMaxTextIndex] = useState(0);
  const [isMaxBannerVisible, setIsMaxBannerVisible] = useState(false);

  const maxTexts = [
    'Максимум возможностей для жизни',
    'Быстрое и лёгкое приложение для общения и решения повседневных задач',
    'Высокое качество звонков. Общайтесь в удовольствие благодаря высокому качеству связи и быстрому соединению даже в сетях со слабым сигналом',
    'Общение на максимум. Анимированные стикеры, реакции в чатах, возможность отправки файлов до 4 ГБ – все необходимое для того, чтобы делиться настроением и важной информацией',
    'Чат боты и мини приложения. Предоставляют прямой доступ к партнерским сервисам и позволяют быстро и легко решать множество ежедневных задач',
    'Скачайте MAX на любое устройство',
  ];

  useEffect(() => {
    loadDoctors();
    
    const bannerClosed = localStorage.getItem('maxBannerClosed');
    if (!bannerClosed) {
      const timer = setTimeout(() => {
        setIsMaxBannerVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMaxTextIndex((prev) => (prev + 1) % maxTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorSchedule();
      loadAllSlots();
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
      loadAllTimeSlotsForSelectedDate();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      const response = await fetch(BACKEND_URLS.doctors);
      const data = await response.json();
      setDoctors(data.doctors?.filter((d: any) => d.is_active) || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadDoctorSchedule = async () => {
    if (!selectedDoctor) return;
    
    try {
      const response = await fetch(`${BACKEND_URLS.schedules}?doctor_id=${selectedDoctor.id}`);
      const data = await response.json();
      setDoctorSchedule(data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadAllSlots = async () => {
    if (!selectedDoctor) return;
    
    const days = getNext7Days();
    const slotsMap: any = {};
    
    for (const day of days) {
      try {
        const response = await fetch(
          `${BACKEND_URLS.appointments}?action=available-slots&doctor_id=${selectedDoctor.id}&date=${day.date}`
        );
        const data = await response.json();
        slotsMap[day.date] = {
          available: data.available_slots || [],
          hasSchedule: data.available_slots && data.available_slots.length > 0
        };
      } catch (error) {
        slotsMap[day.date] = { available: [], hasSchedule: false };
      }
    }
    
    setAllSlots(slotsMap);
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    try {
      const response = await fetch(
        `${BACKEND_URLS.appointments}?action=available-slots&doctor_id=${selectedDoctor.id}&date=${selectedDate}`
      );
      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
      setAllTimeSlotsForDate(data.all_slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const loadAllTimeSlotsForSelectedDate = async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    try {
      const response = await fetch(
        `${BACKEND_URLS.appointments}?action=available-slots&doctor_id=${selectedDoctor.id}&date=${selectedDate}`
      );
      const data = await response.json();
      setAllTimeSlotsForDate(data.all_slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }),
        dayOfWeek: date.getDay()
      });
    }
    return days;
  };

  const isDayAvailable = (date: string) => {
    return allSlots[date]?.hasSchedule || false;
  };

  const getAllSlotsForDate = async (date: string) => {
    if (!selectedDoctor) return [];
    
    try {
      const response = await fetch(
        `${BACKEND_URLS.appointments}?action=available-slots&doctor_id=${selectedDoctor.id}&date=${date}`
      );
      const data = await response.json();
      
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
      
      const schedule = doctorSchedule.find((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      
      if (!schedule) return [];
      
      const allTimeSlots = [];
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      
      const current = new Date(startTime);
      while (current < endTime) {
        const timeStr = current.toTimeString().slice(0, 5);
        allTimeSlots.push({
          time: timeStr,
          available: data.available_slots?.includes(timeStr) || false
        });
        current.setMinutes(current.getMinutes() + 15);
      }
      
      return allTimeSlots;
    } catch (error) {
      console.error('Failed to load all slots:', error);
      return [];
    }
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_URLS.smsVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send',
          phone_number: appointmentForm.patient_phone 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSentCode(data.code);
        setVerificationStep('code');
        
        if (data.fallback) {
          // Пользователь не найден в МАКС - показываем инструкцию
          toast({
            title: "Подключите мессенджер МАКС",
            description: `Для получения кодов через МАКС добавьте бота больницы в контакты. Ваш код сейчас: ${data.code}`,
            duration: 20000,
          });
        } else {
          // Код успешно отправлен в МАКС
          toast({
            title: "Код отправлен в МАКС",
            description: `Проверьте сообщения в мессенджере МАКС на номере ${appointmentForm.patient_phone}`,
            duration: 10000,
          });
        }
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось отправить код",
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

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode === sentCode) {
      setVerificationStep('verified');
      toast({
        title: "Номер подтвержден",
        description: "Теперь вы можете завершить запись",
      });
    } else {
      toast({
        title: "Неверный код",
        description: "Проверьте введенный код и попробуйте снова",
        variant: "destructive",
      });
    }
  };

  const handleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationStep !== 'verified') {
      toast({
        title: "Требуется верификация",
        description: "Сначала подтвердите номер телефона",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: selectedDate,
          ...appointmentForm
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Запись успешна!",
          description: `Вы записаны к ${selectedDoctor.full_name} на ${selectedDate} в ${appointmentForm.appointment_time}`,
        });
        setAppointmentForm({ patient_name: '', patient_phone: '', appointment_time: '', description: '' });
        setVerificationStep('form');
        setVerificationCode('');
        setSentCode('');
        setSelectedDoctor(null);
        setSelectedDate('');
        setIsAppointmentOpen(false);
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
        setComplaintForm({ name: '', email: '', phone: '', message: '' });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(https://cdn.poehali.dev/projects/317e44da-9a2a-46c7-91b6-a5c7dee19b28/files/f3cad472-e990-4101-9d1b-163dee97656f.jpg)' }}>
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/files/d1c15da6-7ffe-46bb-b5db-3d114b408cec.jpg" 
                alt="Логотип АЦГМБ ЛНР" 
                className="w-12 h-12 object-contain mix-blend-multiply"
              />
              <div>
                <h1 className="text-sm font-bold text-primary leading-tight">ГБУЗ Антрацитовская центральная<br />городская многопрофильная больница</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden lg:flex gap-4 text-sm">
                <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">О нас</a>
                <a href="#doctors" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">График приема граждан</a>
                <a href="/structure" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Структура ГУ "АЦГМБ" ЛНР</a>
                <a href="#contacts" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Контакты</a>
              </nav>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
              </Button>
            </div>
          </div>
          
          {isMobileMenuOpen && (
            <nav className="lg:hidden flex flex-col gap-3 mt-4 pt-4 border-t border-border">
              <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>О нас</a>
              <a href="#doctors" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>График приема граждан</a>
              <a href="/structure" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Структура ГУ "АЦГМБ" ЛНР</a>
              <a href="#contacts" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Контакты</a>
            </nav>
          )}

          {isMaxBannerVisible && (
            <div className="relative mt-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <a 
                href="https://max.ru/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 pr-12 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border border-blue-200 transition-all duration-300 group"
              >
                <img 
                  src="https://cdn.poehali.dev/projects/317e44da-9a2a-46c7-91b6-a5c7dee19b28/files/d6005286-66a2-4d52-91f2-27beec5e16cc.jpg" 
                  alt="MAX" 
                  className="w-10 h-10 rounded-lg shadow-sm group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-600 text-sm">MAX</span>
                    <Icon name="ExternalLink" size={14} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-700 leading-tight line-clamp-2 transition-all duration-500">
                    {maxTexts[maxTextIndex]}
                  </p>
                </div>
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsMaxBannerVisible(false);
                  localStorage.setItem('maxBannerClosed', 'true');
                }}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200/80 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Закрыть баннер"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <img 
            src="https://cdn.poehali.dev/files/d1c15da6-7ffe-46bb-b5db-3d114b408cec.jpg" 
            alt="Логотип АЦГМБ ЛНР" 
            className="w-48 h-48 mx-auto mb-8 object-contain animate-fade-in mix-blend-multiply"
          />
          <h2 className="text-5xl font-bold mb-2 text-foreground animate-fade-in">ГБУЗ Антрацитовская центральная городская многопрофильная больница</h2>
          <p className="text-lg text-muted-foreground mb-8 animate-fade-in">Луганской Народной Республики</p>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Современная медицинская помощь с заботой о каждом пациенте. Квалифицированные специалисты и передовые технологии.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-scale-in">
            <Dialog open={isAppointmentOpen} onOpenChange={setIsAppointmentOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto sm:min-w-[200px]">
                  <Icon name="Calendar" size={20} />
                  Записаться на прием
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Запись на прием</DialogTitle>
                  <DialogDescription>Выберите врача, дату и время приема</DialogDescription>
                </DialogHeader>
                
                {!selectedDoctor ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Выберите врача:</h3>
                    <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {doctors.map((doctor: any) => (
                        <Card 
                          key={doctor.id} 
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-3">
                              {doctor.photo_url ? (
                                <img 
                                  src={doctor.photo_url} 
                                  alt={doctor.full_name} 
                                  className="w-12 h-12 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon name="User" size={24} className="text-primary" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-semibold">{doctor.full_name}</div>
                                <div className="text-sm text-muted-foreground font-normal">{doctor.position}</div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {doctor.specialization && (
                              <p className="text-sm font-medium">{doctor.specialization}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !selectedDate ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedDoctor.photo_url ? (
                          <img 
                            src={selectedDoctor.photo_url} 
                            alt={selectedDoctor.full_name} 
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="User" size={24} className="text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{selectedDoctor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.position}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(null)}>
                        Изменить
                      </Button>
                    </div>
                    <h3 className="font-semibold">Выберите дату:</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {getNext7Days().map((day) => {
                        const isAvailable = isDayAvailable(day.date);
                        const availableCount = allSlots[day.date]?.available?.length || 0;
                        return (
                          <Button
                            key={day.date}
                            variant="outline"
                            className={`h-24 flex flex-col ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                            onClick={() => isAvailable && setSelectedDate(day.date)}
                            disabled={!isAvailable}
                          >
                            <span className="text-xs text-muted-foreground">{day.label.split(',')[0]}</span>
                            <span className="text-lg font-bold">{day.label.split(',')[1]}</span>
                            {!isAvailable ? (
                              <span className="text-[10px] text-red-500 mt-0.5">Нет приема</span>
                            ) : (
                              <span className="text-[10px] text-green-600 mt-0.5 font-semibold">
                                {availableCount} {availableCount === 1 ? 'место' : availableCount < 5 ? 'места' : 'мест'}
                              </span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : availableSlots.length === 0 && !isSubmitting ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedDoctor.photo_url ? (
                          <img 
                            src={selectedDoctor.photo_url} 
                            alt={selectedDoctor.full_name} 
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="User" size={24} className="text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{selectedDoctor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">Дата: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate('')}>
                        Изменить дату
                      </Button>
                    </div>
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="py-6 text-center">
                        <Icon name="AlertCircle" size={32} className="text-yellow-600 mx-auto mb-2" />
                        <p className="text-yellow-800">На выбранную дату нет свободных слотов</p>
                        <p className="text-sm text-yellow-600 mt-1">Выберите другую дату</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedDoctor.photo_url ? (
                          <img 
                            src={selectedDoctor.photo_url} 
                            alt={selectedDoctor.full_name} 
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="User" size={24} className="text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{selectedDoctor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">Дата: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedDate(''); setAppointmentForm({ ...appointmentForm, appointment_time: '' }); }}>
                        Изменить дату
                      </Button>
                    </div>
                    
                    {!appointmentForm.appointment_time ? (
                      <div>
                        <h3 className="font-semibold mb-3">Выберите время:</h3>
                        <div className="flex flex-wrap gap-4 mb-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary rounded"></div>
                            <span className="font-medium">Свободно</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                            <span className="font-medium">Занято</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-500 rounded flex items-center justify-center">
                              <Icon name="Coffee" size={10} className="text-orange-600" />
                            </div>
                            <span className="font-medium">Перерыв врача</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                          {allTimeSlotsForDate.length > 0 ? (
                            allTimeSlotsForDate.map((slot: any) => {
                              const isBreak = slot.status === 'break';
                              const isBooked = slot.status === 'booked';
                              const isAvailable = slot.status === 'available';
                              
                              return (
                                <Button
                                  key={slot.time}
                                  variant="outline"
                                  className={`${
                                    isBreak
                                      ? 'bg-orange-100 border-orange-500 text-orange-700 hover:bg-orange-200 cursor-not-allowed'
                                      : isBooked 
                                      ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200 cursor-not-allowed' 
                                      : 'hover:bg-primary hover:text-white'
                                  }`}
                                  onClick={() => slot.available && setAppointmentForm({ ...appointmentForm, appointment_time: slot.time })}
                                  disabled={!slot.available}
                                  title={isBreak ? 'Перерыв' : isBooked ? 'Занято' : 'Доступно'}
                                >
                                  {slot.time}
                                  {isBreak && <Icon name="Coffee" size={12} className="ml-1" />}
                                </Button>
                              );
                            })
                          ) : (
                            availableSlots.map((slot: string) => (
                              <Button
                                key={slot}
                                variant="outline"
                                className="hover:bg-primary hover:text-white"
                                onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: slot })}
                              >
                                {slot}
                              </Button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Card className="bg-primary/5">
                          <CardContent className="pt-4">
                            <p className="text-sm"><strong>Врач:</strong> {selectedDoctor.full_name}</p>
                            <p className="text-sm"><strong>Дата:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}</p>
                            <p className="text-sm"><strong>Время:</strong> {appointmentForm.appointment_time}</p>
                            <Button 
                              variant="link" 
                              size="sm" 
                              type="button"
                              onClick={() => setAppointmentForm({ ...appointmentForm, appointment_time: '' })}
                              className="mt-2 p-0 h-auto"
                            >
                              Изменить время
                            </Button>
                          </CardContent>
                        </Card>

                        {verificationStep === 'form' && (
                          <form onSubmit={handleSendVerificationCode} className="space-y-4">
                            <Input
                              placeholder="Ваше ФИО"
                              value={appointmentForm.patient_name}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_name: e.target.value })}
                              required
                            />
                            <Input
                              placeholder="Телефон (+79991234567)"
                              type="tel"
                              value={appointmentForm.patient_phone}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_phone: e.target.value })}
                              required
                            />
                            <Textarea
                              placeholder="Краткое описание проблемы (необязательно)"
                              value={appointmentForm.description}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                              rows={3}
                            />
                            <Button 
                              type="submit" 
                              className="w-full" 
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Отправка кода...' : 'Отправить код в MAX'}
                            </Button>
                          </form>
                        )}

                        {verificationStep === 'code' && (
                          <form onSubmit={handleVerifyCode} className="space-y-4">
                            <Card className="bg-blue-50 border-blue-200">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <Icon name="Info" size={24} className="text-blue-600 mt-1" />
                                  <div>
                                    <p className="font-medium text-blue-900 mb-1">Демо-режим верификации</p>
                                    <p className="text-sm text-blue-700">
                                      Код показан выше в уведомлении. Введите его для завершения записи.
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2">
                                      После настройки MAX API коды будут отправляться в мессенджер
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Input
                              placeholder="Введите код из MAX"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              required
                              maxLength={6}
                            />
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                className="flex-1"
                              >
                                Подтвердить
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setVerificationStep('form');
                                  setVerificationCode('');
                                }}
                              >
                                Назад
                              </Button>
                            </div>
                          </form>
                        )}

                        {verificationStep === 'verified' && (
                          <form onSubmit={handleAppointment} className="space-y-4">
                            <Card className="bg-green-50 border-green-200">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <Icon name="CheckCircle" size={20} className="text-green-600" />
                                  <p className="font-medium text-green-900">Номер подтвержден</p>
                                </div>
                              </CardContent>
                            </Card>
                            <div className="space-y-2 text-sm">
                              <p><strong>ФИО:</strong> {appointmentForm.patient_name}</p>
                              <p><strong>Телефон:</strong> {appointmentForm.patient_phone}</p>
                              {appointmentForm.description && (
                                <p><strong>Описание:</strong> {appointmentForm.description}</p>
                              )}
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full" 
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Отправка...' : 'Подтвердить запись'}
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button 
              size="lg" 
              className="gap-2 shadow-lg hover:shadow-xl transition-shadow bg-red-600 hover:bg-red-700 w-full sm:w-auto sm:min-w-[200px]"
              asChild
            >
              <a href="#complaints">
                <Icon name="MessageSquare" size={20} />
                Книга жалоб
              </a>
            </Button>

            <Button 
              size="lg" 
              className="gap-2 shadow-lg hover:shadow-xl transition-shadow bg-green-600 hover:bg-green-700 w-full sm:w-auto sm:min-w-[200px]"
              asChild
            >
              <a href="/forum">
                <Icon name="Users" size={20} />
                Больничный форум
              </a>
            </Button>
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
                <CardTitle>Огромный опыт работы</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Наша больница предоставляет качественную медицинскую помощь тысячам пациентов.
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
                  В нашей больнице работают квалифицированные специалисты высшей категории с многолетним стажем.
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
                <img 
                  src="https://cdn.poehali.dev/files/Бровкин ЕВ.jpg" 
                  alt="Бровкин Е.В."
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 mb-4"
                />
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
                <img 
                  src="https://cdn.poehali.dev/files/суялкин.jpg" 
                  alt="Суялкин О.П."
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 mb-4"
                />
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

      <section id="services" className="py-16 bg-white/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Структура ГУ "АЦГМБ" ЛНР</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Полная информация о поликлиниках, амбулаториях, отделениях и службах больницы
          </p>
          <Button asChild size="lg" className="gap-2">
            <a href="/structure">
              <Icon name="Building2" size={20} />
              Посмотреть полную структуру
            </a>
          </Button>
        </div>
      </section>

      <section id="complaints" className="py-16 bg-muted/50">
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
                  <Input
                    placeholder="Номер телефона"
                    type="tel"
                    value={complaintForm.phone}
                    onChange={(e) => setComplaintForm({ ...complaintForm, phone: e.target.value })}
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
                  <a href="#contacts">
                    <Icon name="Phone" size={20} />
                    Контакты
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" asChild>
                  <a href="/faq">
                    <Icon name="HelpCircle" size={20} />
                    Часто задаваемые вопросы
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
              <CardContent className="pt-6 space-y-4">
                <p className="text-lg">
                  <span className="font-semibold">294613</span>, Российская Федерация, Луганская Народная Республика, город Антрацит, улица Толстоусова, дом 1
                </p>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-primary/10">
                  <iframe
                    src="https://yandex.ru/map-widget/v1/?ll=39.092612%2C48.125307&z=17.4&l=map&pt=39.092612,48.125307,pm2rdm"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    style={{ position: 'relative' }}
                  ></iframe>
                </div>
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
                        <img 
                          src="https://cdn.poehali.dev/files/Бровкин ЕВ.jpg" 
                          alt="Бровкин Евгений Владимирович"
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
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
                        <img 
                          src="https://cdn.poehali.dev/files/суялкин.jpg" 
                          alt="Суялкин Олег Павлович"
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
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
            <p className="text-sm">© 2024 ГБУЗ «Антрацитовская центральная городская многопрофильная больница» ЛНР</p>
            <p className="text-xs mt-2 text-white/70">Все права защищены</p>
            <a href="/doctor" className="text-xs mt-2 text-white/70 hover:text-white transition-colors inline-block">
              Вход для врача
            </a>
          </div>
        </div>
      </footer>

      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="snowflake absolute text-white/80 text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              fontSize: `${10 + Math.random() * 20}px`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-2 animate-bounce-slow pointer-events-none">
        <div className="text-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-green-500">
          <p className="text-green-700 font-bold text-sm whitespace-nowrap">С Новым Годом! 🎉</p>
        </div>
        <div className="text-6xl animate-swing">
          🎄
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes swing {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0.8;
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-swing {
          animation: swing 2s ease-in-out infinite;
          transform-origin: top center;
        }
        
        .snowflake {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;