import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const API_URLS = {
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
  appointments: 'https://functions.poehali.dev/a7f148cd-e1c2-40e3-9762-cc8b2bc2dffb',
};

interface DoctorCalendarProps {
  doctorInfo: any;
  selectedYear: number;
  onYearChange: (year: number) => void;
  toast: any;
}

const DoctorCalendar = ({ doctorInfo, selectedYear, onYearChange, toast }: DoctorCalendarProps) => {
  const [calendarData, setCalendarData] = useState<{[key: string]: {is_working: boolean, note?: string}}>({});
  const [slotStats, setSlotStats] = useState<{[key: string]: {available: number, booked: number}}>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dayOffWarning, setDayOffWarning] = useState<{open: boolean, date: string, appointmentCount: number}>({
    open: false,
    date: '',
    appointmentCount: 0
  });
  const [calendarInstructionOpen, setCalendarInstructionOpen] = useState(false);

  useEffect(() => {
    if (doctorInfo && selectedYear) {
      loadCalendar(doctorInfo.id, selectedYear);
    }
  }, [selectedYear, doctorInfo]);

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
        const appointmentsOnDay = (data.appointments || []).filter((app: any) => 
          app.status === 'scheduled' || app.status === 'completed' || app.status === 'cancelled'
        );
        
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

  const loadSlotStats = async () => {
    if (!doctorInfo) return;
    
    setIsLoadingSlots(true);
    setLoadingProgress(0);
    
    try {
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      const allDates: string[] = [];
      const tempDate = new Date(currentDate);
      while (tempDate <= nextMonth) {
        allDates.push(tempDate.toISOString().split('T')[0]);
        tempDate.setDate(tempDate.getDate() + 1);
      }
      
      const stats: {[key: string]: {available: number, booked: number}} = {};
      
      for (let i = 0; i < allDates.length; i++) {
        const date = allDates[i];
        try {
          const response = await fetch(`${API_URLS.schedules}?action=slots&doctor_id=${doctorInfo.id}&date=${date}`);
          const data = await response.json();
          
          if (data.success && data.slots) {
            const available = data.slots.filter((s: any) => s.is_available).length;
            const booked = data.slots.filter((s: any) => !s.is_available).length;
            stats[date] = { available, booked };
          }
        } catch (error) {
          console.error(`Failed to load slots for ${date}:`, error);
        }
        
        setLoadingProgress(Math.round(((i + 1) / allDates.length) * 100));
      }
      
      setSlotStats(stats);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить статистику слотов", variant: "destructive" });
    } finally {
      setIsLoadingSlots(false);
      setLoadingProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={calendarInstructionOpen} onOpenChange={setCalendarInstructionOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Календарь рабочих дней</DialogTitle>
            <DialogDescription>Как управлять рабочими и выходными днями</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Обозначения:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 border border-green-300 rounded"></div>
                  <span>Рабочий день (прием пациентов)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 border border-red-300 rounded"></div>
                  <span>Выходной день (прием не ведется)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Как изменить статус дня:</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Нажмите на день в календаре</li>
                <li>Рабочий день станет выходным и наоборот</li>
                <li>Если на день есть записи, система предупредит вас</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Статистика слотов:</h3>
              <p className="mb-2">После загрузки слотов вы увидите цифры вида "5/3":</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Первая цифра — свободные слоты</li>
                <li>Вторая цифра — занятые слоты</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dayOffWarning.open} onOpenChange={(open) => setDayOffWarning({...dayOffWarning, open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Icon name="AlertTriangle" size={24} />
              Внимание! На этот день есть записи
            </DialogTitle>
            <DialogDescription>
              На {new Date(dayOffWarning.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} 
              {' '}назначено {dayOffWarning.appointmentCount} записей. 
              Вы уверены, что хотите отметить этот день как выходной?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDayOffWarning({open: false, date: '', appointmentCount: 0})}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDayOff}>
              Да, отметить выходным
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Календарь на {selectedYear} год</h3>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => setCalendarInstructionOpen(true)}>
            <Icon name="HelpCircle" size={16} className="mr-2" />
            Инструкция
          </Button>
          <Button variant="outline" size="sm" onClick={() => onYearChange(selectedYear - 1)}>
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <span className="font-semibold px-4">{selectedYear}</span>
          <Button variant="outline" size="sm" onClick={() => onYearChange(selectedYear + 1)}>
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={loadSlotStats} disabled={isLoadingSlots}>
          {isLoadingSlots ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Загрузка {loadingProgress}%
            </>
          ) : (
            <>
              <Icon name="BarChart3" size={20} className="mr-2" />
              Получить слоты
            </>
          )}
        </Button>
      </div>

      {isLoadingSlots ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="w-full max-w-md">
                <p className="text-lg font-semibold text-blue-900">Идет получение данных</p>
                <p className="text-sm text-blue-700 mt-1">Загружаем статистику слотов...</p>
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
    </div>
  );
};

export default DoctorCalendar;
