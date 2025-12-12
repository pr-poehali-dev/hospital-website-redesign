import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
  appointments: 'https://functions.poehali.dev/a7f148cd-e1c2-40e3-9762-cc8b2bc2dffb',
};

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const Doctor = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [schedules, setSchedules] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 0,
    start_time: '08:00',
    end_time: '17:00',
    break_start_time: '',
    break_end_time: ''
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copyFromSchedule, setCopyFromSchedule] = useState<any>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<number[]>([]);
  const lastAppointmentIdsRef = useRef<Set<number>>(new Set());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('doctor_auto_refresh');
    return saved === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('doctor_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [checkInterval, setCheckInterval] = useState(() => {
    const saved = localStorage.getItem('doctor_check_interval');
    return saved ? parseInt(saved) : 900;
  });
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, appointmentId: number | null, patientName: string, appointmentDate: string, appointmentTime: string}>({
    open: false,
    appointmentId: null,
    patientName: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [cancelDialog, setCancelDialog] = useState<{open: boolean, appointmentId: number | null, patientName: string, appointmentDate: string, appointmentTime: string}>({
    open: false,
    appointmentId: null,
    patientName: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [selectedYear, setSelectedYear] = useState(2025);
  const [calendarData, setCalendarData] = useState<{[key: string]: {is_working: boolean, note?: string}}>({});
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('doctor_auth');
    if (auth) {
      const doctor = JSON.parse(auth);
      setDoctorInfo(doctor);
      setIsAuthenticated(true);
      loadSchedules(doctor.id);
      loadAppointments(doctor.id);
      loadCalendar(doctor.id, selectedYear);
      
      if (autoRefreshEnabled) {
        const interval = setInterval(() => {
          loadAppointments(doctor.id, true);
        }, checkInterval * 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [checkInterval, autoRefreshEnabled]);

  useEffect(() => {
    if (doctorInfo && selectedYear) {
      loadCalendar(doctorInfo.id, selectedYear);
    }
  }, [selectedYear]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, type: 'doctor' }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('doctor_auth', JSON.stringify(data.user));
        setDoctorInfo(data.user);
        setIsAuthenticated(true);
        loadSchedules(data.user.id);
        loadAppointments(data.user.id);
        toast({ title: "Успешный вход", description: `Добро пожаловать, ${data.user.full_name}` });
      } else {
        toast({ title: "Ошибка", description: data.error || "Неверные данные", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadSchedules = async (doctorId: number) => {
    try {
      const response = await fetch(`${API_URLS.schedules}?doctor_id=${doctorId}`);
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить расписание", variant: "destructive" });
    }
  };

  const loadCalendar = async (doctorId: number, year: number) => {
    try {
      const response = await fetch(`${API_URLS.schedules}?action=calendar&doctor_id=${doctorId}&year=${year}`);
      const data = await response.json();
      const calendarMap: {[key: string]: {is_working: boolean, note?: string}} = {};
      (data.calendar || []).forEach((day: any) => {
        calendarMap[day.calendar_date] = {
          is_working: day.is_working,
          note: day.note
        };
      });
      setCalendarData(calendarMap);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };

  const toggleCalendarDay = async (date: string) => {
    if (!doctorInfo) return;
    
    const currentStatus = calendarData[date]?.is_working ?? true;
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calendar',
          doctor_id: doctorInfo.id,
          calendar_date: date,
          is_working: newStatus
        })
      });
      
      if (response.ok) {
        setCalendarData(prev => ({
          ...prev,
          [date]: { is_working: newStatus }
        }));
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить календарь", variant: "destructive" });
    }
  };

  const loadAppointments = async (doctorId: number, checkForNew = false) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorId}&start_date=${today}&end_date=${nextWeek}`);
      const data = await response.json();
      const newAppointments = data.appointments || [];
      
      console.log('📋 Загружено записей:', newAppointments.length, 'checkForNew:', checkForNew, 'lastIds.size:', lastAppointmentIdsRef.current.size);
      
      // Проверяем новые записи ДО обновления
      if (checkForNew && lastAppointmentIdsRef.current.size > 0) {
        const currentIds = Array.from(lastAppointmentIdsRef.current);
        const newIds = newAppointments.map((a: any) => a.id);
        console.log('🔍 Текущие ID:', currentIds);
        console.log('🔍 Новые ID:', newIds);
        
        const addedAppointments = newAppointments.filter((a: any) => !lastAppointmentIdsRef.current.has(a.id));
        console.log('✨ Добавлено записей:', addedAppointments.length);
        
        if (addedAppointments.length > 0) {
          const latestAppointment = addedAppointments[addedAppointments.length - 1];
          
          console.log('🔔 Новая запись обнаружена:', latestAppointment);
          console.log('🔊 Звук включен:', soundEnabled);
          
          if (soundEnabled) {
            playNotificationSound();
          }
          
          const appointmentDate = new Date(latestAppointment.appointment_date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
          });
          const appointmentTime = latestAppointment.appointment_time.slice(0, 5);
          const phoneNumber = latestAppointment.patient_phone || 'не указан';
          
          let description = `Пациент: ${latestAppointment.patient_name}\nТелефон: ${phoneNumber}\nДата: ${appointmentDate} в ${appointmentTime}`;
          if (latestAppointment.description) {
            description += `\nОписание: ${latestAppointment.description}`;
          }
          
          toast({
            title: "🔔 Новая запись на прием!",
            description: description,
            duration: 10000,
          });
        }
      }
      
      // Обновляем состояние ПОСЛЕ проверки
      setAppointments(newAppointments);
      setLastCheckTime(new Date());
      
      // Всегда обновляем список ID в ref (синхронно!)
      const newIds = new Set(newAppointments.map((a: any) => a.id));
      console.log('💾 Сохранено ID записей:', newIds.size);
      lastAppointmentIdsRef.current = newIds;
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить записи", variant: "destructive" });
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorInfo.id,
          ...scheduleForm
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Расписание обновлено" });
        setScheduleForm({ day_of_week: 0, start_time: '08:00', end_time: '17:00', break_start_time: '', break_end_time: '' });
        setIsOpen(false);
        loadSchedules(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось сохранить расписание", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleToggleActive = async (scheduleId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scheduleId,
          is_active: !currentStatus
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: currentStatus ? "День деактивирован" : "День активирован" });
        loadSchedules(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось изменить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот день из расписания?')) return;
    
    try {
      const response = await fetch(`${API_URLS.schedules}?id=${scheduleId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "День удален из расписания" });
        loadSchedules(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось удалить", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSchedule.id,
          start_time: editingSchedule.start_time,
          end_time: editingSchedule.end_time
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Время приема обновлено" });
        setIsEditOpen(false);
        setEditingSchedule(null);
        loadSchedules(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось обновить", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          status: newStatus
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const statusText = newStatus === 'completed' ? 'Прием завершен' : 'Запись отменена';
        toast({ title: "Успешно", description: statusText });
        loadAppointments(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось обновить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('doctor_sound_enabled', String(newValue));
    toast({ 
      title: newValue ? 'Звук включен' : 'Звук выключен',
      description: newValue ? 'Вы будете слышать уведомления о новых записях' : 'Звуковые уведомления отключены',
      duration: 3000,
    });
  };

  const changeCheckInterval = (seconds: number) => {
    setCheckInterval(seconds);
    localStorage.setItem('doctor_check_interval', String(seconds));
    toast({ 
      title: 'Интервал обновлен',
      description: `Проверка новых записей каждые ${seconds} секунд`,
      duration: 3000,
    });
  };

  const toggleAutoRefresh = () => {
    const newValue = !autoRefreshEnabled;
    setAutoRefreshEnabled(newValue);
    localStorage.setItem('doctor_auto_refresh', String(newValue));
    toast({
      title: newValue ? 'Автообновление включено' : 'Автообновление выключено',
      description: newValue 
        ? `Записи будут проверяться каждые ${checkInterval} секунд`
        : 'Записи не будут обновляться автоматически',
      duration: 3000,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('doctor_auth');
    setIsAuthenticated(false);
    setDoctorInfo(null);
  };

  const handleCopySchedule = (schedule: any) => {
    setCopyFromSchedule(schedule);
    setSelectedDaysToCopy([]);
    setIsCopyDialogOpen(true);
  };

  const handleApplyCopy = async () => {
    if (!copyFromSchedule || selectedDaysToCopy.length === 0) {
      toast({ title: "Ошибка", description: "Выберите дни для копирования", variant: "destructive" });
      return;
    }

    try {
      let successCount = 0;
      for (const dayOfWeek of selectedDaysToCopy) {
        const response = await fetch(API_URLS.schedules, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: doctorInfo.id,
            day_of_week: dayOfWeek,
            start_time: copyFromSchedule.start_time,
            end_time: copyFromSchedule.end_time,
            break_start_time: copyFromSchedule.break_start_time || null,
            break_end_time: copyFromSchedule.break_end_time || null
          }),
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      toast({ 
        title: "Успешно", 
        description: `Расписание скопировано на ${successCount} ${successCount === 1 ? 'день' : 'дней'}` 
      });
      setIsCopyDialogOpen(false);
      setCopyFromSchedule(null);
      setSelectedDaysToCopy([]);
      loadSchedules(doctorInfo.id);
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const toggleDaySelection = (dayOfWeek: number) => {
    setSelectedDaysToCopy(prev => 
      prev.includes(dayOfWeek) 
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Icon name="Stethoscope" size={28} className="text-primary" />
              Вход для врачей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Логин"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <Button type="submit" className="w-full">Войти</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredAppointments = statusFilter === 'all' 
    ? appointments 
    : appointments.filter((app: any) => app.status === statusFilter);

  const groupedAppointments = filteredAppointments.reduce((acc: any, app: any) => {
    if (!acc[app.appointment_date]) {
      acc[app.appointment_date] = [];
    }
    acc[app.appointment_date].push(app);
    return acc;
  }, {});

  const scheduledCount = appointments.filter((app: any) => app.status === 'scheduled').length;
  const completedCount = appointments.filter((app: any) => app.status === 'completed').length;
  const cancelledCount = appointments.filter((app: any) => app.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Stethoscope" size={32} className="text-primary" />
            <div>
              <h1 className="text-xl font-bold">{doctorInfo?.full_name}</h1>
              <p className="text-sm text-muted-foreground">{doctorInfo?.position}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/doctor-guide">
                <Icon name="BookOpen" size={18} className="mr-2" />
                Инструкция
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </a>
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выход
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="calendar">
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-border shadow-md">
          <div className="container mx-auto px-4 py-3">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gradient-to-r from-blue-50 to-indigo-50">
              <TabsTrigger 
                value="calendar"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2 px-4 font-semibold text-sm transition-all"
              >
                <Icon name="Calendar" size={18} className="mr-1.5" />
                Календарь
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2 px-4 font-semibold text-sm transition-all"
              >
                <Icon name="Clock" size={18} className="mr-1.5" />
                Расписание
              </TabsTrigger>
              <TabsTrigger 
                value="appointments"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2 px-4 font-semibold text-sm transition-all"
              >
                <Icon name="Users" size={18} className="mr-1.5" />
                Записи пациентов
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <section className="pb-12">
          <div className="container mx-auto px-4 pt-6">

            <TabsContent value="calendar" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Calendar" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-green-900 font-medium mb-2">📅 Годовой календарь работы</p>
                      <p className="text-sm text-green-700 mb-2">
                        Отметьте выходные дни, отпуска и праздники на весь год. Календарь имеет приоритет над еженедельным расписанием.
                      </p>
                      <div className="flex gap-3 text-xs mt-3">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                          <span className="text-green-800">Рабочий день</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                          <span className="text-red-800">Выходной</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 mb-6 items-center">
                <div>
                  <label className="text-sm font-medium mb-2 block">Выберите год:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 border rounded-lg"
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 12 }, (_, i) => i).map(monthIndex => {
                  const monthName = new Date(selectedYear, monthIndex).toLocaleString('ru-RU', { month: 'long' });
                  const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
                  const firstDayOfWeek = (new Date(selectedYear, monthIndex, 1).getDay() + 6) % 7;
                  
                  return (
                    <Card key={monthIndex}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg capitalize">{monthName} {selectedYear}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                          <div className="font-semibold">Пн</div>
                          <div className="font-semibold">Вт</div>
                          <div className="font-semibold">Ср</div>
                          <div className="font-semibold">Чт</div>
                          <div className="font-semibold">Пт</div>
                          <div className="font-semibold text-red-600">Сб</div>
                          <div className="font-semibold text-red-600">Вс</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8"></div>
                          ))}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const date = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isWorking = calendarData[date]?.is_working ?? true;
                            const dayOfWeek = new Date(selectedYear, monthIndex, day).getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const today = new Date().toISOString().split('T')[0];
                            const isToday = date === today;
                            
                            return (
                              <button
                                key={day}
                                onClick={() => toggleCalendarDay(date)}
                                className={`h-8 text-xs rounded transition-all ${
                                  isToday ? 'ring-2 ring-primary' : ''
                                } ${
                                  isWorking 
                                    ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300' 
                                    : 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                                } ${
                                  isWeekend && isWorking ? 'opacity-70' : ''
                                }`}
                                title={isWorking ? 'Рабочий день (нажмите для выходного)' : 'Выходной (нажмите для рабочего)'}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium mb-2">✨ Гибкое расписание для каждого дня недели</p>
                      <p className="text-sm text-blue-700 mb-3">
                        Настраивайте индивидуальное время работы и перерывы для каждого дня. 
                        Используйте кнопку "Копировать" для быстрого переноса расписания на другие дни недели.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-white/60 rounded-md text-blue-800">
                          <Icon name="Clock" size={12} className="inline mr-1" />
                          Разное время работы
                        </span>
                        <span className="px-2 py-1 bg-white/60 rounded-md text-orange-800">
                          <Icon name="Coffee" size={12} className="inline mr-1" />
                          Индивидуальные перерывы
                        </span>
                        <span className="px-2 py-1 bg-white/60 rounded-md text-purple-800">
                          <Icon name="Copy" size={12} className="inline mr-1" />
                          Быстрое копирование
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Рабочее расписание</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Icon name="Plus" size={20} className="mr-2" />
                      Добавить день
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Установить рабочий день</DialogTitle>
                      <DialogDescription>
                        Настройте индивидуальное расписание и перерыв для выбранного дня недели
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSchedule} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">День недели</label>
                        <select 
                          className="w-full border rounded-md p-2"
                          value={scheduleForm.day_of_week}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })}
                        >
                          {DAYS_OF_WEEK.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Время начала</label>
                        <Input
                          type="time"
                          value={scheduleForm.start_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Время окончания</label>
                        <Input
                          type="time"
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                          required
                        />
                      </div>
                      <div className="border-t pt-4">
                        <label className="text-sm font-medium mb-2 block">Перерыв (необязательно)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Начало перерыва</label>
                            <Input
                              type="time"
                              value={scheduleForm.break_start_time}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, break_start_time: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Конец перерыва</label>
                            <Input
                              type="time"
                              value={scheduleForm.break_end_time}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, break_end_time: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Сохранить</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Изменить время приема</DialogTitle>
                  </DialogHeader>
                  {editingSchedule && (
                    <form onSubmit={handleEditSchedule} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">День недели</label>
                        <Input
                          value={DAYS_OF_WEEK[editingSchedule.day_of_week]}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Время начала</label>
                        <Input
                          type="time"
                          value={editingSchedule.start_time?.slice(0, 5) || '08:00'}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Время окончания</label>
                        <Input
                          type="time"
                          value={editingSchedule.end_time?.slice(0, 5) || '17:00'}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, end_time: e.target.value })}
                          required
                        />
                      </div>
                      <div className="border-t pt-4">
                        <label className="text-sm font-medium mb-2 block">Перерыв (необязательно)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Начало перерыва</label>
                            <Input
                              type="time"
                              value={editingSchedule.break_start_time?.slice(0, 5) || ''}
                              onChange={(e) => setEditingSchedule({ ...editingSchedule, break_start_time: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Конец перерыва</label>
                            <Input
                              type="time"
                              value={editingSchedule.break_end_time?.slice(0, 5) || ''}
                              onChange={(e) => setEditingSchedule({ ...editingSchedule, break_end_time: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Сохранить изменения</Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Копировать расписание</DialogTitle>
                    <DialogDescription>
                      Выберите дни, на которые хотите скопировать это расписание
                    </DialogDescription>
                  </DialogHeader>
                  {copyFromSchedule && (
                    <div className="space-y-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4 space-y-2">
                          <p className="text-sm font-medium text-blue-900">
                            Копируется: {DAYS_OF_WEEK[copyFromSchedule.day_of_week]}
                          </p>
                          <p className="text-sm text-blue-700">
                            <Icon name="Clock" size={14} className="inline mr-1" />
                            {copyFromSchedule.start_time.slice(0, 5)} - {copyFromSchedule.end_time.slice(0, 5)}
                          </p>
                          {copyFromSchedule.break_start_time && copyFromSchedule.break_end_time && (
                            <p className="text-sm text-orange-700">
                              <Icon name="Coffee" size={14} className="inline mr-1" />
                              Перерыв: {copyFromSchedule.break_start_time.slice(0, 5)} - {copyFromSchedule.break_end_time.slice(0, 5)}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Выберите дни недели:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {DAYS_OF_WEEK.map((day, index) => {
                            const hasSchedule = schedules.some(s => s.day_of_week === index);
                            const isCurrentDay = index === copyFromSchedule.day_of_week;
                            
                            return (
                              <label
                                key={index}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isCurrentDay 
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                    : selectedDaysToCopy.includes(index)
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDaysToCopy.includes(index)}
                                  onChange={() => toggleDaySelection(index)}
                                  disabled={isCurrentDay}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <span className="font-medium">{day}</span>
                                  {hasSchedule && !isCurrentDay && (
                                    <span className="ml-2 text-xs text-orange-600">
                                      (будет перезаписан)
                                    </span>
                                  )}
                                  {isCurrentDay && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      (текущий день)
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setIsCopyDialogOpen(false)}
                        >
                          Отмена
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={handleApplyCopy}
                          disabled={selectedDaysToCopy.length === 0}
                        >
                          <Icon name="Copy" size={16} className="mr-2" />
                          Копировать на {selectedDaysToCopy.length} {selectedDaysToCopy.length === 1 ? 'день' : 'дней'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Расписание не установлено. Добавьте рабочие дни.
                    </CardContent>
                  </Card>
                ) : (
                  schedules.map((schedule: any) => (
                    <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="Calendar" size={20} className="text-primary" />
                            {DAYS_OF_WEEK[schedule.day_of_week]}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {schedule.is_active ? 'Активно' : 'Неактивно'}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={16} className="text-primary" />
                            <p className="text-lg font-medium">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </p>
                          </div>
                          {schedule.break_start_time && schedule.break_end_time ? (
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-md">
                              <Icon name="Coffee" size={14} className="text-orange-600" />
                              <p className="text-sm text-orange-900 font-medium">
                                Перерыв: {schedule.break_start_time.slice(0, 5)} - {schedule.break_end_time.slice(0, 5)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground ml-6">Без перерыва</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            variant={schedule.is_active ? "outline" : "default"}
                            onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                          >
                            <Icon name={schedule.is_active ? "PauseCircle" : "PlayCircle"} size={16} className="mr-1" />
                            {schedule.is_active ? 'Деактивировать' : 'Активировать'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setIsEditOpen(true);
                            }}
                          >
                            <Icon name="Edit" size={16} className="mr-1" />
                            Изменить
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleCopySchedule(schedule)}
                          >
                            <Icon name="Copy" size={16} className="mr-1" />
                            Копировать
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Icon name="Trash2" size={16} className="mr-1" />
                            Удалить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <Card className={`mb-6 border-2 transition-all ${autoRefreshEnabled ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'}`}>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Icon name={autoRefreshEnabled ? "RefreshCw" : "PauseCircle"} size={24} className={autoRefreshEnabled ? "text-green-600 animate-spin-slow" : "text-gray-500"} />
                          {autoRefreshEnabled && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${autoRefreshEnabled ? 'text-green-900' : 'text-gray-700'}`}>
                            {autoRefreshEnabled ? 'Автообновление включено' : 'Автообновление выключено'}
                          </p>
                          {autoRefreshEnabled ? (
                            <p className="text-xs text-green-700 mt-0.5">
                              {lastCheckTime && `Последняя проверка: ${lastCheckTime.toLocaleTimeString('ru-RU')} • `}
                              Интервал: {checkInterval}с
                            </p>
                          ) : (
                            <p className="text-xs text-gray-600 mt-0.5">Нажмите "Старт" для автоматического обновления</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        variant={autoRefreshEnabled ? "destructive" : "default"}
                        onClick={toggleAutoRefresh}
                        className="font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <Icon name={autoRefreshEnabled ? "Pause" : "Play"} size={20} className="mr-2" />
                        {autoRefreshEnabled ? 'Стоп' : 'Старт'}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      {autoRefreshEnabled && soundEnabled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={playNotificationSound}
                          className="flex-shrink-0"
                          title="Тест звука"
                        >
                          <Icon name="Play" size={16} className="mr-1" />
                          <span className="hidden sm:inline">Тест звука</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleSound}
                        disabled={!autoRefreshEnabled}
                        className="flex-1 sm:flex-initial"
                      >
                        <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={16} className="mr-2" />
                        {soundEnabled ? 'Звук вкл' : 'Звук выкл'}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!autoRefreshEnabled}
                            className="flex-1 sm:flex-initial"
                          >
                            <Icon name="Clock" size={16} className="mr-2" />
                            {checkInterval}с
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Интервал проверки</DialogTitle>
                            <DialogDescription>
                              Выберите как часто проверять наличие новых записей
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-3">
                            {[15, 30, 60, 90, 120, 300, 600, 900].map((seconds) => (
                              <Button
                                key={seconds}
                                variant={checkInterval === seconds ? 'default' : 'outline'}
                                onClick={() => changeCheckInterval(seconds)}
                                className="h-16 flex flex-col"
                              >
                                <span className="text-2xl font-bold">{seconds}</span>
                                <span className="text-xs">секунд</span>
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadAppointments(doctorInfo.id)}
                        className="flex-1 sm:flex-initial"
                      >
                        <Icon name="RotateCw" size={16} className="mr-2" />
                        Обновить вручную
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold">Записи пациентов</h2>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={statusFilter === 'all' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Все
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                      {appointments.length}
                    </span>
                  </Button>
                  <Button 
                    variant={statusFilter === 'scheduled' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter('scheduled')}
                    className={statusFilter === 'scheduled' ? '' : 'hover:bg-green-50'}
                  >
                    <Icon name="Clock" size={14} className="mr-1" />
                    Запланировано
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                      {scheduledCount}
                    </span>
                  </Button>
                  <Button 
                    variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                    className={statusFilter === 'completed' ? '' : 'hover:bg-blue-50'}
                  >
                    <Icon name="CheckCircle" size={14} className="mr-1" />
                    Завершено
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                      {completedCount}
                    </span>
                  </Button>
                  <Button 
                    variant={statusFilter === 'cancelled' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter('cancelled')}
                    className={statusFilter === 'cancelled' ? '' : 'hover:bg-gray-50'}
                  >
                    <Icon name="XCircle" size={14} className="mr-1" />
                    Отменено
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-background/20 text-xs font-semibold">
                      {cancelledCount}
                    </span>
                  </Button>
                </div>
              </div>
              
              {Object.keys(groupedAppointments).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'Нет записей на ближайшие 7 дней'
                      : `Нет записей со статусом "${
                          statusFilter === 'scheduled' ? 'Запланировано' :
                          statusFilter === 'completed' ? 'Завершено' : 'Отменено'
                        }"`
                    }
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedAppointments).sort().map((date) => (
                    <Card key={date}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon name="Calendar" size={24} className="text-primary" />
                          {new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Время</TableHead>
                              <TableHead>Пациент</TableHead>
                              <TableHead>Телефон</TableHead>
                              <TableHead className="hidden md:table-cell">Описание</TableHead>
                              <TableHead className="w-[120px]">Статус</TableHead>
                              <TableHead className="w-[180px] text-right">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedAppointments[date]
                              .sort((a: any, b: any) => a.appointment_time.localeCompare(b.appointment_time))
                              .map((appointment: any) => (
                              <TableRow key={appointment.id}>
                                <TableCell className="font-medium">
                                  {appointment.appointment_time.slice(0, 5)}
                                </TableCell>
                                <TableCell className="font-medium">{appointment.patient_name}</TableCell>
                                <TableCell className="text-sm">{appointment.patient_phone}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                                  {appointment.description || '—'}
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                    appointment.status === 'scheduled' 
                                      ? 'bg-green-100 text-green-800' 
                                      : appointment.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {appointment.status === 'scheduled' ? 'Запланировано' : 
                                     appointment.status === 'completed' ? 'Завершено' : 'Отменено'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {appointment.status === 'scheduled' && (
                                    <div className="flex gap-1 justify-end">
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => setConfirmDialog({
                                          open: true,
                                          appointmentId: appointment.id,
                                          patientName: appointment.patient_name,
                                          appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
                                          appointmentTime: appointment.appointment_time.slice(0, 5)
                                        })}
                                        title="Завершить прием"
                                      >
                                        <Icon name="CheckCircle" size={16} className="text-green-600" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => setCancelDialog({
                                          open: true,
                                          appointmentId: appointment.id,
                                          patientName: appointment.patient_name,
                                          appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
                                          appointmentTime: appointment.appointment_time.slice(0, 5)
                                        })}
                                        title="Отменить"
                                      >
                                        <Icon name="XCircle" size={16} className="text-red-600" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </section>
      </Tabs>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Завершить прием?</DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-2">
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground text-lg">{confirmDialog.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {confirmDialog.appointmentDate} в {confirmDialog.appointmentTime}
                </p>
              </div>
              <p className="text-base text-foreground pt-2">
                Вы уверены, что хотите завершить прием этого пациента?
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            >
              Нет
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (confirmDialog.appointmentId) {
                  handleUpdateAppointmentStatus(confirmDialog.appointmentId, 'completed');
                  setConfirmDialog({...confirmDialog, open: false});
                }
              }}
            >
              <Icon name="CheckCircle" size={18} className="mr-2" />
              Да
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({...cancelDialog, open})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Отменить запись?</DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-2">
              <div className="bg-red-50 rounded-lg p-4 space-y-2 border border-red-200">
                <p className="font-semibold text-foreground text-lg">{cancelDialog.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {cancelDialog.appointmentDate} в {cancelDialog.appointmentTime}
                </p>
              </div>
              <p className="text-base text-foreground pt-2">
                Вы уверены, что хотите отменить запись этого пациента?
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelDialog({...cancelDialog, open: false})}
            >
              Нет
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (cancelDialog.appointmentId) {
                  handleUpdateAppointmentStatus(cancelDialog.appointmentId, 'cancelled');
                  setCancelDialog({...cancelDialog, open: false});
                }
              }}
            >
              <Icon name="XCircle" size={18} className="mr-2" />
              Да
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Doctor;