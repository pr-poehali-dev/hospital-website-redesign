import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';

const API_URLS = {
  schedules: 'https://functions.poehali.dev/6f53f66d-3e47-4e57-93dd-52d63c16d38f',
};

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface DoctorScheduleManagerProps {
  doctorInfo: any;
  schedules: any[];
  onSchedulesUpdate: () => void;
  toast: any;
}

const DoctorScheduleManager = ({ doctorInfo, schedules, onSchedulesUpdate, toast }: DoctorScheduleManagerProps) => {
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
  const [copyFromSchedule, setCopyFromSchedule] = useState<any>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<number[]>([]);
  const [scheduleInstructionOpen, setScheduleInstructionOpen] = useState(false);

  const resetForm = () => {
    setScheduleForm({
      day_of_week: 0,
      start_time: '08:00',
      end_time: '17:00',
      break_start_time: '',
      break_end_time: '',
      slot_duration: 15
    });
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          doctor_id: doctorInfo.id,
          ...scheduleForm
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Успешно", description: "Расписание создано" });
        setIsOpen(false);
        resetForm();
        onSchedulesUpdate();
      } else {
        toast({ title: "Ошибка", description: data.message || "Не удалось создать расписание", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Ошибка при создании расписания", variant: "destructive" });
    }
  };

  const handleToggleActive = async (scheduleId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          schedule_id: scheduleId,
          is_active: !currentStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Успешно", description: `Расписание ${!currentStatus ? 'активировано' : 'деактивировано'}` });
        onSchedulesUpdate();
      } else {
        toast({ title: "Ошибка", description: data.message || "Не удалось изменить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Ошибка при изменении статуса", variant: "destructive" });
    }
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          schedule_id: editingSchedule.id,
          ...scheduleForm
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Успешно", description: "Расписание обновлено" });
        setIsEditOpen(false);
        setEditingSchedule(null);
        resetForm();
        onSchedulesUpdate();
      } else {
        toast({ title: "Ошибка", description: data.message || "Не удалось обновить расписание", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Ошибка при обновлении расписания", variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это расписание?')) return;
    
    try {
      const response = await fetch(API_URLS.schedules, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          schedule_id: scheduleId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Успешно", description: "Расписание удалено" });
        onSchedulesUpdate();
      } else {
        toast({ title: "Ошибка", description: data.message || "Не удалось удалить расписание", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Ошибка при удалении расписания", variant: "destructive" });
    }
  };

  const handleCopySchedule = (schedule: any) => {
    setCopyFromSchedule(schedule);
    setSelectedDaysToCopy([]);
    setIsCopyDialogOpen(true);
  };

  const handleApplyCopyToSelectedDays = async () => {
    if (!copyFromSchedule || selectedDaysToCopy.length === 0) {
      toast({ title: "Ошибка", description: "Выберите хотя бы один день для копирования", variant: "destructive" });
      return;
    }

    try {
      for (const dayOfWeek of selectedDaysToCopy) {
        const response = await fetch(API_URLS.schedules, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            doctor_id: doctorInfo.id,
            day_of_week: dayOfWeek,
            start_time: copyFromSchedule.start_time,
            end_time: copyFromSchedule.end_time,
            break_start_time: copyFromSchedule.break_start_time,
            break_end_time: copyFromSchedule.break_end_time,
            slot_duration: copyFromSchedule.slot_duration
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          toast({ title: "Ошибка", description: `Не удалось скопировать расписание на ${DAYS_OF_WEEK[dayOfWeek]}`, variant: "destructive" });
        }
      }

      toast({ title: "Успешно", description: "Расписание скопировано на выбранные дни" });
      
      setIsCopyDialogOpen(false);
      setCopyFromSchedule(null);
      setSelectedDaysToCopy([]);
      onSchedulesUpdate();
    } catch (error) {
      toast({ title: "Ошибка", description: "Ошибка при копировании расписания", variant: "destructive" });
    }
  };

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      break_start_time: schedule.break_start_time ? schedule.break_start_time.slice(0, 5) : '',
      break_end_time: schedule.break_end_time ? schedule.break_end_time.slice(0, 5) : '',
      slot_duration: schedule.slot_duration
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <Dialog open={scheduleInstructionOpen} onOpenChange={setScheduleInstructionOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Icon name="HelpCircle" size={16} className="mr-2" />
            Как настроить расписание?
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройка расписания приема</DialogTitle>
            <DialogDescription>Подробная инструкция по работе с расписанием</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Создание нового расписания</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Нажмите кнопку "Добавить расписание"</li>
                <li>Выберите день недели (Понедельник - Воскресенье)</li>
                <li>Укажите время начала и окончания приема</li>
                <li>При необходимости добавьте перерыв (время начала и окончания перерыва)</li>
                <li>Укажите длительность одного слота в минутах (по умолчанию 15 минут)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Управление расписанием</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Редактировать:</strong> измените время работы или длительность слота</li>
                <li><strong>Копировать:</strong> примените расписание одного дня на другие дни недели</li>
                <li><strong>Активировать/Деактивировать:</strong> временно отключите расписание без удаления</li>
                <li><strong>Удалить:</strong> полностью удалите расписание на выбранный день</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Длительность слота</h3>
              <p className="mb-2">Длительность слота определяет, сколько времени выделяется на один прием пациента. Примеры:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>15 минут — быстрые консультации</li>
                <li>30 минут — стандартный прием</li>
                <li>45-60 минут — расширенный прием</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Расписание приема</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить расписание
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать расписание</DialogTitle>
              <DialogDescription>Укажите день недели и время приема</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">День недели</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Начало работы</label>
                  <Input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Конец работы</label>
                  <Input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Начало перерыва</label>
                  <Input
                    type="time"
                    value={scheduleForm.break_start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, break_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Конец перерыва</label>
                  <Input
                    type="time"
                    value={scheduleForm.break_end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, break_end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Длительность слота (минуты)</label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={scheduleForm.slot_duration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, slot_duration: Number(e.target.value) })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Создать расписание
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать расписание</DialogTitle>
            <DialogDescription>Измените параметры расписания</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSchedule} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">День недели</label>
              <select
                className="w-full p-2 border rounded-md"
                value={scheduleForm.day_of_week}
                onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Начало работы</label>
                <Input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Конец работы</label>
                <Input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Начало перерыва</label>
                <Input
                  type="time"
                  value={scheduleForm.break_start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, break_start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Конец перерыва</label>
                <Input
                  type="time"
                  value={scheduleForm.break_end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, break_end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Длительность слота (минуты)</label>
              <Input
                type="number"
                min="5"
                max="120"
                value={scheduleForm.slot_duration}
                onChange={(e) => setScheduleForm({ ...scheduleForm, slot_duration: Number(e.target.value) })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Сохранить изменения
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Копировать расписание</DialogTitle>
            <DialogDescription>Выберите дни, на которые хотите скопировать расписание</DialogDescription>
          </DialogHeader>
          {copyFromSchedule && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Копируется расписание:</p>
                <p className="text-sm">День: {DAYS_OF_WEEK[copyFromSchedule.day_of_week]}</p>
                <p className="text-sm">Время: {copyFromSchedule.start_time.slice(0, 5)} - {copyFromSchedule.end_time.slice(0, 5)}</p>
                {copyFromSchedule.break_start_time && (
                  <p className="text-sm">Перерыв: {copyFromSchedule.break_start_time.slice(0, 5)} - {copyFromSchedule.break_end_time.slice(0, 5)}</p>
                )}
                <p className="text-sm">Длительность слота: {copyFromSchedule.slot_duration} мин</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Выберите дни для копирования:</label>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedDaysToCopy.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDaysToCopy([...selectedDaysToCopy, index]);
                          } else {
                            setSelectedDaysToCopy(selectedDaysToCopy.filter(d => d !== index));
                          }
                        }}
                        disabled={index === copyFromSchedule.day_of_week}
                        className="rounded"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleApplyCopyToSelectedDays} className="w-full">
                Применить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Расписание еще не настроено</p>
            <p className="text-sm text-muted-foreground mt-2">Создайте расписание для каждого дня недели</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>День недели</TableHead>
                  <TableHead>Время работы</TableHead>
                  <TableHead>Перерыв</TableHead>
                  <TableHead>Слот</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: any) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{DAYS_OF_WEEK[schedule.day_of_week]}</TableCell>
                    <TableCell>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</TableCell>
                    <TableCell>
                      {schedule.break_start_time 
                        ? `${schedule.break_start_time.slice(0, 5)} - ${schedule.break_end_time.slice(0, 5)}`
                        : '—'}
                    </TableCell>
                    <TableCell>{schedule.slot_duration} мин</TableCell>
                    <TableCell>
                      <Button
                        variant={schedule.is_active ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                      >
                        {schedule.is_active ? 'Активно' : 'Неактивно'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreVertical" size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(schedule)}>
                            <Icon name="Edit" size={16} className="mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopySchedule(schedule)}>
                            <Icon name="Copy" size={16} className="mr-2" />
                            Копировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-destructive"
                          >
                            <Icon name="Trash2" size={16} className="mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorScheduleManager;
