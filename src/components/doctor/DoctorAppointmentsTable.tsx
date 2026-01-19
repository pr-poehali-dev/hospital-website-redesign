import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import * as XLSX from 'xlsx';

interface DoctorAppointmentsTableProps {
  doctorInfo: any;
  appointments: any[];
  onRefresh: () => void;
  toast: any;
}

const DoctorAppointmentsTable = ({ doctorInfo, appointments, onRefresh, toast }: DoctorAppointmentsTableProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilterFrom, setDateFilterFrom] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dateFilterTo, setDateFilterTo] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAppointments = appointments.filter((app: any) => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    const dateMatch = app.appointment_date >= dateFilterFrom && app.appointment_date <= dateFilterTo;
    const searchMatch = searchQuery === '' || 
      app.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient_phone.includes(searchQuery) ||
      (app.patient_snils && app.patient_snils.includes(searchQuery));
    return statusMatch && dateMatch && searchMatch;
  });

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

    toast({ title: "Экспорт завершен", description: `Экспортировано записей: ${dataForExport.length}` });
  };

  const setQuickDateFilter = (preset: string) => {
    const today = new Date();
    const from = new Date(today);
    const to = new Date(today);

    switch (preset) {
      case 'today':
        break;
      case 'week':
        to.setDate(to.getDate() + 7);
        break;
      case 'month':
        to.setMonth(to.getMonth() + 1);
        break;
      case 'year':
        to.setFullYear(to.getFullYear() + 1);
        break;
    }

    setDateFilterFrom(from.toISOString().split('T')[0]);
    setDateFilterTo(to.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            className="p-2 border rounded-md text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Все записи</option>
            <option value="scheduled">Запланировано</option>
            <option value="completed">Завершено</option>
            <option value="cancelled">Отменено</option>
          </select>

          <Input
            type="text"
            placeholder="Поиск по имени, телефону, СНИЛС..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Icon name="FileDown" size={16} className="mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-sm">С:</label>
          <Input
            type="date"
            value={dateFilterFrom}
            onChange={(e) => setDateFilterFrom(e.target.value)}
            className="w-40"
          />
          <label className="text-sm">По:</label>
          <Input
            type="date"
            value={dateFilterTo}
            onChange={(e) => setDateFilterTo(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setQuickDateFilter('today')}>Сегодня</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateFilter('week')}>Неделя</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateFilter('month')}>Месяц</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateFilter('year')}>Год</Button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Записей не найдено</p>
            <p className="text-sm text-muted-foreground mt-2">Измените фильтры или период</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>СНИЛС</TableHead>
                  <TableHead>Примечание</TableHead>
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
                  .map((appointment: any) => {
                    const date = new Date(appointment.appointment_date + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = date < today;
                    const isToday = date.getTime() === today.getTime();

                    return (
                      <TableRow key={appointment.id} className={isToday ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <div className={`font-medium ${isPast ? 'text-muted-foreground' : ''} ${isToday ? 'text-primary' : ''}`}>
                            {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{appointment.appointment_time.slice(0, 5)}</TableCell>
                        <TableCell>{appointment.patient_name}</TableCell>
                        <TableCell>
                          <a href={`tel:${appointment.patient_phone}`} className="text-primary hover:underline">
                            {appointment.patient_phone}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">{appointment.patient_snils || '—'}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{appointment.description || '—'}</TableCell>
                        <TableCell>
                          {appointment.status === 'completed' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Icon name="CheckCircle" size={12} className="mr-1" />
                              Завершено
                            </span>
                          )}
                          {appointment.status === 'scheduled' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Icon name="Clock" size={12} className="mr-1" />
                              Запланировано
                            </span>
                          )}
                          {appointment.status === 'cancelled' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Icon name="XCircle" size={12} className="mr-1" />
                              Отменено
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Icon name="MoreVertical" size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Icon name="Eye" size={16} className="mr-2" />
                                Подробнее
                              </DropdownMenuItem>
                              {appointment.status === 'scheduled' && (
                                <>
                                  <DropdownMenuItem>
                                    <Icon name="CheckCircle" size={16} className="mr-2" />
                                    Завершить прием
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Icon name="Calendar" size={16} className="mr-2" />
                                    Перенести
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Icon name="XCircle" size={16} className="mr-2" />
                                    Отменить
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Показано записей: {filteredAppointments.length} из {appointments.length}
      </div>
    </div>
  );
};

export default DoctorAppointmentsTable;
