import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

import DoctorLoginForm from '@/components/doctor/DoctorLoginForm';
import DoctorScheduleManager from '@/components/doctor/DoctorScheduleManager';
import DoctorAppointmentsTable from '@/components/doctor/DoctorAppointmentsTable';
import DoctorCalendar from '@/components/doctor/DoctorCalendar';

const API_URLS = {
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
  appointments: 'https://functions.poehali.dev/a7f148cd-e1c2-40e3-9762-cc8b2bc2dffb',
};

const Doctor = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const lastAppointmentIdsRef = useRef<Set<number>>(new Set());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('doctor_auto_refresh');
    return saved === 'true';
  });
  const [checkInterval] = useState(() => {
    const saved = localStorage.getItem('doctor_check_interval');
    return saved ? parseInt(saved) : 900;
  });

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

  useEffect(() => {
    if (doctorInfo && autoRefreshEnabled) {
      const interval = setInterval(() => {
        loadAppointments(doctorInfo.id, true);
      }, checkInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [doctorInfo, autoRefreshEnabled, checkInterval]);

  const handleLoginSuccess = (doctor: any) => {
    setDoctorInfo(doctor);
    setIsAuthenticated(true);
    loadSchedules(doctor.id);
    loadAppointments(doctor.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('doctor_auth');
    setIsAuthenticated(false);
    setDoctorInfo(null);
    setSchedules([]);
    setAppointments([]);
  };

  const loadSchedules = async (doctorId: number) => {
    try {
      const response = await fetch(`${API_URLS.schedules}?doctor_id=${doctorId}&action=list`);
      const data = await response.json();
      
      if (data.success) {
        const sortedSchedules = data.schedules.sort((a: any, b: any) => a.day_of_week - b.day_of_week);
        setSchedules(sortedSchedules);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadAppointments = async (doctorId: number, checkForNew = false) => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await fetch(`${API_URLS.appointments}?doctor_id=${doctorId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await response.json();
      const newAppointments = data.appointments || [];
      
      if (checkForNew && lastAppointmentIdsRef.current.size > 0) {
        const addedAppointments = newAppointments.filter((a: any) => !lastAppointmentIdsRef.current.has(a.id));
        
        if (addedAppointments.length > 0) {
          const latestAppointment = addedAppointments[addedAppointments.length - 1];
          
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
      
      setAppointments(newAppointments);
      lastAppointmentIdsRef.current = new Set(newAppointments.map((a: any) => a.id));
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    }
  };

  if (!isAuthenticated) {
    return <DoctorLoginForm onLoginSuccess={handleLoginSuccess} toast={toast} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Icon name="Stethoscope" size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{doctorInfo.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{doctorInfo.specialization}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Icon name="Calendar" size={16} />
              Записи пациентов
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Icon name="Clock" size={16} />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Icon name="CalendarDays" size={16} />
              Календарь
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <DoctorAppointmentsTable
              doctorInfo={doctorInfo}
              appointments={appointments}
              onRefresh={() => loadAppointments(doctorInfo.id)}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <DoctorScheduleManager
              doctorInfo={doctorInfo}
              schedules={schedules}
              onSchedulesUpdate={() => loadSchedules(doctorInfo.id)}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <DoctorCalendar
              doctorInfo={doctorInfo}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              toast={toast}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Doctor;
