import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
  doctors: 'https://functions.poehali.dev/68f877b2-aeda-437a-ad67-925a3414d688',
  faq: 'https://functions.poehali.dev/fb5160e8-f170-4c21-97a9-3afbcb6f78a9',
  userQuestions: 'https://functions.poehali.dev/816ff0e8-3dcc-4eeb-a985-36603a12894c',
  forumModeration: 'https://functions.poehali.dev/70286923-439c-45b7-9744-403f0827a0c1',
  complaints: 'https://functions.poehali.dev/a6c04c63-0223-4bcc-b146-24acdef33536',
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
    photo_url: ''
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
  const [userQuestions, setUserQuestions] = useState([]);
  const [newQuestionsCount, setNewQuestionsCount] = useState(0);
  const [forumUsers, setForumUsers] = useState([]);
  const [forumTopics, setForumTopics] = useState([]);
  const [blockReason, setBlockReason] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth) {
      setIsAuthenticated(true);
      loadDoctors();
      loadFaqs();
      loadUserQuestions();
      loadForumUsers();
      loadForumTopics();
      loadComplaints();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadUserQuestions(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
        setDoctorForm({ full_name: '', phone: '', position: '', specialization: '', login: '', password: '', photo_url: '' });
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
        setDoctorForm({ full_name: '', phone: '', position: '', specialization: '', login: '', password: '', photo_url: '' });
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
      photo_url: doctor.photo_url || ''
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

  const loadUserQuestions = async (silent = false) => {
    try {
      const response = await fetch(API_URLS.userQuestions);
      const data = await response.json();
      const questions = data.questions || [];
      const pendingCount = questions.filter((q: any) => q.status === 'pending').length;
      
      if (silent && pendingCount > newQuestionsCount && newQuestionsCount > 0) {
        toast({
          title: "Новые вопросы!",
          description: `У вас ${pendingCount} ${pendingCount === 1 ? 'новый вопрос' : pendingCount < 5 ? 'новых вопроса' : 'новых вопросов'}`,
        });
      }
      
      setUserQuestions(questions);
      setNewQuestionsCount(pendingCount);
    } catch (error) {
      if (!silent) {
        toast({ title: "Ошибка", description: "Не удалось загрузить вопросы", variant: "destructive" });
      }
    }
  };

  const handleDeleteUserQuestion = async (id: number) => {
    if (!confirm('Удалить этот вопрос пользователя?')) return;
    
    try {
      const response = await fetch(`${API_URLS.userQuestions}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({ title: "Успешно", description: "Вопрос удален" });
        loadUserQuestions();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось удалить вопрос", variant: "destructive" });
    }
  };

  const handleUpdateQuestionStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(API_URLS.userQuestions, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      
      if (response.ok) {
        toast({ title: "Успешно", description: `Статус изменен на: ${status}` });
        loadUserQuestions();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось изменить статус", variant: "destructive" });
    }
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
          <td style="border: 1px solid #ddd; padding: 8px;">${complaint.email}</td>
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
              <th>Email</th>
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
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 mb-8">
              <TabsTrigger value="doctors">Врачи</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="questions" className="relative">
                Вопросы
                {newQuestionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newQuestionsCount}
                  </span>
                )}
              </TabsTrigger>
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Добавить нового врача</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateDoctor} className="space-y-4">
                  <Input
                    placeholder="ФИО врача"
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Телефон"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Должность"
                    value={doctorForm.position}
                    onChange={(e) => setDoctorForm({ ...doctorForm, position: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Специализация"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  />
                  <Input
                    placeholder="Логин для входа"
                    value={doctorForm.login}
                    onChange={(e) => setDoctorForm({ ...doctorForm, login: e.target.value })}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    required
                  />
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Фотография врача</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      {doctorForm.photo_url ? (
                        <div className="space-y-3">
                          <img 
                            src={doctorForm.photo_url} 
                            alt="Предпросмотр" 
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
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
                            Удалить фото
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Icon name="Upload" size={40} className="mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Перетащите изображение сюда</p>
                            <p className="text-xs text-muted-foreground">или</p>
                          </div>
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
                          <p className="text-xs text-muted-foreground">До 5 МБ, JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Или введите URL изображения"
                      value={doctorForm.photo_url}
                      onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Создать врача</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Редактировать врача</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateDoctor} className="space-y-4">
                  <Input
                    placeholder="ФИО врача"
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Телефон"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Должность"
                    value={doctorForm.position}
                    onChange={(e) => setDoctorForm({ ...doctorForm, position: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Специализация"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  />
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Фотография врача</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      {doctorForm.photo_url ? (
                        <div className="space-y-3">
                          <img 
                            src={doctorForm.photo_url} 
                            alt="Предпросмотр" 
                            className="w-32 h-32 object-cover rounded-lg mx-auto"
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
                            Удалить фото
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Icon name="Upload" size={40} className="mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Перетащите изображение сюда</p>
                            <p className="text-xs text-muted-foreground">или</p>
                          </div>
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
                          <p className="text-xs text-muted-foreground">До 5 МБ, JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Или введите URL изображения"
                      value={doctorForm.photo_url}
                      onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                    />
                  </div>
                  <Input
                    type="password"
                    placeholder="Новый пароль (оставьте пустым, чтобы не менять)"
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  />
                  <Button type="submit" className="w-full">Сохранить изменения</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor: any) => (
              <Card key={doctor.id} className={!doctor.is_active ? 'opacity-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                      <Icon name="User" size={20} className="text-primary" />
                    )}
                    {doctor.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Должность:</strong> {doctor.position}</p>
                  {doctor.specialization && <p className="text-sm"><strong>Специализация:</strong> {doctor.specialization}</p>}
                  {doctor.phone && <p className="text-sm"><strong>Телефон:</strong> {doctor.phone}</p>}
                  <p className="text-sm"><strong>Логин:</strong> {doctor.login}</p>
                  <div className="flex items-center justify-between mt-3 p-3 bg-muted/30 rounded">
                    <span className="text-sm font-medium">Статус:</span>
                    <button
                      onClick={() => handleToggleStatus(doctor.id, !doctor.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        doctor.is_active ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          doctor.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      doctor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {doctor.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(doctor)}
                      className="flex-1"
                    >
                      <Icon name="Edit" size={14} className="mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteDoctor(doctor.id)}
                      className="flex-1"
                      disabled={!doctor.is_active}
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

        <TabsContent value="questions">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Вопросы пользователей</h2>
            <Button variant="outline" onClick={loadUserQuestions}>
              <Icon name="RefreshCw" size={18} className="mr-2" />
              Обновить
            </Button>
          </div>

          {userQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Нет вопросов от пользователей</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userQuestions.map((q: any) => (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">От: {q.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(q.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.status}
                          onChange={(e) => handleUpdateQuestionStatus(q.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded border"
                        >
                          <option value="pending">Ожидает</option>
                          <option value="answered">Отвечено</option>
                          <option value="archived">В архиве</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-sm font-medium mb-1">Вопрос:</p>
                      <p className="text-base">{q.question}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUserQuestion(q.id)}
                      >
                        <Icon name="Trash2" size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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