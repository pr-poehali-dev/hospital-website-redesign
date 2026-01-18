import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
  doctors: 'https://functions.poehali.dev/68f877b2-aeda-437a-ad67-925a3414d688',
  faq: 'https://functions.poehali.dev/fb5160e8-f170-4c21-97a9-3afbcb6f78a9',
  forumModeration: 'https://functions.poehali.dev/70286923-439c-45b7-9744-403f0827a0c1',
  complaints: 'https://functions.poehali.dev/a6c04c63-0223-4bcc-b146-24acdef33536',
  chat: 'https://functions.poehali.dev/f0120272-0320-4731-8a43-e5c1362e3057',
  registrars: 'https://functions.poehali.dev/bda47195-c96f-4fb7-b72c-59d877add3c2',
};

const Admin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState({
    full_name: '',
    phone: '',
    position: '',
    specialization: '',
    login: '',
    password: '',
    photo_url: '',
    clinic: 'Центральная городская поликлиника',
    education: '',
    work_experience: '',
    office_number: ''
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    image_url: '',
    display_order: 0
  });
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isFaqEditOpen, setIsFaqEditOpen] = useState(false);
  const [forumUsers, setForumUsers] = useState([]);
  const [forumTopics, setForumTopics] = useState([]);
  const [blockReason, setBlockReason] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chats, setChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [operatorMessage, setOperatorMessage] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [newChatsCount, setNewChatsCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState<{[key: number]: number}>({});
  const lastMessageCountRef = useRef<{[key: number]: number}>({});
  const [previousChatCount, setPreviousChatCount] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [registrars, setRegistrars] = useState([]);
  const [registrarForm, setRegistrarForm] = useState({
    full_name: '',
    phone: '',
    login: '',
    password: '',
    clinic: 'Центральная городская поликлиника'
  });
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [editingRegistrar, setEditingRegistrar] = useState<any>(null);
  const [isRegistrarEditOpen, setIsRegistrarEditOpen] = useState(false);
  const [registrarLogs, setRegistrarLogs] = useState([]);
  const [selectedRegistrarForLogs, setSelectedRegistrarForLogs] = useState<any>(null);
  const [logFilterType, setLogFilterType] = useState<string>('all');
  const [logFilterText, setLogFilterText] = useState<string>('');
  const [logFilterDateFrom, setLogFilterDateFrom] = useState<string>('');
  const [logFilterDateTo, setLogFilterDateTo] = useState<string>('');
  const notificationSound = typeof Audio !== 'undefined' ? new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn7bViFg==') : null;

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth) {
      setIsAuthenticated(true);
      loadDoctors();
      loadRegistrars();
      loadFaqs();
      loadForumUsers();
      loadForumTopics();
      loadComplaints();
      loadChats();
      const adminData = JSON.parse(auth);
      setOperatorName(adminData.full_name || 'Оператор');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let interval: NodeJS.Timeout | null = null;
    let isPageVisible = true;
    
    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (isPageVisible) {
          loadChats(true);
          if (selectedChat) {
            loadChatMessages(selectedChat.id, true);
          }
        }
      }, 60000);
    };
    
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        loadChats(true);
        if (selectedChat) {
          loadChatMessages(selectedChat.id, true);
        }
        startPolling();
      } else {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPolling();
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, selectedChat]);

  useEffect(() => {
    const container = document.getElementById('chat-scroll-anchor');
    if (container && chatMessages.length > 0) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginForm, type: 'admin' }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('admin_auth', JSON.stringify(data.user));
        setIsAuthenticated(true);
        loadDoctors();
        toast({ title: "Успешный вход", description: `Добро пожаловать, ${data.user.full_name}` });
      } else {
        toast({ title: "Ошибка", description: data.error || "Неверные данные", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch(API_URLS.doctors);
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить врачей", variant: "destructive" });
    }
  };

  const loadRegistrars = async () => {
    try {
      const response = await fetch(`${API_URLS.registrars}?action=list`);
      const data = await response.json();
      setRegistrars(data.registrars || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить регистраторов", variant: "destructive" });
    }
  };

  const loadRegistrarLogs = async (registrarId?: number) => {
    try {
      const url = registrarId 
        ? `${API_URLS.registrars}?action=logs&registrar_id=${registrarId}&limit=500`
        : `${API_URLS.registrars}?action=logs&limit=1000`;
      const response = await fetch(url);
      const data = await response.json();
      setRegistrarLogs(data.logs || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить журнал", variant: "destructive" });
    }
  };

  const getFilteredLogs = () => {
    return registrarLogs.filter((log: any) => {
      if (logFilterType !== 'all' && log.action_type !== logFilterType) return false;
      
      if (logFilterText) {
        const details = log.details || '';
        const registrarName = log.registrar_name || '';
        const searchText = logFilterText.toLowerCase();
        if (!details.toLowerCase().includes(searchText) && 
            !registrarName.toLowerCase().includes(searchText)) {
          return false;
        }
      }
      
      if (logFilterDateFrom || logFilterDateTo) {
        const logDate = new Date(log.created_at);
        if (logFilterDateFrom) {
          const fromDate = new Date(logFilterDateFrom + 'T00:00:00');
          if (logDate < fromDate) return false;
        }
        if (logFilterDateTo) {
          const toDate = new Date(logFilterDateTo + 'T23:59:59');
          if (logDate > toDate) return false;
        }
      }
      
      return true;
    });
  };

  const getUniqueActionTypes = () => {
    const types = new Set<string>();
    registrarLogs.forEach((log: any) => {
      if (log.action_type) types.add(log.action_type);
    });
    return Array.from(types).sort();
  };

  const exportLogsToExcel = () => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) {
      toast({ title: "Ошибка", description: "Нет данных для экспорта", variant: "destructive" });
      return;
    }

    const headers = '№\tДата\tВремя\tТип операции\tОписание\tРегистратор\n';
    
    const rows = filteredLogs.map((log: any, index: number) => {
      const date = new Date(log.created_at);
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(log.details || '{}');
      } catch (e) {
        detailsObj = { raw: log.details };
      }
      
      const formatDetails = () => {
        const parts = [];
        if (detailsObj.patient_name) parts.push(`Пациент: ${detailsObj.patient_name}`);
        if (detailsObj.patient_phone) parts.push(`Тел: ${detailsObj.patient_phone}`);
        if (detailsObj.doctor_name) parts.push(`Врач: ${detailsObj.doctor_name}`);
        if (detailsObj.appointment_date) parts.push(`Дата: ${new Date(detailsObj.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')}`);
        if (detailsObj.appointment_time) parts.push(`Время: ${detailsObj.appointment_time.slice(0, 5)}`);
        if (detailsObj.old_date && detailsObj.new_date) {
          parts.push(`${new Date(detailsObj.old_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.old_time?.slice(0, 5)} -> ${new Date(detailsObj.new_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.new_time?.slice(0, 5)}`);
        }
        if (detailsObj.raw) parts.push(detailsObj.raw);
        return parts.join(' | ');
      };

      return `${index + 1}\t${date.toLocaleDateString('ru-RU')}\t${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\t${log.action_type}\t${formatDetails()}\t${log.registrar_name || ''}`;
    }).join('\n');

    const csv = headers + rows;
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `журнал_регистраторов_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Успешно", description: `Экспортировано ${filteredLogs.length} записей` });
  };

  const printLogs = () => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) {
      toast({ title: "Ошибка", description: "Нет данных для печати", variant: "destructive" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredLogs.map((log: any, index: number) => {
      const date = new Date(log.created_at);
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(log.details || '{}');
      } catch (e) {
        detailsObj = { raw: log.details };
      }
      
      const formatDetails = () => {
        const parts = [];
        if (detailsObj.patient_name) parts.push(`Пациент: ${detailsObj.patient_name}`);
        if (detailsObj.patient_phone) parts.push(`Тел: ${detailsObj.patient_phone}`);
        if (detailsObj.doctor_name) parts.push(`Врач: ${detailsObj.doctor_name}`);
        if (detailsObj.appointment_date) parts.push(`Дата: ${new Date(detailsObj.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')}`);
        if (detailsObj.appointment_time) parts.push(`Время: ${detailsObj.appointment_time.slice(0, 5)}`);
        if (detailsObj.old_date && detailsObj.new_date) {
          parts.push(`${new Date(detailsObj.old_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.old_time?.slice(0, 5)} → ${new Date(detailsObj.new_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.new_time?.slice(0, 5)}`);
        }
        if (detailsObj.raw) parts.push(detailsObj.raw);
        return parts.join(' • ');
      };

      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${date.toLocaleDateString('ru-RU')}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${log.action_type}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${formatDetails()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${log.registrar_name || '—'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Журнал действий регистраторов</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Журнал действий регистраторов</h1>
        <p>ГБУЗ Антрацитовская ЦГМБ ЛНР</p>
        ${selectedRegistrarForLogs?.full_name ? `<p>Регистратор: ${selectedRegistrarForLogs.full_name}</p>` : ''}
        ${logFilterDateFrom || logFilterDateTo ? `<p>Период: ${logFilterDateFrom || 'начало'} - ${logFilterDateTo || 'сегодня'}</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Тип операции</th>
              <th>Описание</th>
              <th>Регистратор</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p style="margin-top: 20px; text-align: right;">Всего записей: ${filteredLogs.length}</p>
        <p style="margin-top: 10px; text-align: right;">Дата печати: ${new Date().toLocaleString('ru-RU')}</p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleCreateRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.registrars, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...registrarForm
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Регистратор добавлен" });
        setRegistrarForm({ full_name: '', phone: '', login: '', password: '', clinic: 'Центральная городская поликлиника' });
        setIsRegistrarOpen(false);
        loadRegistrars();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось создать регистратора", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleUpdateRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.registrars, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRegistrar.id,
          ...registrarForm
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Данные регистратора обновлены" });
        setRegistrarForm({ full_name: '', phone: '', login: '', password: '', clinic: 'Центральная городская поликлиника' });
        setIsRegistrarEditOpen(false);
        setEditingRegistrar(null);
        loadRegistrars();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось обновить регистратора", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleToggleRegistrarBlock = async (id: number, isBlocked: boolean) => {
    try {
      const response = await fetch(API_URLS.registrars, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_blocked: !isBlocked }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ 
          title: "Успешно", 
          description: `Регистратор ${!isBlocked ? 'заблокирован' : 'разблокирован'}` 
        });
        loadRegistrars();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось изменить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleDeleteRegistrar = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого регистратора?')) return;
    
    try {
      const response = await fetch(API_URLS.registrars, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Регистратор удален" });
        loadRegistrars();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось удалить регистратора", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.doctors, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorForm),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Врач добавлен" });
        setDoctorForm({ full_name: '', phone: '', position: '', specialization: '', login: '', password: '', photo_url: '', clinic: 'Центральная городская поликлиника', education: '', work_experience: '', office_number: '' });
        setIsOpen(false);
        loadDoctors();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось создать врача", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.doctors, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDoctor.id,
          ...doctorForm
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Данные врача обновлены" });
        setDoctorForm({ full_name: '', phone: '', position: '', specialization: '', login: '', password: '', photo_url: '', clinic: 'Центральная городская поликлиника', education: '', work_experience: '', office_number: '' });
        setIsEditOpen(false);
        setEditingDoctor(null);
        loadDoctors();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось обновить врача", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: number, newStatus: boolean) => {
    try {
      const response = await fetch(API_URLS.doctors, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: newStatus }),
      });
      
      if (response.ok) {
        const statusText = newStatus ? 'активирован' : 'деактивирован';
        toast({ title: "Успешно", description: `Врач ${statusText}` });
        loadDoctors();
      } else {
        toast({ title: "Ошибка", description: "Не удалось изменить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого врача? Это действие необратимо.')) return;
    
    try {
      const response = await fetch(`${API_URLS.doctors}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({ title: "Успешно", description: "Врач удален" });
        loadDoctors();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить врача", variant: "destructive" });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Ошибка", description: "Можно загружать только изображения", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ошибка", description: "Размер файла не должен превышать 5 МБ", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          const response = await fetch('https://api.poehali.dev/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              filename: file.name
            }),
          });

          const data = await response.json();

          if (response.ok && data.url) {
            setDoctorForm({ ...doctorForm, photo_url: data.url });
            toast({ title: "Успешно", description: "Фото загружено" });
          } else {
            toast({ title: "Ошибка", description: "Не удалось загрузить файл", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Ошибка", description: "Проблема с загрузкой файла", variant: "destructive" });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast({ title: "Ошибка", description: "Не удалось прочитать файл", variant: "destructive" });
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с загрузкой файла", variant: "destructive" });
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const openEditDialog = (doctor: any) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      full_name: doctor.full_name,
      phone: doctor.phone || '',
      position: doctor.position,
      specialization: doctor.specialization || '',
      login: doctor.login,
      password: '',
      photo_url: doctor.photo_url || '',
      clinic: doctor.clinic || 'Центральная городская поликлиника',
      education: doctor.education || '',
      work_experience: doctor.work_experience || '',
      office_number: doctor.office_number || ''
    });
    setIsEditOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  const loadFaqs = async () => {
    try {
      const response = await fetch(`${API_URLS.faq}?all=true`);
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить FAQ", variant: "destructive" });
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.faq, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Вопрос добавлен" });
        setFaqForm({ question: '', answer: '', image_url: '', display_order: 0 });
        setIsFaqOpen(false);
        loadFaqs();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось создать вопрос", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleUpdateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.faq, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFaq.id,
          ...faqForm
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({ title: "Успешно", description: "Вопрос обновлен" });
        setFaqForm({ question: '', answer: '', image_url: '', display_order: 0 });
        setIsFaqEditOpen(false);
        setEditingFaq(null);
        loadFaqs();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось обновить вопрос", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) return;
    
    try {
      const response = await fetch(`${API_URLS.faq}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({ title: "Успешно", description: "Вопрос удален" });
        loadFaqs();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить вопрос", variant: "destructive" });
    }
  };

  const handleToggleFaqStatus = async (id: number, newStatus: boolean) => {
    try {
      const response = await fetch(API_URLS.faq, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: newStatus }),
      });
      
      if (response.ok) {
        const statusText = newStatus ? 'активирован' : 'скрыт';
        toast({ title: "Успешно", description: `Вопрос ${statusText}` });
        loadFaqs();
      } else {
        toast({ title: "Ошибка", description: "Не удалось изменить статус", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const openEditFaqDialog = (faq: any) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      image_url: faq.image_url || '',
      display_order: faq.display_order || 0
    });
    setIsFaqEditOpen(true);
  };



  const loadComplaints = async () => {
    try {
      const response = await fetch(API_URLS.complaints);
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить жалобы", variant: "destructive" });
    }
  };

  const loadForumUsers = async () => {
    try {
      const response = await fetch(`${API_URLS.forumModeration}?action=getUsers`, {
        headers: { 'X-Admin-Token': 'admin123' },
      });
      const data = await response.json();
      setForumUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load forum users:', error);
    }
  };

  const loadForumTopics = async () => {
    try {
      const response = await fetch(`${API_URLS.forumModeration}?action=getTopics`, {
        headers: { 'X-Admin-Token': 'admin123' },
      });
      const data = await response.json();
      setForumTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to load forum topics:', error);
    }
  };

  const handleBlockUser = async (userId: number, reason: string) => {
    if (!reason.trim()) {
      toast({ title: "Ошибка", description: "Укажите причину блокировки", variant: "destructive" });
      return;
    }
    
    try {
      const response = await fetch(`${API_URLS.forumModeration}/users/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin123',
        },
        body: JSON.stringify({ user_id: userId, reason }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: "Успешно", description: data.message || "Пользователь заблокирован" });
        loadForumUsers();
        setBlockReason('');
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось заблокировать", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await fetch(`${API_URLS.forumModeration}/users/unblock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin123',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: "Успешно", description: data.message || "Пользователь разблокирован" });
        loadForumUsers();
      } else {
        toast({ title: "Ошибка", description: data.error || "Не удалось разблокировать", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleToggleTopicVisibility = async (topicId: number, hide: boolean) => {
    const action = hide ? 'hide' : 'show';
    const reason = hide ? hideReason : '';
    
    if (hide && !reason.trim()) {
      toast({ title: "Ошибка", description: "Укажите причину скрытия", variant: "destructive" });
      return;
    }
    
    try {
      const response = await fetch(`${API_URLS.forumModeration}/topics/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin123',
        },
        body: JSON.stringify({ topic_id: topicId, reason }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: "Успешно", description: data.message || `Тема ${hide ? 'скрыта' : 'показана'}` });
        loadForumTopics();
        setHideReason('');
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const getFilteredComplaints = () => {
    return complaints.filter(complaint => {
      const complaintDate = new Date(complaint.created_at);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      
      if (from && complaintDate < from) return false;
      if (to && complaintDate > to) return false;
      return true;
    });
  };

  const handlePrintComplaints = () => {
    const filteredComplaints = getFilteredComplaints();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const tableRows = filteredComplaints.map(complaint => {
      const date = new Date(complaint.created_at).toLocaleString('ru-RU');
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${date}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${complaint.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${complaint.phone || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${complaint.message}</td>
        </tr>
      `;
    }).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Книга жалоб</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Книга жалоб и предложений</h1>
        <p>ГБУЗ Антрацитовская центральная городская многопрофильная больница</p>
        ${dateFrom || dateTo ? `<p>Период: ${dateFrom || 'начало'} - ${dateTo || 'сегодня'}</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Текст жалобы</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleToggleTopicLock = async (topicId: number, lock: boolean) => {
    const action = lock ? 'lock' : 'unlock';
    
    try {
      const response = await fetch(`${API_URLS.forumModeration}/topics/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin123',
        },
        body: JSON.stringify({ topic_id: topicId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: "Успешно", description: data.message || `Тема ${lock ? 'заблокирована' : 'разблокирована'}` });
        loadForumTopics();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const handleToggleTopicPin = async (topicId: number, pin: boolean) => {
    const action = pin ? 'pin' : 'unpin';
    
    try {
      const response = await fetch(`${API_URLS.forumModeration}/topics/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin123',
        },
        body: JSON.stringify({ topic_id: topicId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({ title: "Успешно", description: data.message || `Тема ${pin ? 'закреплена' : 'откреплена'}` });
        loadForumTopics();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  const loadChats = async (silent = false) => {
    try {
      const response = await fetch(`${API_URLS.chat}?action=get-chats`);
      const data = await response.json();
      const newChats = data.chats || [];
      
      let hasNewMessages = false;
      const newCount = newChats.filter((chat: any) => {
        const prevCount = lastMessageCountRef.current[chat.id];
        const currentCount = chat.patient_message_count;
        
        if (prevCount !== undefined && currentCount > prevCount) {
          hasNewMessages = true;
          lastMessageCountRef.current[chat.id] = currentCount;
          return true;
        }
        return false;
      }).length;
      
      if (silent && hasNewMessages) {
        if (notificationSound) {
          notificationSound.play().catch(err => console.log('Sound play failed:', err));
        }
      }
      
      if (!silent) {
        setNewChatsCount(newCount);
      }
      
      setChats(newChats);
      setPreviousChatCount(newChats.length);
      setLastMessageCount({ ...lastMessageCountRef.current });
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadArchivedChats = async () => {
    try {
      const response = await fetch(`${API_URLS.chat}?action=get-chats&status=closed`);
      const data = await response.json();
      setArchivedChats(data.chats || []);
    } catch (error) {
      console.error('Failed to load archived chats:', error);
    }
  };

  const loadChatMessages = async (chatId: number, silent = false) => {
    try {
      const response = await fetch(`${API_URLS.chat}?action=get-messages&chat_id=${chatId}`);
      const data = await response.json();
      setChatMessages(data.messages || []);
      
      if (!silent) {
        const patientMessagesCount = data.messages.filter((m: any) => m.sender_type === 'patient').length;
        lastMessageCountRef.current = {
          ...lastMessageCountRef.current,
          [chatId]: patientMessagesCount
        };
        setLastMessageCount(prev => ({
          ...prev,
          [chatId]: patientMessagesCount
        }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendOperatorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorMessage.trim() || !selectedChat) return;

    try {
      const response = await fetch(API_URLS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          chat_id: selectedChat.id,
          sender_type: 'operator',
          sender_name: operatorName,
          message: operatorMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOperatorMessage('');
        loadChatMessages(selectedChat.id);
        loadChats();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось отправить сообщение", variant: "destructive" });
    }
  };

  const handleCloseChat = async (chatId: number) => {
    try {
      const response = await fetch(API_URLS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close-chat',
          chat_id: chatId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: "Успешно", description: "Чат закрыт" });
        setSelectedChat(null);
        loadChats();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось закрыть чат", variant: "destructive" });
    }
  };

  const exportChatToText = (chat: any, messages: any[]) => {
    const lines = [];
    lines.push('=' .repeat(60));
    lines.push('ИСТОРИЯ ЧАТА СЛУЖБЫ ПОДДЕРЖКИ');
    lines.push('ГБУЗ Антрацитовская ЦГМБ ЛНР');
    lines.push('=' .repeat(60));
    lines.push('');
    lines.push(`Пациент: ${chat.patient_name}`);
    lines.push(`Телефон: ${chat.patient_phone || 'Не указан'}`);
    lines.push(`Дата создания: ${new Date(chat.created_at).toLocaleString('ru-RU')}`);
    if (chat.status === 'closed') {
      lines.push(`Дата закрытия: ${new Date(chat.updated_at).toLocaleString('ru-RU')}`);
    }
    lines.push(`Статус: ${chat.status === 'active' ? 'Активен' : 'Закрыт'}`);
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('СООБЩЕНИЯ');
    lines.push('-'.repeat(60));
    lines.push('');
    
    if (messages.length === 0) {
      lines.push('Нет сообщений');
    } else {
      messages.forEach((msg: any, idx: number) => {
        lines.push(`[${new Date(msg.created_at).toLocaleString('ru-RU')}]`);
        lines.push(`${msg.sender_type === 'patient' ? 'Пациент' : 'Оператор'}: ${msg.sender_name}`);
        lines.push(msg.message);
        if (idx < messages.length - 1) {
          lines.push('');
        }
      });
    }
    
    lines.push('');
    lines.push('=' .repeat(60));
    lines.push(`Экспортировано: ${new Date().toLocaleString('ru-RU')}`);
    lines.push('=' .repeat(60));
    
    return lines.join('\n');
  };

  const handleExportChat = () => {
    if (!selectedChat || !chatMessages) return;
    
    const textContent = exportChatToText(selectedChat, chatMessages);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_${selectedChat.patient_name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Успешно", description: "Чат экспортирован в текстовый файл" });
  };

  const handleExportAllChats = async () => {
    const chatsToExport = showArchived ? archivedChats : chats;
    
    if (chatsToExport.length === 0) {
      toast({ title: "Ошибка", description: "Нет чатов для экспорта", variant: "destructive" });
      return;
    }
    
    const lines = [];
    lines.push('=' .repeat(80));
    lines.push('ЭКСПОРТ ВСЕХ ЧАТОВ СЛУЖБЫ ПОДДЕРЖКИ');
    lines.push('ГБУЗ Антрацитовская ЦГМБ ЛНР');
    lines.push('=' .repeat(80));
    lines.push('');
    lines.push(`Тип: ${showArchived ? 'Архивные чаты' : 'Активные чаты'}`);
    lines.push(`Всего чатов: ${chatsToExport.length}`);
    lines.push(`Дата экспорта: ${new Date().toLocaleString('ru-RU')}`);
    lines.push('');
    lines.push('=' .repeat(80));
    lines.push('');
    
    for (let i = 0; i < chatsToExport.length; i++) {
      const chat = chatsToExport[i];
      
      try {
        const response = await fetch(`${API_URLS.chat}?action=get-messages&chat_id=${chat.id}`);
        const data = await response.json();
        const messages = data.messages || [];
        
        lines.push('');
        lines.push(`ЧАТ ${i + 1} из ${chatsToExport.length}`);
        lines.push('');
        lines.push(exportChatToText(chat, messages));
        lines.push('');
        lines.push('');
        
        if (i < chatsToExport.length - 1) {
          lines.push('\n' + '═'.repeat(80) + '\n');
        }
      } catch (error) {
        lines.push(`Ошибка загрузки чата ${chat.patient_name}`);
        lines.push('');
      }
    }
    
    const textContent = lines.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = showArchived ? 'archived_chats' : 'active_chats';
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Успешно", description: `Экспортировано ${chatsToExport.length} чатов` });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Icon name="Shield" size={28} className="text-primary" />
              Вход в админ-панель
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
            <Icon name="Shield" size={32} className="text-primary" />
            <h1 className="text-xl font-bold">Панель администратора</h1>
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
          <Tabs defaultValue="doctors" className="w-full">
            <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-5 mb-8">
              <TabsTrigger value="doctors">Врачи</TabsTrigger>
              <TabsTrigger value="registrars">Регистраторы</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="forum">Форум</TabsTrigger>
              <TabsTrigger value="complaints">Жалобы</TabsTrigger>
            </TabsList>

            <TabsContent value="doctors">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Управление врачами</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить врача
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Добавить нового врача</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDoctor} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">ФИО врача *</label>
                      <Input
                        value={doctorForm.full_name}
                        onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Телефон</label>
                      <Input
                        value={doctorForm.phone}
                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Должность *</label>
                      <Input
                        value={doctorForm.position}
                        onChange={(e) => setDoctorForm({ ...doctorForm, position: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Специализация</label>
                      <Input
                        value={doctorForm.specialization}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Учебное заведение</label>
                      <Input
                        value={doctorForm.education}
                        onChange={(e) => setDoctorForm({ ...doctorForm, education: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Стаж работы (лет)</label>
                      <Input
                        type="number"
                        value={doctorForm.work_experience}
                        onChange={(e) => setDoctorForm({ ...doctorForm, work_experience: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Номер кабинета</label>
                      <Input
                        value={doctorForm.office_number}
                        onChange={(e) => setDoctorForm({ ...doctorForm, office_number: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Поликлиника</label>
                    <Select 
                      value={doctorForm.clinic} 
                      onValueChange={(value) => setDoctorForm({ ...doctorForm, clinic: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Выберите поликлинику" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Центральная городская поликлиника">
                          Центральная городская поликлиника
                        </SelectItem>
                        <SelectItem value="Детская городская поликлиника">
                          Детская городская поликлиника
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Логин *</label>
                      <Input
                        value={doctorForm.login}
                        onChange={(e) => setDoctorForm({ ...doctorForm, login: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Пароль *</label>
                      <Input
                        type="password"
                        value={doctorForm.password}
                        onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Фотография врача</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      {doctorForm.photo_url ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={doctorForm.photo_url} 
                            alt="Предпросмотр" 
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDoctorForm({ ...doctorForm, photo_url: '' })}
                          >
                            <Icon name="Trash2" size={14} className="mr-1" />
                            Удалить
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Icon name="Upload" size={24} className="text-muted-foreground" />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
                              <span>
                                {isUploading ? 'Загрузка...' : 'Выбрать файл'}
                              </span>
                            </Button>
                          </label>
                          <Input
                            placeholder="или URL"
                            value={doctorForm.photo_url}
                            onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                            className="h-9 max-w-[200px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-9">Создать врача</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Редактировать врача</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateDoctor} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">ФИО врача *</label>
                      <Input
                        value={doctorForm.full_name}
                        onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Телефон</label>
                      <Input
                        value={doctorForm.phone}
                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Должность *</label>
                      <Input
                        value={doctorForm.position}
                        onChange={(e) => setDoctorForm({ ...doctorForm, position: e.target.value })}
                        required
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Специализация</label>
                      <Input
                        value={doctorForm.specialization}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Учебное заведение</label>
                      <Input
                        value={doctorForm.education}
                        onChange={(e) => setDoctorForm({ ...doctorForm, education: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Стаж работы (лет)</label>
                      <Input
                        type="number"
                        value={doctorForm.work_experience}
                        onChange={(e) => setDoctorForm({ ...doctorForm, work_experience: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Номер кабинета</label>
                      <Input
                        value={doctorForm.office_number}
                        onChange={(e) => setDoctorForm({ ...doctorForm, office_number: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Поликлиника</label>
                    <Select 
                      value={doctorForm.clinic} 
                      onValueChange={(value) => setDoctorForm({ ...doctorForm, clinic: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Выберите поликлинику" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Центральная городская поликлиника">
                          Центральная городская поликлиника
                        </SelectItem>
                        <SelectItem value="Детская городская поликлиника">
                          Детская городская поликлиника
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Фотография врача</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      {doctorForm.photo_url ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={doctorForm.photo_url} 
                            alt="Предпросмотр" 
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDoctorForm({ ...doctorForm, photo_url: '' })}
                          >
                            <Icon name="Trash2" size={14} className="mr-1" />
                            Удалить
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Icon name="Upload" size={24} className="text-muted-foreground" />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
                              <span>
                                {isUploading ? 'Загрузка...' : 'Выбрать файл'}
                              </span>
                            </Button>
                          </label>
                          <Input
                            placeholder="или URL"
                            value={doctorForm.photo_url}
                            onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                            className="h-9 max-w-[200px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Новый пароль (оставьте пустым)</label>
                    <Input
                      type="password"
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <Button type="submit" className="w-full h-9">Сохранить изменения</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {['Центральная городская поликлиника', 'Детская городская поликлиника'].map(clinic => {
            const clinicDoctors = doctors.filter((d: any) => d.clinic === clinic);
            if (clinicDoctors.length === 0) return null;
            
            return (
              <div key={clinic} className="mb-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon name={clinic.includes('Детская') ? 'Baby' : 'Building2'} size={28} className="text-primary" />
                  {clinic}
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Фото</TableHead>
                          <TableHead>ФИО</TableHead>
                          <TableHead>Должность</TableHead>
                          <TableHead>Специализация</TableHead>
                          <TableHead className="w-[80px] text-center">Кабинет</TableHead>
                          <TableHead className="w-[80px] text-center">Стаж</TableHead>
                          <TableHead className="w-[120px] text-center">Статус</TableHead>
                          <TableHead className="w-[140px] text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clinicDoctors.map((doctor: any) => (
                          <TableRow key={doctor.id} className={!doctor.is_active ? 'opacity-50' : ''}>
                            <TableCell>
                              {doctor.photo_url ? (
                                <img 
                                  src={doctor.photo_url} 
                                  alt={doctor.full_name} 
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Icon name="User" size={20} className="text-primary" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{doctor.full_name}</TableCell>
                            <TableCell>{doctor.position}</TableCell>
                            <TableCell>{doctor.specialization || '—'}</TableCell>
                            <TableCell className="text-center">{doctor.office_number || '—'}</TableCell>
                            <TableCell className="text-center">{doctor.work_experience ? `${doctor.work_experience} лет` : '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleStatus(doctor.id, !doctor.is_active)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    doctor.is_active ? 'bg-primary' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      doctor.is_active ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                  doctor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {doctor.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openEditDialog(doctor)}
                                  title="Редактировать"
                                >
                                  <Icon name="Edit" size={16} />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleDeleteDoctor(doctor.id)}
                                  disabled={!doctor.is_active}
                                  title="Удалить"
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="registrars">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Управление регистраторами</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedRegistrarForLogs({ full_name: 'Все регистраторы' });
                  loadRegistrarLogs();
                }}
              >
                <Icon name="FileText" size={18} className="mr-2" />
                Общий журнал
              </Button>
              <Dialog open={isRegistrarOpen} onOpenChange={setIsRegistrarOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Icon name="UserPlus" size={18} className="mr-2" />
                  Добавить регистратора
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Новый регистратор</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateRegistrar} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">ФИО</label>
                    <Input
                      value={registrarForm.full_name}
                      onChange={(e) => setRegistrarForm({...registrarForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Телефон</label>
                    <Input
                      value={registrarForm.phone}
                      onChange={(e) => setRegistrarForm({...registrarForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Логин</label>
                    <Input
                      value={registrarForm.login}
                      onChange={(e) => setRegistrarForm({...registrarForm, login: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Пароль</label>
                    <Input
                      type="password"
                      value={registrarForm.password}
                      onChange={(e) => setRegistrarForm({...registrarForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Поликлиника</label>
                    <Select 
                      value={registrarForm.clinic} 
                      onValueChange={(value) => setRegistrarForm({...registrarForm, clinic: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Центральная городская поликлиника">
                          Центральная городская поликлиника
                        </SelectItem>
                        <SelectItem value="Детская городская поликлиника">
                          Детская городская поликлиника
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Создать</Button>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            {registrars.map((registrar: any) => (
              <Card key={registrar.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {registrar.full_name}
                        {registrar.is_blocked && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Заблокирован
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {registrar.clinic}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRegistrarForLogs(registrar);
                          loadRegistrarLogs(registrar.id);
                        }}
                      >
                        <Icon name="FileText" size={16} className="mr-1" />
                        Журнал
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRegistrar(registrar);
                          setRegistrarForm({
                            full_name: registrar.full_name,
                            phone: registrar.phone,
                            login: registrar.login,
                            password: '',
                            clinic: registrar.clinic
                          });
                          setIsRegistrarEditOpen(true);
                        }}
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant={registrar.is_blocked ? "default" : "destructive"}
                        onClick={() => handleToggleRegistrarBlock(registrar.id, registrar.is_blocked)}
                      >
                        <Icon name={registrar.is_blocked ? "Unlock" : "Lock"} size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRegistrar(registrar.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Телефон:</span>
                      <p className="font-medium">{registrar.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Логин:</span>
                      <p className="font-medium">{registrar.login}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={isRegistrarEditOpen} onOpenChange={setIsRegistrarEditOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Редактировать регистратора</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateRegistrar} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">ФИО</label>
                  <Input
                    value={registrarForm.full_name}
                    onChange={(e) => setRegistrarForm({...registrarForm, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    value={registrarForm.phone}
                    onChange={(e) => setRegistrarForm({...registrarForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Логин</label>
                  <Input
                    value={registrarForm.login}
                    onChange={(e) => setRegistrarForm({...registrarForm, login: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Новый пароль (оставьте пустым, если не меняете)</label>
                  <Input
                    type="password"
                    value={registrarForm.password}
                    onChange={(e) => setRegistrarForm({...registrarForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Поликлиника</label>
                  <Select 
                    value={registrarForm.clinic} 
                    onValueChange={(value) => setRegistrarForm({...registrarForm, clinic: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Центральная городская поликлиника">
                        Центральная городская поликлиника
                      </SelectItem>
                      <SelectItem value="Детская городская поликлиника">
                        Детская городская поликлиника
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Сохранить</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!selectedRegistrarForLogs} onOpenChange={() => {
            setSelectedRegistrarForLogs(null);
            setLogFilterType('all');
            setLogFilterText('');
            setLogFilterDateFrom('');
            setLogFilterDateTo('');
          }}>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Icon name="FileText" size={24} className="text-primary" />
                  Журнал действий: {selectedRegistrarForLogs?.full_name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="pb-3 border-b">
                <div className="flex gap-2 items-center justify-between flex-wrap">
                  <div className="flex gap-2 items-center flex-wrap">
                    <Select value={logFilterType} onValueChange={setLogFilterType}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Тип операции" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все операции</SelectItem>
                        {getUniqueActionTypes().map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Поиск..."
                      value={logFilterText}
                      onChange={(e) => setLogFilterText(e.target.value)}
                      className="w-[150px] h-8 text-xs"
                    />
                    
                    <div className="flex items-center gap-1">
                      <label className="text-xs whitespace-nowrap">с:</label>
                      <Input
                        type="date"
                        value={logFilterDateFrom}
                        onChange={(e) => setLogFilterDateFrom(e.target.value)}
                        className="w-[145px] h-8 text-xs"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <label className="text-xs whitespace-nowrap">по:</label>
                      <Input
                        type="date"
                        value={logFilterDateTo}
                        onChange={(e) => setLogFilterDateTo(e.target.value)}
                        className="w-[145px] h-8 text-xs"
                      />
                    </div>
                    
                    {(logFilterType !== 'all' || logFilterText || logFilterDateFrom || logFilterDateTo) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLogFilterType('all');
                          setLogFilterText('');
                          setLogFilterDateFrom('');
                          setLogFilterDateTo('');
                        }}
                        className="h-8 text-xs"
                      >
                        <Icon name="X" size={12} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <div className="text-xs text-muted-foreground">
                      Найдено: {getFilteredLogs().length} из {registrarLogs.length}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={exportLogsToExcel}
                      className="h-8 text-xs bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="FileSpreadsheet" size={14} className="mr-1" />
                      Экспорт
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={printLogs}
                      className="h-8 text-xs"
                    >
                      <Icon name="Printer" size={14} className="mr-1" />
                      Печать
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {getFilteredLogs().length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Icon name="Search" size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Записей не найдено</p>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="text-left py-1.5 px-2 w-10 text-xs font-medium">№</th>
                        <th className="text-left py-1.5 px-2 w-20 text-xs font-medium">Дата</th>
                        <th className="text-left py-1.5 px-2 w-16 text-xs font-medium">Время</th>
                        <th className="text-left py-1.5 px-2 w-24 text-xs font-medium">Логин</th>
                        <th className="text-left py-1.5 px-2 w-32 text-xs font-medium">Тип операции</th>
                        <th className="text-left py-1.5 px-2 text-xs font-medium">Описание</th>
                        <th className="text-left py-1.5 px-2 w-28 text-xs font-medium">IP</th>
                        <th className="text-left py-1.5 px-2 w-32 text-xs font-medium">Устройство</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredLogs().map((log: any, index: number) => {
                        const date = new Date(log.created_at);
                        let detailsObj: any = {};
                        try {
                          detailsObj = JSON.parse(log.details || '{}');
                        } catch (e) {
                          detailsObj = { raw: log.details };
                        }
                        
                        const formatDetails = () => {
                          const parts = [];
                          if (detailsObj.patient_name) parts.push(`Пациент: ${detailsObj.patient_name}`);
                          if (detailsObj.patient_phone) parts.push(`Тел: ${detailsObj.patient_phone}`);
                          if (detailsObj.doctor_name) parts.push(`Врач: ${detailsObj.doctor_name}`);
                          if (detailsObj.appointment_date) parts.push(`Дата: ${new Date(detailsObj.appointment_date + 'T00:00:00').toLocaleDateString('ru-RU')}`);
                          if (detailsObj.appointment_time) parts.push(`Время: ${detailsObj.appointment_time.slice(0, 5)}`);
                          if (detailsObj.old_date && detailsObj.new_date) {
                            parts.push(`${new Date(detailsObj.old_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.old_time?.slice(0, 5)} → ${new Date(detailsObj.new_date + 'T00:00:00').toLocaleDateString('ru-RU')} ${detailsObj.new_time?.slice(0, 5)}`);
                          }
                          if (detailsObj.raw) parts.push(detailsObj.raw);
                          return parts.join(' • ');
                        };

                        return (
                          <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-1.5 px-2 text-muted-foreground">{index + 1}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap">
                              {date.toLocaleDateString('ru-RU')}
                            </td>
                            <td className="py-1.5 px-2 whitespace-nowrap">
                              {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-1.5 px-2 whitespace-nowrap">
                              <span className="text-[10px] font-medium">{log.user_login || '—'}</span>
                            </td>
                            <td className="py-1.5 px-2">
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-muted-foreground">
                              {formatDetails() || '—'}
                              {log.registrar_name && (
                                <span className="ml-2 text-[10px] opacity-60">({log.registrar_name})</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-[10px] text-muted-foreground">
                              {log.ip_address || '—'}
                            </td>
                            <td className="py-1.5 px-2 text-[10px] text-muted-foreground max-w-[200px] truncate" title={log.computer_name || '—'}>
                              {log.computer_name || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="faq">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Управление FAQ</h2>
            <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить вопрос
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Добавить новый вопрос</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFaq} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Вопрос</label>
                    <Input
                      placeholder="Введите вопрос"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ответ</label>
                    <Textarea
                      placeholder="Введите ответ"
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      required
                      rows={6}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL изображения (необязательно)</label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={faqForm.image_url}
                      onChange={(e) => setFaqForm({ ...faqForm, image_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Порядок отображения</label>
                    <Input
                      type="number"
                      value={faqForm.display_order}
                      onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Создать вопрос</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isFaqEditOpen} onOpenChange={setIsFaqEditOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Редактировать вопрос</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateFaq} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Вопрос</label>
                    <Input
                      placeholder="Введите вопрос"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ответ</label>
                    <Textarea
                      placeholder="Введите ответ"
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      required
                      rows={6}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL изображения (необязательно)</label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={faqForm.image_url}
                      onChange={(e) => setFaqForm({ ...faqForm, image_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Порядок отображения</label>
                    <Input
                      type="number"
                      value={faqForm.display_order}
                      onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Сохранить изменения</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-1 gap-4">
            {faqs.map((faq: any) => (
              <Card key={faq.id} className={!faq.is_active ? 'opacity-50' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                  {faq.image_url && (
                    <img 
                      src={faq.image_url} 
                      alt={faq.question}
                      className="w-full max-w-md rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex items-center justify-between mt-3 p-3 bg-muted/30 rounded">
                    <span className="text-sm font-medium">Статус:</span>
                    <button
                      onClick={() => handleToggleFaqStatus(faq.id, !faq.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        faq.is_active ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          faq.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      faq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {faq.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditFaqDialog(faq)}
                      className="flex-1"
                    >
                      <Icon name="Edit" size={14} className="mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="flex-1"
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forum">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Пользователи форума</h2>
              {forumUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет зарегистрированных пользователей
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {forumUsers.map((user: any) => (
                    <Card key={user.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{user.username}</CardTitle>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>Тем: {user.topics_count || 0}</span>
                              <span>•</span>
                              <span>Сообщений: {user.posts_count || 0}</span>
                              <span>•</span>
                              <span>Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user.is_blocked ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(user.id)}
                              >
                                <Icon name="Unlock" size={14} className="mr-1" />
                                Разблокировать
                              </Button>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Icon name="Ban" size={14} className="mr-1" />
                                    Заблокировать
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Блокировка пользователя {user.username}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="Причина блокировки"
                                      value={blockReason}
                                      onChange={(e) => setBlockReason(e.target.value)}
                                      rows={3}
                                    />
                                    <Button
                                      onClick={() => handleBlockUser(user.id, blockReason)}
                                      className="w-full"
                                    >
                                      Заблокировать
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                        {user.is_blocked && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Заблокирован:</strong> {user.blocked_reason || 'Причина не указана'}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {new Date(user.blocked_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Темы форума</h2>
              {forumTopics.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет созданных тем
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {forumTopics.map((topic: any) => (
                    <Card key={topic.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{topic.title}</CardTitle>
                              {topic.is_pinned && (
                                <Icon name="Pin" size={16} className="text-primary" />
                              )}
                              {topic.is_locked && (
                                <Icon name="Lock" size={16} className="text-yellow-600" />
                              )}
                              {topic.is_hidden && (
                                <Icon name="EyeOff" size={16} className="text-red-600" />
                              )}
                            </div>
                            {topic.description && (
                              <p className="text-sm text-muted-foreground">{topic.description}</p>
                            )}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>Автор: {topic.author_username || 'Удален'}</span>
                              <span>•</span>
                              <span>Просмотров: {topic.views_count || 0}</span>
                              <span>•</span>
                              <span>Сообщений: {topic.posts_count || 0}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant={topic.is_pinned ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleTopicPin(topic.id, !topic.is_pinned)}
                              >
                                <Icon name="Pin" size={14} className="mr-1" />
                                {topic.is_pinned ? 'Открепить' : 'Закрепить'}
                              </Button>
                              <Button
                                variant={topic.is_locked ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleTopicLock(topic.id, !topic.is_locked)}
                              >
                                <Icon name={topic.is_locked ? "Unlock" : "Lock"} size={14} className="mr-1" />
                                {topic.is_locked ? 'Разблокировать' : 'Заблокировать'}
                              </Button>
                            </div>
                            {topic.is_hidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleTopicVisibility(topic.id, false)}
                              >
                                <Icon name="Eye" size={14} className="mr-1" />
                                Показать
                              </Button>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Icon name="EyeOff" size={14} className="mr-1" />
                                    Скрыть
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Скрыть тему</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="Причина скрытия"
                                      value={hideReason}
                                      onChange={(e) => setHideReason(e.target.value)}
                                      rows={3}
                                    />
                                    <Button
                                      onClick={() => handleToggleTopicVisibility(topic.id, true)}
                                      className="w-full"
                                    >
                                      Скрыть тему
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="complaints">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Книга жалоб и предложений</h2>
              <Button onClick={handlePrintComplaints}>
                <Icon name="Printer" size={20} className="mr-2" />
                Печать отчета
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Фильтр по датам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">С даты</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">По дату</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Сбросить фильтр
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {getFilteredComplaints().length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Жалобы не найдены</p>
                  </CardContent>
                </Card>
              ) : (
                getFilteredComplaints().map((complaint: any) => (
                  <Card key={complaint.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{complaint.name}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon name="Mail" size={14} />
                              {complaint.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon name="Phone" size={14} />
                              {complaint.phone || 'Не указан'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon name="Calendar" size={14} />
                              {new Date(complaint.created_at).toLocaleString('ru-RU')}
                            </div>
                          </CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          complaint.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          complaint.status === 'processed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {complaint.status === 'new' ? 'Новая' :
                           complaint.status === 'processed' ? 'Обработана' : complaint.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{complaint.message}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {getFilteredComplaints().length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Всего жалоб: {getFilteredComplaints().length}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Admin;