import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  useEffect(() => {
    const auth = localStorage.getItem('doctor_auth');
    if (auth) {
      const doctor = JSON.parse(auth);
      setDoctorInfo(doctor);
      setIsAuthenticated(true);
      loadSchedules(doctor.id);
      loadAppointments(doctor.id);
    }
  }, []);

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

  const loadAppointments = async (doctorId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorId}&start_date=${today}&end_date=${nextWeek}`);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
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

  const handleLogout = () => {
    localStorage.removeItem('doctor_auth');
    setIsAuthenticated(false);
    setDoctorInfo(null);
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

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="schedule">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Расписание</TabsTrigger>
              <TabsTrigger value="appointments">Записи пациентов</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-6">
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium mb-2">✨ Гибкое расписание для каждого дня недели</p>
                      <p className="text-sm text-blue-700 mb-3">
                        Настраивайте индивидуальное время работы и перерывы для каждого дня. 
                        Например: понедельник 8:00-17:00 с перерывом 12:00-13:00, а суббота 9:00-14:00 без перерыва.
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
                        <span className="px-2 py-1 bg-white/60 rounded-md text-green-800">
                          <Icon name="CheckCircle" size={12} className="inline mr-1" />
                          Полный контроль
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
                      <CardContent>
                        <div className="space-y-3">
                          {groupedAppointments[date]
                            .sort((a: any, b: any) => a.appointment_time.localeCompare(b.appointment_time))
                            .map((appointment: any) => (
                            <div 
                              key={appointment.id} 
                              className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-semibold flex items-center gap-2">
                                    <Icon name="Clock" size={16} className="text-primary" />
                                    {appointment.appointment_time.slice(0, 5)}
                                  </p>
                                  <p className="text-lg font-medium mt-1">{appointment.patient_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    <Icon name="Phone" size={14} className="inline mr-1" />
                                    {appointment.patient_phone}
                                  </p>
                                  {appointment.description && (
                                    <p className="text-sm mt-2 text-muted-foreground">
                                      {appointment.description}
                                    </p>
                                  )}
                                  
                                  {appointment.status === 'scheduled' && (
                                    <div className="flex gap-2 mt-3">
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                                      >
                                        <Icon name="CheckCircle" size={14} className="mr-1" />
                                        Завершить прием
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => {
                                          if (confirm('Вы уверены, что хотите отменить эту запись?')) {
                                            handleUpdateAppointmentStatus(appointment.id, 'cancelled');
                                          }
                                        }}
                                      >
                                        <Icon name="XCircle" size={14} className="mr-1" />
                                        Отменить
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs h-fit ${
                                  appointment.status === 'scheduled' 
                                    ? 'bg-green-100 text-green-800' 
                                    : appointment.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status === 'scheduled' ? 'Запланировано' : 
                                   appointment.status === 'completed' ? 'Завершено' : 'Отменено'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Doctor;