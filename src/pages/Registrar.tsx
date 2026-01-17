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
  const [editDialog, setEditDialog] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<any>(null);
  const [rescheduleDialog, setRescheduleDialog] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<{[key: string]: {is_working: boolean}}>({});
  const [schedules, setSchedules] = useState<any[]>([]);

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

  const generateAvailableDates = () => {
    const dates = [];
    for (let i = 0; i <= 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = (date.getDay() + 6) % 7;
      
      const hasSchedule = schedules.some((s: any) => s.day_of_week === dayOfWeek && s.is_active);
      const calendarOverride = calendarData[dateStr];
      const isWorking = calendarOverride !== undefined ? calendarOverride.is_working : hasSchedule;
      
      console.log(`Дата ${dateStr}, день недели ${dayOfWeek}, hasSchedule: ${hasSchedule}, calendar: ${calendarOverride?.is_working}, итог: ${isWorking}`);
      
      dates.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        isWorking,
        slotsCount: 0
      });
    }
    console.log('Schedules:', schedules);
    console.log('CalendarData:', calendarData);
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
        toast({ title: "Успешно", description: "Запись отменена" });
        loadAppointments(selectedDoctor.id);
        setCancelDialog(null);
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
    return searchMatch;
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
          <h2 className="text-3xl font-bold mb-6">Врачи</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {doctors.map((doctor: any) => (
              <Card 
                key={doctor.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDoctor?.id === doctor.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {doctor.photo_url ? (
                      <img 
                        src={doctor.photo_url} 
                        alt={doctor.full_name} 
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={24} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{doctor.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{doctor.position}</p>
                      {doctor.specialization && (
                        <p className="text-xs text-muted-foreground truncate">{doctor.specialization}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDoctor && (
            <>
              <h3 className="text-2xl font-bold mb-4">
                Доступные даты для записи к врачу {selectedDoctor.full_name}
              </h3>
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

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Записи пациентов</h3>
                <Input
                  type="text"
                  placeholder="Поиск по ФИО или телефону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[300px]"
                />
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Время</TableHead>
                        <TableHead>Пациент</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>СНИЛС</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
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
                          <TableRow key={appointment.id}>
                            <TableCell>
                              {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')}
                            </TableCell>
                            <TableCell>{appointment.appointment_time.slice(0, 5)}</TableCell>
                            <TableCell>{appointment.patient_name}</TableCell>
                            <TableCell>{appointment.patient_phone}</TableCell>
                            <TableCell>{appointment.patient_snils || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{appointment.description || '—'}</TableCell>
                            <TableCell>
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
                            <TableCell className="text-right">
                              {appointment.status === 'scheduled' && (
                                <div className="flex gap-1 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setCancelDialog(appointment)}
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
            </>
          )}
        </div>
      </section>

      <Dialog open={newAppointmentDialog.open} onOpenChange={(open) => setNewAppointmentDialog({ ...newAppointmentDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Записать пациента</DialogTitle>
            <DialogDescription>
              {selectedDoctor?.full_name} • {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')} • {newAppointmentDialog.time}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div>
              <label className="text-sm font-medium">ФИО пациента *</label>
              <Input
                value={newAppointmentDialog.patientName}
                onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Телефон *</label>
              <Input
                value={newAppointmentDialog.patientPhone}
                onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientPhone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">СНИЛС</label>
              <Input
                value={newAppointmentDialog.patientSnils}
                onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, patientSnils: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Input
                value={newAppointmentDialog.description}
                onChange={(e) => setNewAppointmentDialog({ ...newAppointmentDialog, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setNewAppointmentDialog({ ...newAppointmentDialog, open: false })}>
                Отмена
              </Button>
              <Button type="submit" className="flex-1">Записать</Button>
            </div>
          </form>
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
    </div>
  );
};

export default Registrar;