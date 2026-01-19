import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
  doctors: 'https://functions.poehali.dev/68f877b2-aeda-437a-ad67-925a3414d688',
  appointments: 'https://functions.poehali.dev/a7f148cd-e1c2-40e3-9762-cc8b2bc2dffb',
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
  registrars: 'https://functions.poehali.dev/bda47195-c96f-4fb7-b72c-59d877add3c2',
};

const Registrar = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrarInfo, setRegistrarInfo] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [newAppointmentDialog, setNewAppointmentDialog] = useState({
    open: false,
    patientName: '',
    patientPhone: '',
    patientSnils: '',
    description: '',
    time: ''
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editDialog, setEditDialog] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<any>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<any>(null);
  const [rescheduleAvailableDates, setRescheduleAvailableDates] = useState<any[]>([]);
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState<string>('');
  const [rescheduleAvailableSlots, setRescheduleAvailableSlots] = useState<string[]>([]);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState<string>('');
  const [cloneDialog, setCloneDialog] = useState<any>(null);
  const [cloneAvailableDates, setCloneAvailableDates] = useState<any[]>([]);
  const [cloneSelectedDate, setCloneSelectedDate] = useState<string>('');
  const [cloneAvailableSlots, setCloneAvailableSlots] = useState<string[]>([]);
  const [cloneSelectedSlot, setCloneSelectedSlot] = useState<string>('');
  const [calendarData, setCalendarData] = useState<{[key: string]: {is_working: boolean}}>({});
  const [schedules, setSchedules] = useState<any[]>([]);
  const [rescheduleConfirmDialog, setRescheduleConfirmDialog] = useState<{open: boolean, data: any}>({open: false, data: null});
  const [rescheduleSuccessDialog, setRescheduleSuccessDialog] = useState<{open: boolean, data: any}>({open: false, data: null});
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('registrar_auth');
    if (auth) {
      const registrar = JSON.parse(auth);
      setRegistrarInfo(registrar);
      setIsAuthenticated(true);
      loadDoctors(registrar.clinic);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadSchedules(selectedDoctor.id);
      loadCalendar(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (schedules.length > 0 || Object.keys(calendarData).length > 0) {
      generateAvailableDates();
    }
  }, [schedules, calendarData]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      loadAvailableSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) {
      loadAppointments(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (rescheduleSelectedDate) {
      loadRescheduleSlots(rescheduleSelectedDate);
    }
  }, [rescheduleSelectedDate]);

  useEffect(() => {
    if (cloneSelectedDate) {
      loadCloneSlots(cloneSelectedDate);
    }
  }, [cloneSelectedDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, type: 'registrar' }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('registrar_auth', JSON.stringify(data.user));
        setRegistrarInfo(data.user);
        setIsAuthenticated(true);
        loadDoctors(data.user.clinic);
        toast({ title: "Успешный вход", description: `Добро пожаловать, ${data.user.full_name}` });
      } else {
        toast({ title: "Ошибка", description: data.error || "Неверные данные", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadDoctors = async (clinic: string) => {
    try {
      const response = await fetch(API_URLS.doctors);
      const data = await response.json();
      
      const filteredDoctors = (data.doctors || []).filter((d: any) => {
        return d.clinic === clinic && d.is_active;
      });
      
      console.log('Регистратор поликлиника:', clinic);
      console.log('Найдено врачей:', filteredDoctors.length);
      
      setDoctors(filteredDoctors);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить врачей", variant: "destructive" });
    }
  };

  const loadSchedules = async (doctorId: number) => {
    try {
      const response = await fetch(`${API_URLS.schedules}?doctor_id=${doctorId}`);
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const loadCalendar = async (doctorId: number) => {
    try {
      const year = new Date().getFullYear();
      const response = await fetch(`${API_URLS.schedules}?action=calendar&doctor_id=${doctorId}&year=${year}`);
      const data = await response.json();
      const calendarMap: {[key: string]: {is_working: boolean}} = {};
      (data.calendar || []).forEach((day: any) => {
        calendarMap[day.calendar_date] = { is_working: day.is_working };
      });
      setCalendarData(calendarMap);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };

  const generateAvailableDates = async () => {
    const dates = [];
    for (let i = 0; i <= 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      const hasSchedule = schedules.some((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      const calendarOverride = calendarData[dateStr];
      const isWorking = calendarOverride !== undefined ? calendarOverride.is_working : hasSchedule;
      
      let slotsCount = 0;
      if (isWorking && selectedDoctor) {
        try {
          const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${selectedDoctor.id}&date=${dateStr}`);
          const data = await response.json();
          slotsCount = (data.available_slots || []).length;
        } catch (error) {
          console.error('Failed to load slots count:', error);
        }
      }
      
      dates.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        isWorking,
        slotsCount
      });
    }
    setAvailableDates(dates);
  };

  const loadAvailableSlots = async (doctorId: number, date: string) => {
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${doctorId}&date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.available_slots || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить слоты", variant: "destructive" });
    }
  };

  const loadAppointments = async (doctorId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorId}&start_date=${today}&end_date=${endDateStr}`);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить записи", variant: "destructive" });
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAppointmentDialog.patientName || !newAppointmentDialog.patientPhone || !newAppointmentDialog.time || !selectedDate) {
      toast({ title: "Ошибка", description: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          patient_name: newAppointmentDialog.patientName,
          patient_phone: newAppointmentDialog.patientPhone,
          patient_snils: newAppointmentDialog.patientSnils,
          appointment_date: selectedDate,
          appointment_time: newAppointmentDialog.time,
          description: newAppointmentDialog.description
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await logAction('Создание записи', {
          appointment_id: data.appointment.id,
          patient_name: newAppointmentDialog.patientName,
          patient_phone: newAppointmentDialog.patientPhone,
          patient_snils: newAppointmentDialog.patientSnils,
          doctor_name: selectedDoctor.full_name,
          appointment_date: selectedDate,
          appointment_time: newAppointmentDialog.time,
          description: newAppointmentDialog.description
        });

        toast({ 
          title: "Успешно", 
          description: `Пациент ${newAppointmentDialog.patientName} записан` 
        });
        setNewAppointmentDialog({
          open: false,
          patientName: '',
          patientPhone: '',
          patientSnils: '',
          description: '',
          time: ''
        });
        setSelectedDate('');
        loadAppointments(selectedDoctor.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось создать запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          status: 'cancelled'
        }),
      });

      if (response.ok) {
        await logAction('Отмена записи', {
          appointment_id: cancelDialog.id,
          patient_name: cancelDialog.patient_name,
          patient_phone: cancelDialog.patient_phone,
          patient_snils: cancelDialog.patient_snils,
          doctor_name: selectedDoctor.full_name,
          appointment_date: cancelDialog.appointment_date,
          appointment_time: cancelDialog.appointment_time,
          description: cancelDialog.description
        });

        toast({ title: "Успешно", description: "Запись отменена" });
        loadAppointments(selectedDoctor.id);
        setCancelDialog(null);
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const openRescheduleDialog = (appointment: any) => {
    setRescheduleDialog(appointment);
    setRescheduleSelectedDate('');
    setRescheduleSelectedSlot('');
    generateRescheduleDates();
  };

  const generateRescheduleDates = () => {
    const dates = [];
    for (let i = 0; i <= 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      const hasSchedule = schedules.some((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      const calendarOverride = calendarData[dateStr];
      const isWorking = calendarOverride !== undefined ? calendarOverride.is_working : hasSchedule;
      
      dates.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        isWorking,
      });
    }
    setRescheduleAvailableDates(dates);
  };

  const loadRescheduleSlots = async (date: string) => {
    if (!rescheduleDialog) return;
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${rescheduleDialog.doctor_id}&date=${date}`);
      const data = await response.json();
      setRescheduleAvailableSlots(data.available_slots || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить слоты", variant: "destructive" });
    }
  };

  const openCloneDialog = (appointment: any) => {
    setCloneDialog(appointment);
    setCloneSelectedDate('');
    setCloneSelectedSlot('');
    generateCloneDates();
  };

  const generateCloneDates = () => {
    const dates = [];
    for (let i = 0; i <= 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      const hasSchedule = schedules.some((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      const calendarOverride = calendarData[dateStr];
      const isWorking = calendarOverride !== undefined ? calendarOverride.is_working : hasSchedule;
      
      dates.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        isWorking,
      });
    }
    setCloneAvailableDates(dates);
  };

  const loadCloneSlots = async (date: string) => {
    if (!cloneDialog) return;
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${cloneDialog.doctor_id}&date=${date}`);
      const data = await response.json();
      setCloneAvailableSlots(data.available_slots || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить слоты", variant: "destructive" });
    }
  };

  const logAction = async (actionType: string, details: any) => {
    try {
      const response = await fetch(API_URLS.registrars, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          registrar_id: registrarInfo.id,
          user_login: registrarInfo.login || registrarInfo.full_name,
          action_type: actionType,
          details: JSON.stringify(details),
          computer_name: navigator.userAgent
        })
      });
      
      if (!response.ok) {
        console.error('Log action failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleSelectedDate || !rescheduleSelectedSlot) {
      toast({ title: "Ошибка", description: "Выберите дату и время", variant: "destructive" });
      return;
    }

    setRescheduleConfirmDialog({
      open: true,
      data: {
        oldDate: rescheduleDialog.appointment_date,
        oldTime: rescheduleDialog.appointment_time,
        newDate: rescheduleSelectedDate,
        newTime: rescheduleSelectedSlot,
        patient: rescheduleDialog.patient_name
      }
    });
  };

  const handleRescheduleAppointment = async () => {
    setRescheduleConfirmDialog({open: false, data: null});

    try {
      const oldDate = rescheduleDialog.appointment_date;
      const oldTime = rescheduleDialog.appointment_time;
      const newDate = rescheduleSelectedDate;
      const newTime = rescheduleSelectedSlot;

      const response = await fetch(API_URLS.appointments, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleDialog.id,
          appointment_date: newDate,
          appointment_time: newTime
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await logAction('Перенос записи', {
          appointment_id: rescheduleDialog.id,
          patient_name: rescheduleDialog.patient_name,
          patient_phone: rescheduleDialog.patient_phone,
          patient_snils: rescheduleDialog.patient_snils,
          doctor_name: selectedDoctor.full_name,
          old_date: oldDate,
          old_time: oldTime,
          new_date: newDate,
          new_time: newTime
        });

        setRescheduleSuccessDialog({
          open: true,
          data: {
            oldDate: oldDate,
            oldTime: oldTime,
            newDate: newDate,
            newTime: newTime,
            patient: rescheduleDialog.patient_name
          }
        });
        
        setRescheduleDialog(null);
        setRescheduleSelectedDate('');
        setRescheduleSelectedSlot('');
        loadAppointments(selectedDoctor.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось перенести запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleCloneAppointment = async () => {
    if (!cloneSelectedDate || !cloneSelectedSlot) {
      toast({ title: "Ошибка", description: "Выберите дату и время", variant: "destructive" });
      return;
    }

    if (!cloneDialog) return;

    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: cloneDialog.doctor_id,
          patient_name: cloneDialog.patient_name,
          patient_phone: cloneDialog.patient_phone,
          patient_snils: cloneDialog.patient_snils,
          appointment_date: cloneSelectedDate,
          appointment_time: cloneSelectedSlot,
          description: cloneDialog.description
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await logAction('Клонирование записи', {
          original_appointment_id: cloneDialog.id,
          new_appointment_id: data.appointment.id,
          patient_name: cloneDialog.patient_name,
          patient_phone: cloneDialog.patient_phone,
          patient_snils: cloneDialog.patient_snils,
          doctor_name: selectedDoctor.full_name,
          original_date: cloneDialog.appointment_date,
          original_time: cloneDialog.appointment_time,
          new_date: cloneSelectedDate,
          new_time: cloneSelectedSlot,
          description: cloneDialog.description
        });

        toast({ title: "Успешно", description: "Запись клонирована" });
        setCloneDialog(null);
        setCloneSelectedDate('');
        setCloneSelectedSlot('');
        loadAppointments(selectedDoctor.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось клонировать запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('registrar_auth');
    setIsAuthenticated(false);
    setRegistrarInfo(null);
  };

  const filteredAppointments = appointments.filter((app: any) => {
    const searchMatch = searchQuery === '' || 
      app.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient_phone.includes(searchQuery);
    
    if (!searchMatch) return false;
    
    if (dateFrom) {
      const appointmentDate = new Date(app.appointment_date + 'T00:00:00');
      const fromDate = new Date(dateFrom + 'T00:00:00');
      if (appointmentDate < fromDate) return false;
    }
    
    if (dateTo) {
      const appointmentDate = new Date(app.appointment_date + 'T00:00:00');
      const toDate = new Date(dateTo + 'T23:59:59');
      if (appointmentDate > toDate) return false;
    }
    
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Icon name="UserCheck" size={28} className="text-primary" />
              Вход для регистраторов
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="UserCheck" size={32} className="text-primary" />
            <div>
              <h1 className="text-xl font-bold">{registrarInfo?.full_name}</h1>
              <p className="text-sm text-muted-foreground">{registrarInfo?.clinic}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsInstructionOpen(true)}
            >
              <Icon name="BookOpen" size={18} className="mr-2" />
              Инструкция
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

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Врачи</h2>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Поиск врача по ФИО..."
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                className="w-[250px] h-9"
              />
              {doctorSearchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDoctorSearchQuery('')}
                  className="h-9"
                >
                  <Icon name="X" size={14} />
                </Button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {doctors
              .filter((doctor: any) => 
                doctorSearchQuery === '' || 
                doctor.full_name.toLowerCase().includes(doctorSearchQuery.toLowerCase())
              )
              .map((doctor: any) => (
              <Card 
                key={doctor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDoctor?.id === doctor.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  setSelectedDoctor(doctor);
                  setTimeout(() => {
                    const dateSection = document.getElementById('available-dates-section');
                    if (dateSection) {
                      dateSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {doctor.photo_url ? (
                      <img 
                        src={doctor.photo_url} 
                        alt={doctor.full_name} 
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoModalUrl(doctor.photo_url);
                          setPhotoModalOpen(true);
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={40} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm">{doctor.full_name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.position}</p>
                      {doctor.specialization && (
                        <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                      )}
                      <div className="pt-1 space-y-0.5">
                        {doctor.office_number && (
                          <p className="text-xs flex items-center gap-1">
                            <Icon name="DoorOpen" size={12} className="text-primary" />
                            <span className="font-medium">Кабинет {doctor.office_number}</span>
                          </p>
                        )}
                        {doctor.work_experience && (
                          <p className="text-xs flex items-center gap-1">
                            <Icon name="Briefcase" size={12} className="text-primary" />
                            <span>Стаж {doctor.work_experience} лет</span>
                          </p>
                        )}
                        {doctor.education && (
                          <p className="text-xs flex items-center gap-1">
                            <Icon name="GraduationCap" size={12} className="text-primary" />
                            <span className="truncate" title={doctor.education}>{doctor.education}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDoctor && (
            <>
              <div id="available-dates-section">
                <h3 className="text-2xl font-bold mb-4">
                  Доступные даты для записи к врачу {selectedDoctor.full_name}
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-8">
                {availableDates.map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    onClick={() => dateInfo.isWorking && setSelectedDate(dateInfo.date)}
                    disabled={!dateInfo.isWorking}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      selectedDate === dateInfo.date
                        ? 'bg-primary text-primary-foreground border-primary'
                        : dateInfo.isWorking
                        ? 'bg-white hover:bg-gray-50 border-gray-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{dateInfo.label}</div>
                    {dateInfo.isWorking && (
                      <div className="text-xs mt-1 font-semibold text-green-600">
                        {dateInfo.slotsCount > 0 ? `${dateInfo.slotsCount} слот` : 'Нет слотов'}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedDate && (
                <>
                  <h3 className="text-2xl font-bold mb-4">
                    Свободные слоты на {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}
                  </h3>
                  {availableSlots.length === 0 ? (
                    <Card className="mb-8">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Нет свободных слотов на эту дату
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 mb-8">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant="outline"
                          onClick={() => setNewAppointmentDialog({ ...newAppointmentDialog, open: true, time })}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-2xl font-bold">Записи пациентов</h3>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="Поиск по ФИО или телефону"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[180px] h-9 text-sm"
                  />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[130px] h-9 text-sm"
                    placeholder="От"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[130px] h-9 text-sm"
                    placeholder="До"
                  />
                  {(dateFrom || dateTo || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setSearchQuery('');
                      }}
                      className="h-9"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="py-2">Дата</TableHead>
                        <TableHead className="py-2">Время</TableHead>
                        <TableHead className="py-2">Пациент</TableHead>
                        <TableHead className="py-2">Телефон</TableHead>
                        <TableHead className="py-2">СНИЛС</TableHead>
                        <TableHead className="py-2">Описание</TableHead>
                        <TableHead className="py-2">Статус</TableHead>
                        <TableHead className="text-right py-2">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments
                        .sort((a: any, b: any) => {
                          const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
                          if (dateCompare !== 0) return dateCompare;
                          return a.appointment_time.localeCompare(b.appointment_time);
                        })
                        .map((appointment: any) => (
                          <TableRow key={appointment.id} className="text-xs">
                            <TableCell className="py-2">
                              {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')}
                            </TableCell>
                            <TableCell className="py-2">{appointment.appointment_time.slice(0, 5)}</TableCell>
                            <TableCell className="py-2">{appointment.patient_name}</TableCell>
                            <TableCell className="py-2">{appointment.patient_phone}</TableCell>
                            <TableCell className="py-2">{appointment.patient_snils || '—'}</TableCell>
                            <TableCell className="text-muted-foreground py-2">{appointment.description || '—'}</TableCell>
                            <TableCell className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
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
                            <TableCell className="text-right py-2">
                              <div className="flex gap-1 justify-end">
                                {appointment.status === 'scheduled' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => openRescheduleDialog(appointment)}
                                      title="Перенести запись"
                                    >
                                      <Icon name="Calendar" size={16} className="text-blue-600" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setCancelDialog(appointment)}
                                      title="Отменить запись"
                                    >
                                      <Icon name="XCircle" size={16} className="text-red-600" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => openCloneDialog(appointment)}
                                  title="Клонировать запись"
                                >
                                  <Icon name="Copy" size={16} className="text-gray-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      <Dialog open={newAppointmentDialog.open} onOpenChange={(open) => setNewAppointmentDialog({ ...newAppointmentDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Записать пациента</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 p-3 rounded-lg mb-4 flex items-start gap-3">
            {selectedDoctor?.photo_url ? (
              <img 
                src={selectedDoctor.photo_url} 
                alt={selectedDoctor.full_name} 
                className="w-24 h-24 rounded-lg object-cover cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0"
                onClick={() => {
                  setPhotoModalUrl(selectedDoctor.photo_url);
                  setPhotoModalOpen(true);
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={40} className="text-primary" />
              </div>
            )}
            <div className="space-y-1 text-sm flex-1">
              <p><strong>Врач:</strong> {selectedDoctor?.full_name}</p>
              <p><strong>Должность:</strong> {selectedDoctor?.position}</p>
              {selectedDoctor?.specialization && <p><strong>Специализация:</strong> {selectedDoctor?.specialization}</p>}
              {selectedDoctor?.office_number && <p><strong>Кабинет:</strong> {selectedDoctor?.office_number}</p>}
              {selectedDoctor?.education && <p><strong>Образование:</strong> {selectedDoctor?.education}</p>}
              {selectedDoctor?.work_experience && <p><strong>Стаж:</strong> {selectedDoctor?.work_experience} лет</p>}
              <p><strong>Дата и время:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')} в {newAppointmentDialog.time}</p>
            </div>
          </div>
          <form onSubmit={handleCreateAppointment} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">ФИО пациента *</label>
                <Input
                  value={newAppointmentDialog.patientName}
                  onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientName: e.target.value })}
                  required
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Телефон *</label>
                <Input
                  value={newAppointmentDialog.patientPhone}
                  onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientPhone: e.target.value })}
                  required
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">СНИЛС</label>
                <Input
                  value={newAppointmentDialog.patientSnils}
                  onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientSnils: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Описание</label>
                <Input
                  value={newAppointmentDialog.description}
                  onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, description: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setNewAppointmentDialog({ ...newAppointmentDialog, open: false })}>
                Отмена
              </Button>
              <Button type="submit" className="flex-1 h-9">Записать</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleDialog} onOpenChange={() => {
        setRescheduleDialog(null);
        setRescheduleSelectedDate('');
        setRescheduleSelectedSlot('');
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Перенести запись</DialogTitle>
            <DialogDescription>
              {rescheduleDialog?.patient_name} • {new Date(rescheduleDialog?.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')} • {rescheduleDialog?.appointment_time.slice(0, 5)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Выберите новую дату</label>
              <div className="grid grid-cols-7 gap-2">
                {rescheduleAvailableDates.map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    type="button"
                    onClick={() => dateInfo.isWorking && setRescheduleSelectedDate(dateInfo.date)}
                    disabled={!dateInfo.isWorking}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      rescheduleSelectedDate === dateInfo.date
                        ? 'bg-primary text-primary-foreground border-primary'
                        : dateInfo.isWorking
                        ? 'bg-white hover:bg-gray-50 border-gray-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{dateInfo.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {rescheduleSelectedDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Выберите время на {new Date(rescheduleSelectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}
                </label>
                {rescheduleAvailableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет свободных слотов на эту дату</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {rescheduleAvailableSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={rescheduleSelectedSlot === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRescheduleSelectedSlot(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setRescheduleDialog(null);
                  setRescheduleSelectedDate('');
                  setRescheduleSelectedSlot('');
                }}
              >
                Отмена
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleRescheduleConfirm}
                disabled={!rescheduleSelectedDate || !rescheduleSelectedSlot}
              >
                Перенести
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить запись?</DialogTitle>
            <DialogDescription>
              {cancelDialog?.patient_name} • {new Date(cancelDialog?.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')} • {cancelDialog?.appointment_time.slice(0, 5)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelDialog(null)}>
              Назад
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => handleCancelAppointment(cancelDialog.id)}>
              Отменить запись
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cloneDialog} onOpenChange={() => {
        setCloneDialog(null);
        setCloneSelectedDate('');
        setCloneSelectedSlot('');
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Клонировать запись</DialogTitle>
            <DialogDescription>
              Создайте копию записи с новой датой и временем
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm"><strong>Пациент:</strong> {cloneDialog?.patient_name}</p>
              <p className="text-sm"><strong>Телефон:</strong> {cloneDialog?.patient_phone}</p>
              <p className="text-sm"><strong>СНИЛС:</strong> {cloneDialog?.patient_snils || '—'}</p>
              <p className="text-sm"><strong>Оригинальная дата:</strong> {new Date(cloneDialog?.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')} в {cloneDialog?.appointment_time.slice(0, 5)}</p>
              <p className="text-sm"><strong>Описание:</strong> {cloneDialog?.description || '—'}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Выберите новую дату</label>
              <div className="grid grid-cols-7 gap-2">
                {cloneAvailableDates.map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    type="button"
                    onClick={() => dateInfo.isWorking && setCloneSelectedDate(dateInfo.date)}
                    disabled={!dateInfo.isWorking}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      cloneSelectedDate === dateInfo.date
                        ? 'bg-primary text-primary-foreground border-primary'
                        : dateInfo.isWorking
                        ? 'bg-white hover:bg-gray-50 border-gray-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{dateInfo.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {cloneSelectedDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Выберите время на {new Date(cloneSelectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}
                </label>
                {cloneAvailableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет свободных слотов на эту дату</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {cloneAvailableSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={cloneSelectedSlot === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCloneSelectedSlot(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setCloneDialog(null);
                  setCloneSelectedDate('');
                  setCloneSelectedSlot('');
                }}
              >
                Отмена
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleCloneAppointment}
                disabled={!cloneSelectedDate || !cloneSelectedSlot}
              >
                Клонировать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleConfirmDialog.open} onOpenChange={() => setRescheduleConfirmDialog({open: false, data: null})}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="CalendarCheck" size={24} className="text-primary" />
              Подтверждение переноса
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                <Icon name="UserCheck" size={64} className="text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg">Пациент: {rescheduleConfirmDialog.data?.patient}</p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Старая дата и время:</p>
                <p className="font-medium text-red-700">
                  {new Date(rescheduleConfirmDialog.data?.oldDate + 'T00:00:00').toLocaleDateString('ru-RU')} в {rescheduleConfirmDialog.data?.oldTime?.slice(0, 5)}
                </p>
              </div>
              <Icon name="ArrowDown" size={24} className="mx-auto text-muted-foreground" />
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Новая дата и время:</p>
                <p className="font-medium text-green-700">
                  {new Date(rescheduleConfirmDialog.data?.newDate + 'T00:00:00').toLocaleDateString('ru-RU')} в {rescheduleConfirmDialog.data?.newTime?.slice(0, 5)}
                </p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">Выполнить перенос записи?</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setRescheduleConfirmDialog({open: false, data: null})}
              >
                Отмена
              </Button>
              <Button 
                className="flex-1"
                onClick={handleRescheduleAppointment}
              >
                Да, перенести
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInstructionOpen} onOpenChange={setIsInstructionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Icon name="BookOpen" size={28} className="text-green-600" />
              Инструкция для регистратора
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="Target" size={20} className="text-green-600" />
                  Основные задачи регистратора
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Запись пациентов на прием к врачам</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Перенос и отмена записей</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Клонирование записей для повторных визитов</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Поиск и просмотр записей пациентов</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold">Запись пациента на прием</h3>
              </div>
              <div className="pl-10 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Search" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Найдите нужного врача</p>
                    <p className="text-sm text-muted-foreground">Используйте поиск по ФИО в правом верхнем углу раздела "Врачи" или прокрутите список</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="MousePointer" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Выберите врача</p>
                    <p className="text-sm text-muted-foreground">Нажмите на карточку врача. Система автоматически прокрутит к доступным датам</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Calendar" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Выберите дату</p>
                    <p className="text-sm text-muted-foreground">Нажмите на дату в календаре. Зеленым отмечены дни с доступными слотами, серым - нерабочие дни</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Clock" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Выберите время</p>
                    <p className="text-sm text-muted-foreground">Нажмите на свободный слот времени</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="UserPlus" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Заполните данные пациента</p>
                    <p className="text-sm text-muted-foreground">Откроется форма. Введите ФИО (обязательно), телефон (обязательно), СНИЛС и описание проблемы (необязательно)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Подтвердите запись</p>
                    <p className="text-sm text-muted-foreground">Нажмите кнопку "Записать". Запись появится в таблице ниже</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <h3 className="text-lg font-semibold">Работа с записями пациентов</h3>
              </div>
              <div className="pl-10 space-y-3">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon name="Calendar" size={18} className="text-blue-600" />
                      Перенос записи
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Найдите запись в таблице "Записи пациентов"</li>
                      <li>Нажмите синюю иконку календаря <Icon name="Calendar" size={14} className="inline text-blue-600" /></li>
                      <li>Выберите новую дату в календаре</li>
                      <li>Выберите новое время</li>
                      <li>Подтвердите перенос - появится красивое уведомление с деталями</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon name="XCircle" size={18} className="text-red-600" />
                      Отмена записи
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Найдите запись в таблице</li>
                      <li>Нажмите красную иконку крестика <Icon name="XCircle" size={14} className="inline text-red-600" /></li>
                      <li>Подтвердите отмену</li>
                      <li>Статус записи изменится на "Отменено"</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gray-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon name="Copy" size={18} className="text-gray-600" />
                      Клонирование записи
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-2">Используйте для повторных визитов пациента:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Нажмите серую иконку копирования <Icon name="Copy" size={14} className="inline text-gray-600" /></li>
                      <li>Все данные пациента скопируются автоматически</li>
                      <li>Выберите новую дату и время</li>
                      <li>Подтвердите создание копии</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <h3 className="text-lg font-semibold">Поиск и фильтрация записей</h3>
              </div>
              <div className="pl-10 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="Search" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Поиск по пациенту</p>
                    <p className="text-sm text-muted-foreground">Введите ФИО или номер телефона в поле "Поиск по ФИО или телефону" над таблицей</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="CalendarRange" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Фильтр по датам</p>
                    <p className="text-sm text-muted-foreground">Используйте поля "От" и "До" для выбора диапазона дат</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="X" size={18} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Сброс фильтров</p>
                    <p className="text-sm text-muted-foreground">Нажмите кнопку с крестиком для очистки всех фильтров</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="AlertCircle" size={20} className="text-yellow-600" />
                  Важно помнить
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Записывайте пациентов только на свободные (зеленые) слоты</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Обязательно проверяйте правильность ФИО и номера телефона</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>При переносе записи обязательно сообщите пациенту новые дату и время</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Все ваши действия записываются в журнал для контроля администрацией</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Вы видите только врачей вашей поликлиники</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon name="HelpCircle" size={20} className="text-primary" />
                  Нужна помощь?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Если возникли проблемы или вопросы по работе системы, обратитесь к администратору больницы или в техническую поддержку.</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsInstructionOpen(false)}>
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleSuccessDialog.open} onOpenChange={() => setRescheduleSuccessDialog({open: false, data: null})}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="CheckCircle2" size={24} className="text-green-600" />
              Запись успешно перенесена!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                <Icon name="ThumbsUp" size={64} className="text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <p className="text-lg font-semibold text-green-700">Отлично!</p>
              <p className="font-medium">Пациент: {rescheduleSuccessDialog.data?.patient}</p>
              <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Было:</p>
                  <p className="text-sm line-through">
                    {new Date(rescheduleSuccessDialog.data?.oldDate + 'T00:00:00').toLocaleDateString('ru-RU')} в {rescheduleSuccessDialog.data?.oldTime?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Стало:</p>
                  <p className="text-sm font-semibold text-green-700">
                    {new Date(rescheduleSuccessDialog.data?.newDate + 'T00:00:00').toLocaleDateString('ru-RU')} в {rescheduleSuccessDialog.data?.newTime?.slice(0, 5)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Запись успешно перенесена!</p>
            </div>
            <Button 
              className="w-full"
              onClick={() => setRescheduleSuccessDialog({open: false, data: null})}
            >
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img 
              src={photoModalUrl} 
              alt="Фото врача" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={() => setPhotoModalOpen(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPhotoModalOpen(false)}
            >
              <Icon name="X" size={24} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Registrar;