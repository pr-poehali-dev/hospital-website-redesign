import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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
    break_end_time: '',
    slot_duration: 15
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilterFrom, setDateFilterFrom] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dateFilterTo, setDateFilterTo] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, appointmentId: number | null, patientName: string, patientPhone: string, patientSnils: string, appointmentDate: string, appointmentDateRaw: string, appointmentTime: string, description: string, newDescription: string}>({
    open: false,
    appointmentId: null,
    patientName: '',
    patientPhone: '',
    patientSnils: '',
    appointmentDate: '',
    appointmentDateRaw: '',
    appointmentTime: '',
    description: '',
    newDescription: ''
  });
  const [wrongDateDialog, setWrongDateDialog] = useState<{open: boolean, appointmentDate: string, currentDate: string}>({
    open: false,
    appointmentDate: '',
    currentDate: ''
  });
  const [cancelDialog, setCancelDialog] = useState<{open: boolean, appointmentId: number | null, patientName: string, patientPhone: string, patientSnils: string, appointmentDate: string, appointmentDateRaw: string, appointmentTime: string, description: string}>({
    open: false,
    appointmentId: null,
    patientName: '',
    patientPhone: '',
    patientSnils: '',
    appointmentDate: '',
    appointmentDateRaw: '',
    appointmentTime: '',
    description: ''
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<{[key: string]: {is_working: boolean, note?: string}}>({});
  const [slotStats, setSlotStats] = useState<{[key: string]: {available: number, booked: number}}>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [bulkSlotDialogOpen, setBulkSlotDialogOpen] = useState(false);
  const [bulkSlotDuration, setBulkSlotDuration] = useState(15);
  const [scheduleInstructionOpen, setScheduleInstructionOpen] = useState(false);
  const [calendarInstructionOpen, setCalendarInstructionOpen] = useState(false);
  const [cloneDialog, setCloneDialog] = useState<{
    open: boolean;
    appointment: any | null;
    newDate: string;
    newTime: string;
    newDescription: string;
    availableSlots: string[];
  }>({
    open: false,
    appointment: null,
    newDate: '',
    newTime: '',
    newDescription: '',
    availableSlots: []
  });
  const [newAppointmentDialog, setNewAppointmentDialog] = useState<{
    open: boolean;
    date: string;
    time: string;
    patientName: string;
    patientPhone: string;
    patientSnils: string;
    description: string;
    availableSlots: string[];
  }>({
    open: false,
    date: '',
    time: '',
    patientName: '',
    patientPhone: '',
    patientSnils: '',
    description: '',
    availableSlots: []
  });
  const [dateSlotCounts, setDateSlotCounts] = useState<{[key: string]: number}>({});
  const [tipsContentOpen, setTipsContentOpen] = useState(false);

  const [dayOffWarning, setDayOffWarning] = useState<{open: boolean, date: string, appointmentCount: number}>({open: false, date: '', appointmentCount: 0});
  
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    appointment: any | null;
    newDate: string;
    newTime: string;
    availableSlots: string[];
    availableDates: any[];
  }>({
    open: false,
    appointment: null,
    newDate: '',
    newTime: '',
    availableSlots: [],
    availableDates: []
  });

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
  }, [checkInterval, autoRefreshEnabled, dateFilterFrom, dateFilterTo]);

  useEffect(() => {
    if (doctorInfo && selectedYear) {
      loadCalendar(doctorInfo.id, selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (cloneDialog.newDate && doctorInfo) {
      loadAvailableSlotsForClone(cloneDialog.newDate);
    }
  }, [cloneDialog.newDate]);

  useEffect(() => {
    if (newAppointmentDialog.date && doctorInfo) {
      loadAvailableSlotsForNewAppointment(newAppointmentDialog.date);
    }
  }, [newAppointmentDialog.date]);

  useEffect(() => {
    if (newAppointmentDialog.open && doctorInfo) {
      preloadSlotCounts();
    }
  }, [newAppointmentDialog.open]);

  useEffect(() => {
    if (rescheduleDialog.newDate && doctorInfo) {
      loadAvailableSlotsForReschedule(rescheduleDialog.newDate);
    }
  }, [rescheduleDialog.newDate]);

  useEffect(() => {
    if (rescheduleDialog.open && doctorInfo) {
      generateRescheduleDates();
    }
  }, [rescheduleDialog.open]);

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
    
    if (!newStatus) {
      try {
        const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorInfo.id}&start_date=${date}&end_date=${date}`);
        const data = await response.json();
        const appointmentsOnDay = (data.appointments || []).filter((app: any) => app.status === 'scheduled' || app.status === 'completed' || app.status === 'cancelled');
        
        if (appointmentsOnDay.length > 0) {
          setDayOffWarning({open: true, date, appointmentCount: appointmentsOnDay.length});
          return;
        }
      } catch (error) {
        console.error('Failed to check appointments:', error);
      }
    }
    
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
        await loadCalendar(doctorInfo.id, selectedYear);
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить календарь", variant: "destructive" });
    }
  };

  const confirmDayOff = async () => {
    if (!doctorInfo) return;
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calendar',
          doctor_id: doctorInfo.id,
          calendar_date: dayOffWarning.date,
          is_working: false
        })
      });
      
      if (response.ok) {
        toast({ 
          title: "День отмечен как выходной", 
          description: "Не забудьте уведомить пациентов о переносе",
          duration: 5000
        });
        await loadCalendar(doctorInfo.id, selectedYear);
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить календарь", variant: "destructive" });
    }
    
    setDayOffWarning({open: false, date: '', appointmentCount: 0});
  };

  const loadAppointments = async (doctorId: number, checkForNew = false) => {
    try {
      const startDate = dateFilterFrom || new Date().toISOString().split('T')[0];
      const endDate = dateFilterTo || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorId}&start_date=${startDate}&end_date=${endDate}`);
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
        setScheduleForm({ day_of_week: 0, start_time: '08:00', end_time: '17:00', break_start_time: '', break_end_time: '', slot_duration: 15 });
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
          end_time: editingSchedule.end_time,
          break_start_time: editingSchedule.break_start_time || null,
          break_end_time: editingSchedule.break_end_time || null,
          slot_duration: editingSchedule.slot_duration || 15
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

  const handleUpdateAppointmentStatus = async (appointmentId: number, newStatus: string, description?: string, appointmentData?: any) => {
    try {
      const body: any = {
        id: appointmentId,
        status: newStatus,
        description: description
      };
      
      if (newStatus === 'completed') {
        const now = new Date();
        const moscowTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        body.completed_at = moscowTime.toISOString();
      }
      
      const response = await fetch(API_URLS.appointments, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const statusText = newStatus === 'completed' ? 'Прием завершен' : 'Запись отменена';
        toast({ title: "Успешно", description: statusText });
        
        if (appointmentData) {
          const actionType = newStatus === 'completed' ? 'Завершение приема' : 'Отмена записи';
          await logAction(actionType, {
            appointment_id: appointmentId,
            patient_name: appointmentData.patient_name,
            patient_phone: appointmentData.patient_phone,
            patient_snils: appointmentData.patient_snils,
            appointment_date: appointmentData.appointment_date,
            appointment_time: appointmentData.appointment_time,
            description: description || appointmentData.description
          });
        }
        
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
            break_end_time: copyFromSchedule.break_end_time || null,
            slot_duration: copyFromSchedule.slot_duration || 15
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

  const loadSlotStatsForYear = async () => {
    if (!doctorInfo) return;
    
    setIsLoadingSlots(true);
    setLoadingProgress(0);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 2, 0);
    
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const totalDays = dates.length;
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      
      try {
        const response = await fetch(
          `${API_URLS.appointments}?action=available-slots&doctor_id=${doctorInfo.id}&date=${dateStr}`
        );
        const data = await response.json();
        
        const availableSlots = data.available_slots?.length || 0;
        const allSlots = data.all_slots?.length || 0;
        const bookedSlots = allSlots - availableSlots;
        
        setSlotStats(prev => ({
          ...prev,
          [dateStr]: {
            available: availableSlots,
            booked: bookedSlots
          }
        }));
      } catch (error) {
        setSlotStats(prev => ({
          ...prev,
          [dateStr]: { available: 0, booked: 0 }
        }));
      }
      
      const progress = Math.round(((i + 1) / totalDays) * 100);
      setLoadingProgress(progress);
    }
    
    setIsLoadingSlots(false);
    setLoadingProgress(0);
    
    toast({
      title: "Готово",
      description: `Загружена статистика слотов на ${totalDays} дней`,
    });
  };

  const toggleDaySelection = (dayOfWeek: number) => {
    setSelectedDaysToCopy(prev => 
      prev.includes(dayOfWeek) 
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  const handleBulkSlotUpdate = async () => {
    if (!doctorInfo || schedules.length === 0) {
      toast({ title: "Ошибка", description: "Сначала создайте расписание", variant: "destructive" });
      return;
    }

    try {
      let successCount = 0;
      for (const schedule of schedules) {
        const response = await fetch(API_URLS.schedules, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: doctorInfo.id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            break_start_time: schedule.break_start_time || null,
            break_end_time: schedule.break_end_time || null,
            slot_duration: bulkSlotDuration
          }),
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      toast({ 
        title: "Успешно", 
        description: `Длительность слота ${bulkSlotDuration} минут применена ко всем дням` 
      });
      setBulkSlotDialogOpen(false);
      loadSchedules(doctorInfo.id);
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadAvailableSlotsForClone = async (date: string) => {
    if (!doctorInfo) return;
    
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${doctorInfo.id}&date=${date}`);
      const data = await response.json();
      setCloneDialog(prev => ({ ...prev, availableSlots: data.available_slots || [] }));
    } catch (error) {
      console.error('Ошибка загрузки слотов:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить доступные слоты", variant: "destructive" });
    }
  };

  const handleOpenCloneDialog = (appointment: any) => {
    setCloneDialog({
      open: true,
      appointment,
      newDate: '',
      newTime: '',
      newDescription: appointment.description || '',
      availableSlots: []
    });
  };

  const handleCloneAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cloneDialog.appointment || !cloneDialog.newDate || !cloneDialog.newTime) {
      toast({ title: "Ошибка", description: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorInfo.id,
          patient_name: cloneDialog.appointment.patient_name,
          patient_phone: cloneDialog.appointment.patient_phone,
          patient_snils: cloneDialog.appointment.patient_snils,
          appointment_date: cloneDialog.newDate,
          appointment_time: cloneDialog.newTime,
          description: cloneDialog.newDescription
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ 
          title: "Успешно", 
          description: `Запись клонирована на ${new Date(cloneDialog.newDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в ${cloneDialog.newTime}` 
        });
        
        await logAction('Клонирование записи', {
          original_appointment_id: cloneDialog.appointment.id,
          new_appointment_id: data.appointment?.id,
          patient_name: cloneDialog.appointment.patient_name,
          patient_phone: cloneDialog.appointment.patient_phone,
          patient_snils: cloneDialog.appointment.patient_snils,
          original_date: cloneDialog.appointment.appointment_date,
          original_time: cloneDialog.appointment.appointment_time,
          new_date: cloneDialog.newDate,
          new_time: cloneDialog.newTime,
          description: cloneDialog.newDescription
        });
        
        setCloneDialog({
          open: false,
          appointment: null,
          newDate: '',
          newTime: '',
          newDescription: '',
          availableSlots: []
        });
        loadAppointments(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось клонировать запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadAvailableSlotsForNewAppointment = async (date: string) => {
    if (!doctorInfo) return;
    
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${doctorInfo.id}&date=${date}`);
      const data = await response.json();
      setNewAppointmentDialog(prev => ({ ...prev, availableSlots: data.available_slots || [] }));
    } catch (error) {
      console.error('Ошибка загрузки слотов:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить доступные слоты", variant: "destructive" });
    }
  };

  const preloadSlotCounts = async () => {
    if (!doctorInfo) return;
    
    const counts: {[key: string]: number} = {};
    const days = getNext14DaysForDoctor();
    
    for (const day of days) {
      if (day.isWorking) {
        try {
          const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${doctorInfo.id}&date=${day.date}`);
          const data = await response.json();
          counts[day.date] = data.available_slots?.length || 0;
        } catch (error) {
          counts[day.date] = 0;
        }
      } else {
        counts[day.date] = 0;
      }
    }
    
    setDateSlotCounts(counts);
  };

  const getNext14DaysForDoctor = () => {
    const days = [];
    for (let i = 0; i <= 13; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      const hasSchedule = schedules.some((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      const calendarOverride = calendarData[dateStr];
      const isWorking = calendarOverride !== undefined ? calendarOverride.is_working : hasSchedule;
      
      days.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }),
        isWorking
      });
    }
    return days;
  };

  const logAction = async (actionType: string, details: any) => {
    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          doctor_id: doctorInfo.id,
          user_login: doctorInfo.login || doctorInfo.full_name,
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

  const openRescheduleDialog = (appointment: any) => {
    setRescheduleDialog({
      open: true,
      appointment,
      newDate: '',
      newTime: '',
      availableSlots: [],
      availableDates: []
    });
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
    setRescheduleDialog(prev => ({ ...prev, availableDates: dates }));
  };

  const loadAvailableSlotsForReschedule = async (date: string) => {
    if (!doctorInfo) return;
    
    try {
      const response = await fetch(`${API_URLS.appointments}?action=available-slots&doctor_id=${doctorInfo.id}&date=${date}`);
      const data = await response.json();
      setRescheduleDialog(prev => ({ ...prev, availableSlots: data.available_slots || [] }));
    } catch (error) {
      console.error('Ошибка загрузки слотов:', error);
      toast({ title: "Ошибка", description: "Не удалось загрузить доступные слоты", variant: "destructive" });
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleDialog.appointment || !rescheduleDialog.newDate || !rescheduleDialog.newTime) {
      toast({ title: "Ошибка", description: "Выберите дату и время", variant: "destructive" });
      return;
    }

    try {
      const oldDate = rescheduleDialog.appointment.appointment_date;
      const oldTime = rescheduleDialog.appointment.appointment_time;
      const newDate = rescheduleDialog.newDate;
      const newTime = rescheduleDialog.newTime;

      const response = await fetch(API_URLS.appointments, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rescheduleDialog.appointment.id,
          appointment_date: newDate,
          appointment_time: newTime
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await logAction('Перенос записи', {
          appointment_id: rescheduleDialog.appointment.id,
          patient_name: rescheduleDialog.appointment.patient_name,
          patient_phone: rescheduleDialog.appointment.patient_phone,
          patient_snils: rescheduleDialog.appointment.patient_snils,
          old_date: oldDate,
          old_time: oldTime,
          new_date: newDate,
          new_time: newTime
        });

        toast({ 
          title: "Успешно", 
          description: `Запись перенесена на ${new Date(newDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в ${newTime}` 
        });
        
        setRescheduleDialog({
          open: false,
          appointment: null,
          newDate: '',
          newTime: '',
          availableSlots: [],
          availableDates: []
        });
        loadAppointments(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось перенести запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleCreateNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAppointmentDialog.date || !newAppointmentDialog.time || !newAppointmentDialog.patientName || !newAppointmentDialog.patientPhone) {
      toast({ title: "Ошибка", description: "Заполните все обязательные поля", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(API_URLS.appointments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorInfo.id,
          patient_name: newAppointmentDialog.patientName,
          patient_phone: newAppointmentDialog.patientPhone,
          patient_snils: newAppointmentDialog.patientSnils,
          appointment_date: newAppointmentDialog.date,
          appointment_time: newAppointmentDialog.time,
          description: newAppointmentDialog.description
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ 
          title: "Успешно", 
          description: `Пациент ${newAppointmentDialog.patientName} записан на ${new Date(newAppointmentDialog.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в ${newAppointmentDialog.time}` 
        });
        
        await logAction('Создание записи', {
          appointment_id: data.appointment?.id,
          patient_name: newAppointmentDialog.patientName,
          patient_phone: newAppointmentDialog.patientPhone,
          patient_snils: newAppointmentDialog.patientSnils,
          appointment_date: newAppointmentDialog.date,
          appointment_time: newAppointmentDialog.time,
          description: newAppointmentDialog.description
        });
        
        setNewAppointmentDialog({
          open: false,
          date: '',
          time: '',
          patientName: '',
          patientPhone: '',
          patientSnils: '',
          description: '',
          availableSlots: []
        });
        loadAppointments(doctorInfo.id);
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось создать запись", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const exportToExcel = () => {
    const dataForExport = filteredAppointments
      .sort((a: any, b: any) => {
        const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.appointment_time.localeCompare(b.appointment_time);
      })
      .map((app: any) => ({
        'ID записи': app.id,
        'Дата': new Date(app.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        'День недели': new Date(app.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long' }),
        'Время записи': app.appointment_time.slice(0, 5),
        'Время завершения': app.completed_at ? new Date(app.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—',
        'ФИО пациента': app.patient_name,
        'Телефон': app.patient_phone,
        'СНИЛС': app.patient_snils || '—',
        'Описание': app.description || '—',
        'Статус': app.status === 'scheduled' ? 'Запланировано' : 
                  app.status === 'completed' ? 'Завершено' : 'Отменено',
        'Дата создания': app.created_at ? new Date(app.created_at).toLocaleString('ru-RU') : '—'
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Записи пациентов');

    const fileName = `Записи_${doctorInfo.full_name}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Экспорт завершен",
      description: `Экспортировано записей: ${dataForExport.length}`,
    });
  };

  const printAppointments = () => {
    const filtered = appointments.filter((app: any) => {
      const statusMatch = statusFilter === 'all' || app.status === statusFilter;
      const dateMatch = app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo;
      const searchMatch = searchQuery === '' || 
        app.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.patient_phone.includes(searchQuery) ||
        (app.patient_snils && app.patient_snils.includes(searchQuery));
      return statusMatch && dateMatch && searchMatch;
    });
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Записи пациентов - ${doctorInfo.full_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
          }
          h1 {
            text-align: center;
            font-size: 18px;
            margin-bottom: 10px;
          }
          .info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 11px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .status-scheduled {
            color: #ca8a04;
            font-weight: bold;
          }
          .status-completed {
            color: #16a34a;
            font-weight: bold;
          }
          .status-cancelled {
            color: #dc2626;
            font-weight: bold;
          }
          @media print {
            body { margin: 10px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Записи пациентов</h1>
        <div class="info">
          <div>Врач: ${doctorInfo.full_name}</div>
          <div>Специальность: ${doctorInfo.specialization || 'Не указана'}</div>
          <div>Дата печати: ${new Date().toLocaleString('ru-RU')}</div>
          <div>Всего записей: ${filtered.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Пациент</th>
              <th>Телефон</th>
              <th>СНИЛС</th>
              <th>Статус</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((app, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${new Date(app.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                <td>${app.appointment_time.slice(0, 5)}</td>
                <td>${app.patient_name}</td>
                <td>${app.patient_phone}</td>
                <td>${app.patient_snils || '—'}</td>
                <td class="status-${app.status}">
                  ${app.status === 'scheduled' ? 'Запланировано' : 
                    app.status === 'completed' ? 'Завершено' : 'Отменено'}
                </td>
                <td>${app.description || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    
    toast({
      title: "Печать",
      description: `Подготовлено к печати: ${filtered.length} записей`,
    });
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

  const filteredAppointments = appointments.filter((app: any) => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    const dateMatch = app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo;
    const searchMatch = searchQuery === '' || 
      app.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient_phone.includes(searchQuery) ||
      (app.patient_snils && app.patient_snils.includes(searchQuery));
    return statusMatch && dateMatch && searchMatch;
  });

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
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border">
              <span className="text-xs font-medium text-gray-700">Автообновление</span>
              <Button
                size="sm"
                variant={autoRefreshEnabled ? "default" : "outline"}
                onClick={toggleAutoRefresh}
                className="h-7 px-2"
              >
                <Icon name={autoRefreshEnabled ? "Pause" : "Play"} size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSound}
                disabled={!autoRefreshEnabled}
                className="h-7 px-2"
                title={soundEnabled ? "Звук вкл" : "Звук выкл"}
              >
                <Icon name={soundEnabled ? "Volume2" : "VolumeX"} size={14} />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!autoRefreshEnabled}
                    className="h-7 px-2 text-xs"
                  >
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
                className="h-7 px-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                title="Обновить записи вручную"
              >
                <Icon name="RefreshCw" size={14} />
              </Button>
            </div>
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
          <div className="container mx-auto px-4">

            <TabsContent value="calendar" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Calendar" size={24} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setCalendarInstructionOpen(!calendarInstructionOpen)}>
                        <h3 className="text-base font-bold text-green-900">📅 Инструкция: Годовой календарь работы</h3>
                        <Icon 
                          name={calendarInstructionOpen ? "ChevronUp" : "ChevronDown"} 
                          size={20} 
                          className="text-green-600 flex-shrink-0"
                        />
                      </div>
                      
                      {calendarInstructionOpen && (
                        <div className="space-y-3 text-sm text-green-800 mt-3">
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-green-900">🎯 Для чего нужен календарь?</p>
                            <p className="text-green-700">
                              Годовой календарь позволяет управлять рабочими и выходными днями на весь год вперёд. 
                              Отмечайте отпуска, праздники и особые дни — пациенты автоматически не увидят эти даты при записи.
                            </p>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-2 text-green-900">📋 Как работать с календарём:</p>
                            <ul className="list-decimal list-inside space-y-1.5 text-green-700 ml-2">
                              <li><strong>Один клик по дате</strong> — переключает день между рабочим и выходным</li>
                              <li><strong>Зелёная ячейка</strong> — рабочий день, пациенты могут записываться</li>
                              <li><strong>Красная ячейка</strong> — выходной день, записи заблокированы</li>
                              <li><strong>Кнопка "Получить слоты"</strong> — загружает статистику свободных/занятых слотов на 2 месяца</li>
                              <li><strong>Цифры в ячейке</strong> (например, 5/3) — свободных слотов / занятых слотов на этот день</li>
                            </ul>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-green-900">⚡ Важно знать!</p>
                            <p className="text-green-700">
                              <strong>Календарь главнее расписания!</strong> Если вы отметили день как выходной в календаре, 
                              пациенты не смогут записаться, даже если в еженедельном расписании этот день рабочий. 
                              Так вы можете легко блокировать отдельные даты без изменения всего расписания.
                            </p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-amber-900">💡 Примеры использования:</p>
                            <div className="text-amber-800 text-xs space-y-1.5">
                              <p><strong>Отпуск:</strong> Кликните по всем датам с 1 по 14 июля — они станут красными, пациенты не увидят эти дни</p>
                              <p><strong>Праздники:</strong> 1 января, 8 марта → отметьте как выходные одним кликом</p>
                              <p><strong>Внеплановый день:</strong> Во вторник 15 мая нужно уехать? Кликните на 15 мая → день закрыт для записи</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 text-xs mt-4 pt-3 border-t border-green-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-green-200 border-2 border-green-400 rounded shadow-sm"></div>
                          <span className="text-green-900 font-medium">Рабочий день</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-red-200 border-2 border-red-400 rounded shadow-sm"></div>
                          <span className="text-red-900 font-medium">Выходной день</span>
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
                <div className="mt-6">
                  <Button
                    onClick={loadSlotStatsForYear}
                    disabled={isLoadingSlots}
                    size="lg"
                  >
                    {isLoadingSlots ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Icon name="BarChart3" size={20} className="mr-2" />
                        Получить слоты
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isLoadingSlots ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <div className="w-full max-w-md">
                        <p className="text-lg font-semibold text-blue-900">Идет получение данных</p>
                        <p className="text-sm text-blue-700 mt-1">Загружаем статистику слотов на текущий и следующий месяц...</p>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-blue-800 mb-2">
                            <span>Прогресс загрузки</span>
                            <span className="font-bold">{loadingProgress}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${loadingProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }, (_, i) => i).map(monthIndex => {
                    const monthName = new Date(selectedYear, monthIndex).toLocaleString('ru-RU', { month: 'long' });
                    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
                  const firstDayOfWeek = (new Date(selectedYear, monthIndex, 1).getDay() + 6) % 7;
                  
                  return (
                    <Card key={monthIndex} className="overflow-hidden">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-sm capitalize font-semibold">{monthName} {selectedYear}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3">
                        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1">
                          <div className="font-semibold">Пн</div>
                          <div className="font-semibold">Вт</div>
                          <div className="font-semibold">Ср</div>
                          <div className="font-semibold">Чт</div>
                          <div className="font-semibold">Пт</div>
                          <div className="font-semibold text-red-600">Сб</div>
                          <div className="font-semibold text-red-600">Вс</div>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
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
                            const stats = slotStats[date];
                            
                            return (
                              <button
                                key={day}
                                onClick={() => toggleCalendarDay(date)}
                                className={`h-auto min-h-[32px] text-[10px] rounded transition-all flex flex-col items-center justify-center p-0.5 ${
                                  isToday ? 'ring-1 ring-primary' : ''
                                } ${
                                  isWorking 
                                    ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300' 
                                    : 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                                } ${
                                  isWeekend && isWorking ? 'opacity-70' : ''
                                }`}
                                title={isWorking ? 'Рабочий день (нажмите для выходного)' : 'Выходной (нажмите для рабочего)'}
                              >
                                <span className="font-medium">{day}</span>
                                {stats && (stats.available > 0 || stats.booked > 0) && (
                                  <span className="text-[8px] font-semibold mt-0.5">
                                    {stats.available}/{stats.booked}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Clock" size={24} className="text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setScheduleInstructionOpen(!scheduleInstructionOpen)}>
                        <h3 className="text-base font-bold text-purple-900">⏰ Инструкция: Еженедельное расписание</h3>
                        <Icon 
                          name={scheduleInstructionOpen ? "ChevronUp" : "ChevronDown"} 
                          size={20} 
                          className="text-purple-600 flex-shrink-0"
                        />
                      </div>
                      
                      {scheduleInstructionOpen && (
                        <div className="space-y-3 text-sm text-purple-800 mt-3">
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-1">🎯 Для чего нужно расписание?</p>
                            <p className="text-purple-700">
                              Еженедельное расписание — это основа вашего рабочего графика. Здесь вы настраиваете, 
                              в какие дни недели вы принимаете, с какого по какое время, и сколько длится один приём. 
                              Пациенты увидят только настроенные здесь дни и часы.
                            </p>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-2">📋 Пошаговая настройка:</p>
                            <ul className="list-decimal list-inside space-y-1.5 text-purple-700 ml-2">
                              <li><strong>"Добавить день"</strong> — нажмите кнопку вверху справа</li>
                              <li><strong>Выберите день недели</strong> — например, Понедельник</li>
                              <li><strong>Время начала и окончания</strong> — с 09:00 до 18:00</li>
                              <li><strong>Длительность слота</strong> — сколько минут на одного пациента (15, 20, 30 минут)</li>
                              <li><strong>Перерыв</strong> (необязательно) — если есть обед, укажите с 13:00 до 14:00</li>
                              <li><strong>Сохраните</strong> — день появится в списке карточек ниже</li>
                            </ul>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-2">🔧 Полезные кнопки в карточках дней:</p>
                            <ul className="text-purple-700 space-y-1 ml-2 list-disc list-inside text-xs">
                              <li><strong>Карандаш ✏️</strong> — изменить время или длительность слотов</li>
                              <li><strong>Копировать 📋</strong> — скопировать расписание этого дня на другие дни недели</li>
                              <li><strong>Пауза ⏸</strong> — временно деактивировать день (запись станет недоступна)</li>
                              <li><strong>Корзина 🗑</strong> — удалить день из расписания полностью</li>
                            </ul>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-1">⚡ Массовое изменение слотов</p>
                            <p className="text-purple-700">
                              Кнопка <strong>"Применить слоты ко всем дням"</strong> (вверху) позволяет одним действием 
                              изменить длительность приёма для всех рабочих дней. Например, изменить с 15 минут на 20 минут 
                              для всей недели сразу, не редактируя каждый день отдельно.
                            </p>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-amber-900">💡 Пример готового расписания:</p>
                            <div className="text-amber-800 text-xs space-y-1 leading-relaxed">
                              <p><strong>Понедельник, Среда, Пятница:</strong> 09:00-18:00, обед 13:00-14:00, приём 30 мин</p>
                              <p><strong>Вторник, Четверг:</strong> 10:00-16:00, без перерыва, приём 20 мин</p>
                              <p><strong>Суббота:</strong> 09:00-14:00, без перерыва, приём 15 мин</p>
                              <p><strong>Воскресенье:</strong> не добавляем (автоматически выходной)</p>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-blue-900">ℹ️ Важные моменты:</p>
                            <ul className="text-blue-800 text-xs space-y-1 ml-2 list-disc list-inside">
                              <li>Если день НЕ добавлен — он автоматически выходной</li>
                              <li>Календарь (вкладка "Календарь") может закрывать отдельные даты даже из рабочих дней</li>
                              <li>Изменения применяются мгновенно — пациенты сразу видят новые слоты</li>
                              <li>Можно деактивировать день временно, не удаляя его настройки</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Рабочее расписание</h2>
                <div className="flex gap-2">
                  <Dialog open={bulkSlotDialogOpen} onOpenChange={setBulkSlotDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        disabled={schedules.length === 0}
                        title="Установить одинаковую длительность слота для всех рабочих дней"
                      >
                        <Icon name="Clock" size={20} className="mr-2" />
                        Применить слоты ко всем дням
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Применить длительность слота ко всем дням</DialogTitle>
                        <DialogDescription>
                          Установите одинаковую длительность слота для всех рабочих дней
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Длительность слота (минуты)</label>
                          <Input
                            type="number"
                            min="1"
                            max="120"
                            step="1"
                            value={bulkSlotDuration}
                            onChange={(e) => setBulkSlotDuration(parseInt(e.target.value) || 15)}
                            placeholder="15"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Это значение будет применено ко всем {schedules.length} дням в расписании
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setBulkSlotDialogOpen(false)}>
                            Отмена
                          </Button>
                          <Button onClick={handleBulkSlotUpdate}>
                            Применить
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg"
                        title="Добавить новый рабочий день в расписание"
                      >
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
                      <div>
                        <label className="text-sm font-medium mb-2 block">Длительность слота (минуты)</label>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          step="1"
                          value={scheduleForm.slot_duration}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, slot_duration: parseInt(e.target.value) || 15 })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Интервал времени для одного приёма (например, 15, 20, 22, 30 минут)
                        </p>
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
                      <div>
                        <label className="text-sm font-medium mb-2 block">Длительность слота (минуты)</label>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          step="1"
                          value={editingSchedule.slot_duration || 15}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, slot_duration: parseInt(e.target.value) || 15 })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Интервал времени для одного приёма
                        </p>
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

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {schedules.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Расписание не установлено. Добавьте рабочие дни.
                    </CardContent>
                  </Card>
                ) : (
                  schedules.map((schedule: any) => (
                    <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2">
                            <Icon name="Calendar" size={18} className="text-primary" />
                            <span className="font-semibold">{DAYS_OF_WEEK[schedule.day_of_week]}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {schedule.is_active ? 'Активно' : 'Неактивно'}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={14} className="text-primary" />
                            <p className="text-sm font-medium">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded">
                            <Icon name="Timer" size={14} className="text-blue-600" />
                            <p className="text-xs text-blue-900 font-medium">
                              Слот: {schedule.slot_duration || 15} мин
                            </p>
                          </div>
                          {schedule.break_start_time && schedule.break_end_time ? (
                            <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 rounded">
                              <Icon name="Coffee" size={14} className="text-orange-600" />
                              <p className="text-xs text-orange-900 font-medium">
                                Перерыв: {schedule.break_start_time.slice(0, 5)} - {schedule.break_end_time.slice(0, 5)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground ml-5">Без перерыва</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setIsEditOpen(true);
                            }}
                            className="h-8 text-xs"
                            title="Изменить время приема, слот или перерыв"
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleCopySchedule(schedule)}
                            className="h-8 text-xs"
                            title="Копировать расписание на другие дни"
                          >
                            <Icon name="Copy" size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={schedule.is_active ? "outline" : "default"}
                            onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                            className="h-8 text-xs"
                            title={schedule.is_active ? "Деактивировать день (запись будет недоступна)" : "Активировать день (разрешить запись)"}
                          >
                            <Icon name={schedule.is_active ? "PauseCircle" : "PlayCircle"} size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="h-8 text-xs"
                            title="Удалить день из расписания"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Users" size={24} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setTipsContentOpen(!tipsContentOpen)}>
                        <h3 className="text-base font-bold text-green-900">👥 Инструкция: Управление записями пациентов</h3>
                        <Icon 
                          name={tipsContentOpen ? "ChevronUp" : "ChevronDown"} 
                          size={20} 
                          className="text-green-600 flex-shrink-0"
                        />
                      </div>
                      
                      {tipsContentOpen && (
                        <div className="space-y-3 text-sm text-green-800 mt-3">
                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-green-900">🎯 Что здесь можно делать?</p>
                            <p className="text-green-700">
                              Это ваш центр управления всеми записями пациентов. Здесь вы видите все приёмы, 
                              можете записывать новых пациентов, завершать приёмы, переносить время, искать по ФИО/телефону 
                              и выгружать данные в Excel для отчётности.
                            </p>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-2 text-green-900">📋 Кнопки в верхней строке:</p>
                            <ul className="list-disc list-inside space-y-1.5 text-green-700 ml-2 text-xs">
                              <li><strong>"Записать пациента" (синяя, пульсирует)</strong> — создать новую запись вручную</li>
                              <li><strong>"Печать"</strong> — распечатать список записей за выбранный период</li>
                              <li><strong>"Экспорт"</strong> — сохранить записи в Excel файл для отчётности</li>
                              <li><strong>Фильтр "Все/Завершено/Запланировано/Отменено"</strong> — показывать только нужные записи</li>
                              <li><strong>Поиск</strong> — вводите ФИО, телефон или СНИЛС для мгновенного поиска</li>
                              <li><strong>Даты "С... По..."</strong> — выберите период (сегодня, неделя, месяц, произвольный)</li>
                            </ul>
                          </div>

                          <div className="bg-white/60 p-3 rounded-lg">
                            <p className="font-semibold mb-2 text-green-900">🔧 Работа с записью (кликните по строке):</p>
                            <p className="text-green-700 text-xs mb-2">После клика по пациенту справа появятся кнопки действий:</p>
                            <ul className="text-green-700 space-y-1.5 ml-2 list-disc list-inside text-xs">
                              <li><strong>"Завершить приём" (зелёная, пульсирует)</strong> — отметить, что пациент пришёл, добавить заключение врача</li>
                              <li><strong>"Перенести"</strong> — изменить дату или время записи (если пациент просит перенос)</li>
                              <li><strong>"Клонировать"</strong> — создать дубликат записи на другую дату (для повторных приёмов)</li>
                              <li><strong>"Отменить приём"</strong> — если пациент не пришёл или отказался от записи</li>
                            </ul>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-amber-900">💡 Советы для эффективной работы:</p>
                            <ul className="text-amber-800 text-xs space-y-1.5 ml-2 list-disc list-inside">
                              <li><strong>Сразу завершайте приём</strong> — как только пациент ушёл, кликните "Завершить приём" и добавьте заключение</li>
                              <li><strong>Используйте фильтр "Запланировано"</strong> — чтобы видеть только предстоящие приёмы на сегодня/неделю</li>
                              <li><strong>Поиск мгновенный</strong> — начните печатать фамилию пациента, система покажет все его записи</li>
                              <li><strong>Экспорт в конце месяца</strong> — выгружайте данные в Excel для статистики и отчётов</li>
                              <li><strong>Выделенная строка</strong> — яркий фон и жирный шрифт показывают выбранную запись</li>
                            </ul>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <p className="font-semibold mb-1 text-blue-900">📊 Значки статусов:</p>
                            <div className="text-xs space-y-1.5 ml-2 text-blue-800">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium text-[10px]">Запланировано</span>
                                <span>— Пациент записан, приём ожидается</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium text-[10px]">Завершено</span>
                                <span>— Приём состоялся, в столбце "Завер." указано время окончания</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full font-medium text-[10px]">Отменено</span>
                                <span>— Запись отменена (пациент не пришёл или отменил сам)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4">Записи пациентов</h3>
                
                <div className="flex gap-2 items-center flex-wrap mb-4">
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border">
                    <Icon name="Search" size={14} className="text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Поиск по ФИО или телефону..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 w-[200px] text-xs"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border">
                    <Icon name="Calendar" size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">С</span>
                    <Input
                      type="date"
                      value={dateFilterFrom}
                      onChange={(e) => setDateFilterFrom(e.target.value)}
                      className="h-7 w-[130px] text-xs"
                    />
                    <span className="text-xs font-medium text-muted-foreground">По</span>
                    <Input
                      type="date"
                      value={dateFilterTo}
                      onChange={(e) => setDateFilterTo(e.target.value)}
                      className="h-7 w-[130px] text-xs"
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                        <Icon name="CalendarRange" size={14} />
                        Период
                        <Icon name="ChevronDown" size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem 
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setDateFilterFrom(today);
                          setDateFilterTo(today);
                        }}
                        className="cursor-pointer"
                      >
                        Сегодня
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          const today = new Date();
                          const nextWeek = new Date(today);
                          nextWeek.setDate(today.getDate() + 7);
                          setDateFilterFrom(today.toISOString().split('T')[0]);
                          setDateFilterTo(nextWeek.toISOString().split('T')[0]);
                        }}
                        className="cursor-pointer"
                      >
                        Неделя
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          const today = new Date();
                          const nextMonth = new Date(today);
                          nextMonth.setMonth(today.getMonth() + 1);
                          setDateFilterFrom(today.toISOString().split('T')[0]);
                          setDateFilterTo(nextMonth.toISOString().split('T')[0]);
                        }}
                        className="cursor-pointer"
                      >
                        Месяц
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                        <Icon name="Filter" size={14} />
                        {statusFilter === 'all' ? 'Все' : 
                         statusFilter === 'scheduled' ? 'Запланировано' :
                         statusFilter === 'completed' ? 'Завершено' : 'Отменено'}
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-xs font-semibold">
                          {filteredAppointments.length}
                        </span>
                        <Icon name="ChevronDown" size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <span>Все</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted text-xs font-semibold">
                            {appointments.filter((app: any) => app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo).length}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('scheduled')} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="Clock" size={12} className="text-green-600" />
                            <span>Запланировано</span>
                          </div>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                            {appointments.filter((app: any) => app.status === 'scheduled' && app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo).length}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="CheckCircle" size={12} className="text-blue-600" />
                            <span>Завершено</span>
                          </div>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            {appointments.filter((app: any) => app.status === 'completed' && app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo).length}
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('cancelled')} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon name="XCircle" size={12} className="text-gray-600" />
                            <span>Отменено</span>
                          </div>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                            {appointments.filter((app: any) => app.status === 'cancelled' && app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo).length}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setNewAppointmentDialog({
                      open: true,
                      date: '',
                      time: '',
                      patientName: '',
                      patientPhone: '',
                      patientSnils: '',
                      description: '',
                      availableSlots: []
                    })}
                    className="gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs h-8 font-bold animate-pulse-blue"
                  >
                    <Icon name="UserPlus" size={14} />
                    Записать пациента
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={printAppointments}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Icon name="Printer" size={14} />
                    Печать
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToExcel}
                    className="gap-1.5 bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-800 text-xs h-8"
                  >
                    <Icon name="Download" size={14} />
                    Экспорт
                  </Button>
                </div>
                
                <div className="flex gap-2 items-center">
                  {selectedAppointment && (
                    <>
                      {selectedAppointment.status === 'scheduled' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold animate-pulse-green"
                            onClick={() => setConfirmDialog({
                              open: true,
                              appointmentId: selectedAppointment.id,
                              patientName: selectedAppointment.patient_name,
                              patientPhone: selectedAppointment.patient_phone,
                              patientSnils: selectedAppointment.patient_snils || '',
                              appointmentDate: new Date(selectedAppointment.appointment_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
                              appointmentDateRaw: selectedAppointment.appointment_date,
                              appointmentTime: selectedAppointment.appointment_time.slice(0, 5),
                              description: selectedAppointment.description || '',
                              newDescription: selectedAppointment.description || ''
                            })}
                          >
                            <Icon name="CheckCircle" size={14} />
                            Завершить прием
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => openRescheduleDialog(selectedAppointment)}
                          >
                            <Icon name="Calendar" size={14} className="text-purple-600" />
                            Перенести
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleOpenCloneDialog(selectedAppointment)}
                          >
                            <Icon name="Copy" size={14} className="text-blue-600" />
                            Клонировать
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                            onClick={() => setCancelDialog({
                              open: true,
                              appointmentId: selectedAppointment.id,
                              patientName: selectedAppointment.patient_name,
                              patientPhone: selectedAppointment.patient_phone,
                              patientSnils: selectedAppointment.patient_snils || '',
                              appointmentDate: new Date(selectedAppointment.appointment_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
                              appointmentDateRaw: selectedAppointment.appointment_date,
                              appointmentTime: selectedAppointment.appointment_time.slice(0, 5),
                              description: selectedAppointment.description || ''
                            })}
                          >
                            <Icon name="XCircle" size={14} />
                            Отменить прием
                          </Button>
                        </>
                      )}
                      {(selectedAppointment.status === 'completed' || selectedAppointment.status === 'cancelled') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleOpenCloneDialog(selectedAppointment)}
                        >
                          <Icon name="Copy" size={14} className="text-blue-600" />
                          Клонировать
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {filteredAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'Нет записей в выбранном периоде'
                      : `Нет записей со статусом "${
                          statusFilter === 'scheduled' ? 'Запланировано' :
                          statusFilter === 'completed' ? 'Завершено' : 'Отменено'
                        }" в выбранном периоде`
                    }
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="h-8">
                          <TableHead className="w-[100px] py-1 px-2 text-xs h-8">Дата</TableHead>
                          <TableHead className="w-[50px] py-1 px-2 text-xs h-8">Время</TableHead>
                          <TableHead className="w-[50px] py-1 px-2 text-xs h-8">Завер.</TableHead>
                          <TableHead className="w-[180px] py-1 px-2 text-xs h-8">Пациент</TableHead>
                          <TableHead className="py-1 px-2 text-xs h-8">Телефон</TableHead>
                          <TableHead className="hidden lg:table-cell py-1 px-2 text-xs h-8">СНИЛС</TableHead>
                          <TableHead className="hidden md:table-cell py-1 px-2 text-xs h-8">Описание</TableHead>
                          <TableHead className="w-[100px] py-1 px-2 text-xs h-8">Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments
                          .sort((a: any, b: any) => {
                            const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
                            if (dateCompare !== 0) return dateCompare;
                            return a.appointment_time.localeCompare(b.appointment_time);
                          })
                          .map((appointment: any, index: number, array: any[]) => {
                            const prevAppointment = index > 0 ? array[index - 1] : null;
                            const isNewDay = !prevAppointment || prevAppointment.appointment_date !== appointment.appointment_date;
                            
                            return (
                              <TableRow 
                                key={appointment.id} 
                                className={`h-8 cursor-pointer transition-colors ${isNewDay && index > 0 ? 'border-t-[3px] border-t-gray-300' : ''} ${
                                  selectedAppointment?.id === appointment.id 
                                    ? 'bg-primary/20 hover:bg-primary/25' 
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => setSelectedAppointment(appointment)}
                              >
                                <TableCell className={`text-xs py-1 px-2 h-8 ${
                                  selectedAppointment?.id === appointment.id ? 'font-bold' : 'font-medium'
                                }`}>
                                  {isNewDay && new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    weekday: 'short'
                                  })}
                                </TableCell>
                                <TableCell className={`text-xs py-1 px-2 h-8 ${
                                  selectedAppointment?.id === appointment.id ? 'font-bold' : 'font-medium'
                                }`}>
                                  {appointment.appointment_time.slice(0, 5)}
                                </TableCell>
                                <TableCell className={`text-xs py-1 px-2 h-8 ${
                                  selectedAppointment?.id === appointment.id ? 'font-bold' : 'font-medium'
                                }`}>
                                  {appointment.status === 'completed' && appointment.completed_at ? (
                                    <span className="text-blue-600">
                                      {new Date(appointment.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className={`text-xs py-1 px-2 h-8 ${
                                  selectedAppointment?.id === appointment.id ? 'font-bold' : 'font-medium'
                                }`}>{appointment.patient_name}</TableCell>
                                <TableCell className="text-xs py-1 px-2 h-8">{appointment.patient_phone}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs py-1 px-2 h-8">{appointment.patient_snils || '—'}</TableCell>
                                <TableCell className="hidden md:table-cell text-xs text-muted-foreground py-1 px-2 h-8">
                                  {appointment.description || '—'}
                                </TableCell>
                                <TableCell className="py-1 px-2 h-8">
                                  <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap inline-block ${
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
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </section>
      </Tabs>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Завершить прием?</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground text-lg">{confirmDialog.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {confirmDialog.appointmentDate} в {confirmDialog.appointmentTime}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {confirmDialog.description && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Исходное описание:</p>
                <p className="text-sm">{confirmDialog.description}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Комментарий врача (необязательно)
              </label>
              <Textarea
                value={confirmDialog.newDescription}
                onChange={(e) => setConfirmDialog({...confirmDialog, newDescription: e.target.value})}
                placeholder="Добавьте комментарий о приёме, диагнозе или рекомендациях..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Этот комментарий будет сохранён вместе с записью
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            >
              Отмена
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (confirmDialog.appointmentId) {
                  const today = new Date().toISOString().split('T')[0];
                  const appointmentDate = confirmDialog.appointmentDateRaw;
                  
                  if (appointmentDate !== today) {
                    setWrongDateDialog({
                      open: true,
                      appointmentDate: confirmDialog.appointmentDate,
                      currentDate: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
                    });
                    setConfirmDialog({
                      open: false,
                      appointmentId: null,
                      patientName: '',
                      patientPhone: '',
                      patientSnils: '',
                      appointmentDate: '',
                      appointmentDateRaw: '',
                      appointmentTime: '',
                      description: '',
                      newDescription: ''
                    });
                    return;
                  }
                  
                  handleUpdateAppointmentStatus(
                    confirmDialog.appointmentId, 
                    'completed', 
                    confirmDialog.newDescription,
                    {
                      patient_name: confirmDialog.patientName,
                      patient_phone: confirmDialog.patientPhone,
                      patient_snils: confirmDialog.patientSnils,
                      appointment_date: confirmDialog.appointmentDateRaw,
                      appointment_time: confirmDialog.appointmentTime,
                      description: confirmDialog.description
                    }
                  );
                  setConfirmDialog({
                    open: false,
                    appointmentId: null,
                    patientName: '',
                    patientPhone: '',
                    patientSnils: '',
                    appointmentDate: '',
                    appointmentDateRaw: '',
                    appointmentTime: '',
                    description: '',
                    newDescription: ''
                  });
                }
              }}
            >
              <Icon name="CheckCircle" size={18} className="mr-2" />
              Завершить прием
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
                  handleUpdateAppointmentStatus(
                    cancelDialog.appointmentId, 
                    'cancelled',
                    undefined,
                    {
                      patient_name: cancelDialog.patientName,
                      patient_phone: cancelDialog.patientPhone,
                      patient_snils: cancelDialog.patientSnils,
                      appointment_date: cancelDialog.appointmentDateRaw,
                      appointment_time: cancelDialog.appointmentTime,
                      description: cancelDialog.description
                    }
                  );
                  setCancelDialog({
                    open: false,
                    appointmentId: null,
                    patientName: '',
                    patientPhone: '',
                    patientSnils: '',
                    appointmentDate: '',
                    appointmentDateRaw: '',
                    appointmentTime: '',
                    description: ''
                  });
                }
              }}
            >
              <Icon name="XCircle" size={18} className="mr-2" />
              Да
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={wrongDateDialog.open} onOpenChange={(open) => setWrongDateDialog({...wrongDateDialog, open})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">⚠️ Ошибка!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src="https://cdn.poehali.dev/projects/317e44da-9a2a-46c7-91b6-a5c7dee19b28/files/9098e103-3bc4-4ea2-aebf-7bfcd56796a7.jpg" 
                alt="Сердитый врач"
                className="w-48 h-48 object-cover rounded-lg shadow-lg"
              />
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-lg font-semibold text-red-600">
                Нельзя завершить прием другого дня!
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Дата приема:</strong> {wrongDateDialog.appointmentDate}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Сегодня:</strong> {wrongDateDialog.currentDate}
                </p>
              </div>
              <p className="text-base text-muted-foreground">
                Вы можете завершить прием только в день его проведения
              </p>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            onClick={() => setWrongDateDialog({open: false, appointmentDate: '', currentDate: ''})}
          >
            Понятно
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={newAppointmentDialog.open} onOpenChange={(open) => setNewAppointmentDialog({...newAppointmentDialog, open})}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Записать пациента на прием</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNewAppointment} className="space-y-3">
            {newAppointmentDialog.date && newAppointmentDialog.time && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-900">
                  📅 {new Date(newAppointmentDialog.date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })} в {newAppointmentDialog.time}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Дата приема</label>
                <div className="grid grid-cols-4 gap-1">
                  {getNext14DaysForDoctor().map((day) => {
                    const slotCount = dateSlotCounts[day.date];
                    const hasSlots = slotCount !== undefined && slotCount > 0;
                    
                    return (
                      <Button
                        key={day.date}
                        type="button"
                        variant={newAppointmentDialog.date === day.date ? 'default' : 'outline'}
                        className={`h-14 flex flex-col text-xs p-1 ${!day.isWorking || !hasSlots ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={() => day.isWorking && hasSlots && setNewAppointmentDialog({...newAppointmentDialog, date: day.date, time: ''})}
                        disabled={!day.isWorking || !hasSlots}
                      >
                        <span className="text-[9px] text-muted-foreground leading-tight">{day.label.split(',')[0]}</span>
                        <span className="text-xs font-bold leading-tight">{day.label.split(',')[1]}</span>
                        {!day.isWorking ? (
                          <span className="text-[8px] text-red-500 leading-tight">Выходной</span>
                        ) : slotCount === undefined ? (
                          <span className="text-[8px] text-muted-foreground leading-tight">...</span>
                        ) : slotCount === 0 ? (
                          <span className="text-[8px] text-red-500 leading-tight">Нет мест</span>
                        ) : (
                          <span className="text-[8px] text-green-600 leading-tight font-semibold">{slotCount}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Время приема</label>
                {newAppointmentDialog.date && newAppointmentDialog.availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1 h-[232px] overflow-y-auto p-1.5 border rounded-md bg-muted/20">
                    {newAppointmentDialog.availableSlots.map((slot: string) => (
                      <Button
                        key={slot}
                        type="button"
                        size="sm"
                        variant={newAppointmentDialog.time === slot ? 'default' : 'outline'}
                        onClick={() => setNewAppointmentDialog({...newAppointmentDialog, time: slot})}
                        className="h-7 text-xs"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[232px] flex items-center justify-center border rounded-md bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                      {newAppointmentDialog.date ? 'Нет доступных слотов' : 'Выберите дату'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">ФИО пациента *</label>
                <Input
                  value={newAppointmentDialog.patientName}
                  onChange={(e) => setNewAppointmentDialog({...newAppointmentDialog, patientName: e.target.value})}
                  placeholder="Иванов Иван Иванович"
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Телефон *</label>
                <Input
                  type="tel"
                  value={newAppointmentDialog.patientPhone}
                  onChange={(e) => setNewAppointmentDialog({...newAppointmentDialog, patientPhone: e.target.value})}
                  placeholder="+79991234567"
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">СНИЛС</label>
                <Input
                  value={newAppointmentDialog.patientSnils}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    if (value.length >= 3) value = value.slice(0, 3) + '-' + value.slice(3);
                    if (value.length >= 7) value = value.slice(0, 7) + '-' + value.slice(7);
                    if (value.length >= 11) value = value.slice(0, 11) + '-' + value.slice(11);
                    setNewAppointmentDialog({...newAppointmentDialog, patientSnils: value});
                  }}
                  placeholder="123-456-789-01"
                  className="h-9 text-sm"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Описание</label>
                <Input
                  value={newAppointmentDialog.description}
                  onChange={(e) => setNewAppointmentDialog({...newAppointmentDialog, description: e.target.value})}
                  placeholder="Краткое описание"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setNewAppointmentDialog({
                  open: false,
                  date: '',
                  time: '',
                  patientName: '',
                  patientPhone: '',
                  patientSnils: '',
                  description: '',
                  availableSlots: []
                })}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!newAppointmentDialog.date || !newAppointmentDialog.time || !newAppointmentDialog.patientName || !newAppointmentDialog.patientPhone}
              >
                <Icon name="UserPlus" size={16} className="mr-2" />
                Записать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog({...rescheduleDialog, open})}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Перенести запись</DialogTitle>
            <DialogDescription>
              {rescheduleDialog.appointment?.patient_name} • {rescheduleDialog.appointment && new Date(rescheduleDialog.appointment.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')} • {rescheduleDialog.appointment?.appointment_time.slice(0, 5)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Выберите новую дату</label>
              <div className="grid grid-cols-7 gap-2">
                {rescheduleDialog.availableDates.map((dateInfo: any) => (
                  <button
                    key={dateInfo.date}
                    type="button"
                    onClick={() => dateInfo.isWorking && setRescheduleDialog(prev => ({ ...prev, newDate: dateInfo.date }))}
                    disabled={!dateInfo.isWorking}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      rescheduleDialog.newDate === dateInfo.date
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

            {rescheduleDialog.newDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Выберите время на {new Date(rescheduleDialog.newDate + 'T00:00:00').toLocaleDateString('ru-RU')}
                </label>
                {rescheduleDialog.availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет свободных слотов на эту дату</p>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {rescheduleDialog.availableSlots.map((time: string) => (
                      <Button
                        key={time}
                        type="button"
                        variant={rescheduleDialog.newTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRescheduleDialog(prev => ({ ...prev, newTime: time }))}
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
                onClick={() => setRescheduleDialog({
                  open: false,
                  appointment: null,
                  newDate: '',
                  newTime: '',
                  availableSlots: [],
                  availableDates: []
                })}
              >
                Отмена
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleRescheduleAppointment}
                disabled={!rescheduleDialog.newDate || !rescheduleDialog.newTime}
              >
                Перенести
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cloneDialog.open} onOpenChange={(open) => setCloneDialog({...cloneDialog, open})}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Клонировать запись</DialogTitle>
            <DialogDescription>
              Создайте новую запись для пациента на другую дату и время
            </DialogDescription>
          </DialogHeader>
          {cloneDialog.appointment && (
            <form onSubmit={handleCloneAppointment} className="space-y-4">
              {cloneDialog.newDate && cloneDialog.newTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-900">
                    🔄 Новая запись: {new Date(cloneDialog.newDate + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })} в {cloneDialog.newTime}
                  </p>
                </div>
              )}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm"><strong>Пациент:</strong> {cloneDialog.appointment.patient_name}</p>
                <p className="text-sm"><strong>Телефон:</strong> {cloneDialog.appointment.patient_phone}</p>
                {cloneDialog.appointment.patient_snils && (
                  <p className="text-sm"><strong>СНИЛС:</strong> {cloneDialog.appointment.patient_snils}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  <strong>Запись:</strong> {new Date(cloneDialog.appointment.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {cloneDialog.appointment.appointment_time.slice(0, 5)}
                </p>
                {cloneDialog.appointment.status === 'completed' && cloneDialog.appointment.completed_at && (
                  <p className="text-sm text-blue-600">
                    <strong>Завершено:</strong> {new Date(cloneDialog.appointment.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {new Date(cloneDialog.appointment.completed_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Новая дата</label>
                <Input
                  type="date"
                  value={cloneDialog.newDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setCloneDialog({...cloneDialog, newDate: selectedDate, newTime: ''});
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="text-sm"
                />
                {cloneDialog.newDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Выбрано: {new Date(cloneDialog.newDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
                  </p>
                )}
              </div>

              {cloneDialog.newDate && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Новое время</label>
                  {cloneDialog.availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                      {cloneDialog.availableSlots.map((slot: string) => (
                        <Button
                          key={slot}
                          type="button"
                          size="sm"
                          variant={cloneDialog.newTime === slot ? 'default' : 'outline'}
                          onClick={() => setCloneDialog({...cloneDialog, newTime: slot})}
                          className="h-8"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/30">
                      Нет доступных слотов на выбранную дату
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Описание проблемы (необязательно)</label>
                <Textarea
                  value={cloneDialog.newDescription}
                  onChange={(e) => setCloneDialog({...cloneDialog, newDescription: e.target.value})}
                  placeholder="Краткое описание проблемы"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCloneDialog({
                    open: false,
                    appointment: null,
                    newDate: '',
                    newTime: '',
                    newDescription: '',
                    availableSlots: []
                  })}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!cloneDialog.newDate || !cloneDialog.newTime}
                >
                  <Icon name="Copy" size={16} className="mr-2" />
                  Клонировать
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dayOffWarning.open} onOpenChange={(open) => setDayOffWarning({...dayOffWarning, open})}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">⚠️ Внимание!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src="https://cdn.poehali.dev/projects/317e44da-9a2a-46c7-91b6-a5c7dee19b28/files/63fb9e22-96eb-474f-a24c-08bcdfc6cc6a.jpg" 
                alt="Удивленный врач"
                className="w-48 h-48 object-cover rounded-lg shadow-lg"
              />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">
                На этот день уже есть записи!
              </p>
              <p className="text-sm text-muted-foreground">
                Найдено записей: <span className="font-bold text-orange-600">{dayOffWarning.appointmentCount}</span>
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-orange-900">
                  Если вы сделаете этот день выходным, не забудьте уведомить пациентов о необходимости переноса записи!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDayOffWarning({open: false, date: '', appointmentCount: 0})}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmDayOff}
            >
              <Icon name="AlertTriangle" size={18} className="mr-2" />
              Да, сделать выходным
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Doctor;