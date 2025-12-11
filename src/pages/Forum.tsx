import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/5453d7ba-4709-4da4-9761-5372c5aa776a',
  topics: 'https://functions.poehali.dev/e1e111a6-e824-4bf1-9416-b5c145b37906',
  posts: 'https://functions.poehali.dev/0352645c-ae3d-4c45-8081-4f7a347244a6',
  smsVerify: 'https://functions.poehali.dev/7ea5c6f5-d200-4cc0-b34b-10144a995d69',
};

const Forum = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { topicId } = useParams();
  
  const [topics, setTopics] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '', phone: '' });
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'form' | 'code' | 'verified'>('form');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [verifyForm, setVerifyForm] = useState({ user_id: '', code: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [newTopicForm, setNewTopicForm] = useState({ title: '', description: '' });
  const [newPostContent, setNewPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostImages, setEditPostImages] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    if (topicId) {
      loadTopic(topicId);
      loadPosts(topicId);
    } else {
      loadTopics();
    }
  }, [topicId]);

  const checkAuth = () => {
    const token = localStorage.getItem('forum_token');
    const userData = localStorage.getItem('forum_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URLS.topics);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopic = async (id: string) => {
    try {
      const response = await fetch(`${API_URLS.topics}?id=${id}`);
      const data = await response.json();
      setCurrentTopic(data.topic);
    } catch (error) {
      console.error('Failed to load topic:', error);
    }
  };

  const loadPosts = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URLS.posts}?topic_id=${id}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация перед отправкой SMS
    if (!registerForm.username || !registerForm.password || !registerForm.phone) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    // Проверка формата email (если указан)
    if (registerForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        toast({
          title: "Ошибка",
          description: "Введите корректный email адрес",
          variant: "destructive",
        });
        return;
      }
    }

    // Проверка длины пароля
    if (registerForm.password.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    // Проверка имени пользователя
    if (registerForm.username.length < 3) {
      toast({
        title: "Ошибка",
        description: "Имя пользователя должно содержать минимум 3 символа",
        variant: "destructive",
      });
      return;
    }

    // Проверяем, не занят ли email (если указан)
    setIsSubmitting(true);
    
    try {
      if (registerForm.email) {
        const checkResponse = await fetch(API_URLS.auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'check_email',
            email: registerForm.email 
          }),
        });

        const checkData = await checkResponse.json();

        if (!checkResponse.ok || (checkData.exists)) {
          toast({
            title: "Ошибка",
            description: "Этот email уже зарегистрирован",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Если все проверки пройдены - отправляем SMS
      const response = await fetch(API_URLS.smsVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send',
          phone_number: registerForm.phone 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.show_code) {
          toast({
            title: "Ваш код верификации",
            description: `Код: ${data.show_code}. Не удалось отправить в MAX, используйте этот код для подтверждения.`,
            duration: 0,
          });
        } else {
          toast({
            title: "Код отправлен в MAX",
            description: `Проверьте сообщения в мессенджере MAX на номере ${registerForm.phone}`,
            duration: 10000,
          });
        }
        setPhoneVerificationStep('code');
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось отправить код",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URLS.smsVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify',
          phone_number: registerForm.phone,
          code: phoneVerificationCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPhoneVerificationStep('verified');
        toast({
          title: "Телефон подтвержден",
          description: "Теперь можно завершить регистрацию",
        });
      } else {
        toast({
          title: "Неверный код",
          description: data.error || "Проверьте введенный код и попробуйте снова",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneVerificationStep !== 'verified') {
      toast({
        title: "Требуется верификация телефона",
        description: "Сначала подтвердите номер телефона",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('forum_token', data.token);
        localStorage.setItem('forum_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsRegisterOpen(false);
        
        toast({
          title: "Регистрация успешна!",
          description: `Добро пожаловать, ${data.user.username}!`,
        });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось зарегистрироваться",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', ...verifyForm }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('forum_token', data.token);
        localStorage.setItem('forum_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsVerifyOpen(false);
        
        toast({
          title: "Email подтвержден!",
          description: "Добро пожаловать на форум!",
        });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Неверный код",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('forum_token', data.token);
        localStorage.setItem('forum_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoginOpen(false);
        
        toast({
          title: "Вход выполнен!",
          description: `Добро пожаловать, ${data.user.username}!`,
        });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Неверный email или пароль",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('forum_token');
    localStorage.removeItem('forum_user');
    setUser(null);
    toast({
      title: "Выход выполнен",
      description: "До встречи!",
    });
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem('forum_token');

    try {
      const response = await fetch(API_URLS.topics, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Token': token || '',
        },
        body: JSON.stringify(newTopicForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Тема создана!",
          description: "Ваша тема появилась на форуме",
        });
        setNewTopicForm({ title: '', description: '' });
        setIsNewTopicOpen(false);
        loadTopics();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать тему",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) {
      toast({
        title: "Ошибка",
        description: "Сообщение не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('forum_token');

    try {
      const response = await fetch(API_URLS.posts, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Token': token || '',
        },
        body: JSON.stringify({
          topic_id: topicId,
          content: newPostContent,
          images: postImages,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Сообщение отправлено!",
          description: "Ваш ответ опубликован",
        });
        setNewPostContent('');
        setPostImages([]);
        loadPosts(topicId!);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось отправить сообщение",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Можно загружать только изображения",
        variant: "destructive",
      });
      return;
    }

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPostImages(prev => [...prev, base64]);
      setImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditImage = (index: number) => {
    setEditPostImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content);
    setEditPostImages(post.images ? JSON.parse(post.images) : []);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditPostContent('');
    setEditPostImages([]);
  };

  const handleUpdatePost = async (postId: number) => {
    if (!editPostContent.trim()) {
      toast({
        title: "Ошибка",
        description: "Сообщение не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('forum_token');

    try {
      const response = await fetch(API_URLS.posts, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Token': token || '',
        },
        body: JSON.stringify({
          id: postId,
          content: editPostContent,
          images: editPostImages,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Сообщение обновлено!",
          description: "Изменения сохранены",
        });
        setEditingPostId(null);
        setEditPostContent('');
        setEditPostImages([]);
        loadPosts(topicId!);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось обновить сообщение",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) {
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('forum_token');

    try {
      const response = await fetch(`${API_URLS.posts}?id=${postId}`, {
        method: 'DELETE',
        headers: { 
          'X-User-Token': token || '',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Сообщение удалено",
          description: "Ваше сообщение было удалено",
        });
        loadPosts(topicId!);
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось удалить сообщение",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Можно загружать только изображения",
        variant: "destructive",
      });
      return;
    }

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setEditPostImages(prev => [...prev, base64]);
      setImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/files/d1c15da6-7ffe-46bb-b5db-3d114b408cec.jpg" 
              alt="Логотип АЦГМБ ЛНР" 
              className="w-12 h-12 object-contain mix-blend-multiply"
            />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">ГБУЗ "АЦГМБ" ЛНР</p>
              <h1 className="text-sm font-bold text-primary leading-tight">
                {topicId ? 'Обсуждение' : 'Форум пациентов'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
            
            {topicId && (
              <Button variant="outline" size="sm" onClick={() => navigate('/forum')}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                К темам
              </Button>
            )}
            
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Привет, <strong>{user.username}</strong>!
                </span>
                <Button variant="outline" onClick={handleLogout} size="sm">
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Выход
                </Button>
              </>
            ) : (
              <>
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Icon name="LogIn" size={16} className="mr-2" />
                      Вход
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Вход на форум</DialogTitle>
                      <DialogDescription>
                        Войдите с помощью email и пароля
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        placeholder="Пароль"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Вход...' : 'Войти'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRegisterOpen} onOpenChange={(open) => {
                  setIsRegisterOpen(open);
                  if (!open) {
                    setPhoneVerificationStep('form');
                    setPhoneVerificationCode('');
                    setRegisterForm({ email: '', username: '', password: '', phone: '' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Icon name="UserPlus" size={16} className="mr-2" />
                      Регистрация
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Регистрация на форуме</DialogTitle>
                      <DialogDescription>
                        Создайте аккаунт для участия в обсуждениях
                      </DialogDescription>
                    </DialogHeader>
                    {phoneVerificationStep === 'form' && (
                      <form onSubmit={handleSendPhoneCode} className="space-y-4">
                        <Input
                          type="text"
                          placeholder="Имя пользователя"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          required
                        />
                        <Input
                          type="password"
                          placeholder="Пароль"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Email (необязательно)"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        />
                        <Input
                          type="tel"
                          placeholder="Телефон (+79991234567)"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          required
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Отправка кода...' : 'Отправить код в MAX'}
                        </Button>
                      </form>
                    )}

                    {phoneVerificationStep === 'code' && (
                      <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Icon name="Info" size={24} className="text-blue-600 mt-1" />
                              <div>
                                <p className="font-medium text-blue-900 mb-1">Проверьте MAX</p>
                                <p className="text-sm text-blue-700">
                                  Код отправлен в мессенджер MAX на ваш номер. Введите полученный код.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Input
                          placeholder="Введите 6-значный код"
                          value={phoneVerificationCode}
                          onChange={(e) => setPhoneVerificationCode(e.target.value)}
                          required
                          maxLength={6}
                          pattern="[0-9]{6}"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Проверка...' : 'Подтвердить'}
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPhoneVerificationStep('form');
                              setPhoneVerificationCode('');
                            }}
                          >
                            Назад
                          </Button>
                        </div>
                      </form>
                    )}

                    {phoneVerificationStep === 'verified' && (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                              <Icon name="CheckCircle" size={20} className="text-green-600" />
                              <p className="font-medium text-green-900">Телефон подтвержден</p>
                            </div>
                          </CardContent>
                        </Card>
                        <div className="space-y-2 text-sm">
                          <p><strong>Email:</strong> {registerForm.email}</p>
                          <p><strong>Имя пользователя:</strong> {registerForm.username}</p>
                          <p><strong>Телефон:</strong> {registerForm.phone}</p>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'Регистрация...' : 'Завершить регистрацию'}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!topicId ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold">Темы форума</h2>
                <p className="text-muted-foreground mt-1">
                  Обсуждайте вопросы здоровья с другими пациентами
                </p>
              </div>
              
              {user && (
                <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="Plus" size={20} className="mr-2" />
                      Создать тему
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новая тема</DialogTitle>
                      <DialogDescription>
                        Создайте новую тему для обсуждения
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                      <Input
                        placeholder="Заголовок темы"
                        value={newTopicForm.title}
                        onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                        required
                      />
                      <Textarea
                        placeholder="Описание темы"
                        value={newTopicForm.description}
                        onChange={(e) => setNewTopicForm({ ...newTopicForm, description: e.target.value })}
                        rows={5}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Создание...' : 'Создать тему'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка тем...</p>
              </div>
            ) : topics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Пока нет тем. {user ? 'Создайте первую!' : 'Войдите, чтобы создать первую тему.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Card 
                    key={topic.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/forum/${topic.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 flex items-center gap-2">
                            {topic.is_pinned && (
                              <Icon name="Pin" size={18} className="text-primary" />
                            )}
                            {topic.title}
                            {topic.is_locked && (
                              <Icon name="Lock" size={16} className="text-muted-foreground" />
                            )}
                          </CardTitle>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {topic.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Icon name="Eye" size={14} />
                            {topic.views_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="MessageSquare" size={14} />
                            {topic.posts_count || 0}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Автор: <strong>{topic.author_username || 'Неизвестен'}</strong></span>
                        <span>{formatDate(topic.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {currentTopic && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {currentTopic.is_pinned && (
                      <Icon name="Pin" size={20} className="text-primary" />
                    )}
                    {currentTopic.title}
                    {currentTopic.is_locked && (
                      <Icon name="Lock" size={18} className="text-muted-foreground" />
                    )}
                  </CardTitle>
                  {currentTopic.description && (
                    <p className="text-muted-foreground mt-2">{currentTopic.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Автор: <strong>{currentTopic.author_username || 'Неизвестен'}</strong></span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" size={14} />
                        {currentTopic.views_count || 0} просмотров
                      </span>
                      <span>{formatDate(currentTopic.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <h3 className="text-xl font-bold mb-4">Сообщения ({posts.length})</h3>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка сообщений...</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {posts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        Пока нет сообщений. {user ? 'Будьте первым!' : 'Войдите, чтобы ответить.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon name="User" size={20} className="text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <strong className="text-sm">{post.author_username || 'Неизвестен'}</strong>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(post.created_at)}
                                </span>
                                {user && user.id === post.author_id && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => handleEditPost(post)}
                                    >
                                      <Icon name="Edit" size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-destructive hover:text-destructive"
                                      onClick={() => handleDeletePost(post.id)}
                                    >
                                      <Icon name="Trash2" size={14} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingPostId === post.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editPostContent}
                                  onChange={(e) => setEditPostContent(e.target.value)}
                                  rows={4}
                                  className="text-sm"
                                />
                                {editPostImages.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {editPostImages.map((img, idx) => (
                                      <div key={idx} className="relative group">
                                        <img 
                                          src={img} 
                                          alt={`Изображение ${idx + 1}`}
                                          className="rounded-lg border border-border h-32 w-full object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeEditImage(idx)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Icon name="X" size={16} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageUpload}
                                    className="hidden"
                                    id={`edit-image-upload-${post.id}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`edit-image-upload-${post.id}`)?.click()}
                                    disabled={imageUploadLoading || editPostImages.length >= 4}
                                  >
                                    <Icon name="Image" size={14} className="mr-1" />
                                    Фото
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdatePost(post.id)}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                  >
                                    Отмена
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                                {post.images && JSON.parse(post.images).length > 0 && (
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    {JSON.parse(post.images).map((img: string, idx: number) => (
                                      <img 
                                        key={idx} 
                                        src={img} 
                                        alt={`Изображение ${idx + 1}`}
                                        className="rounded-lg border border-border max-h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(img, '_blank')}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {user && !currentTopic?.is_locked ? (
              <Card>
                <CardHeader>
                  <CardTitle>Ответить</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <Textarea
                      placeholder="Напишите ваш ответ..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={5}
                      required
                    />
                    
                    {postImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {postImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={img} 
                              alt={`Изображение ${idx + 1}`}
                              className="rounded-lg border border-border h-32 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon name="X" size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={imageUploadLoading || postImages.length >= 4}
                      >
                        <Icon name="Image" size={16} className="mr-2" />
                        {imageUploadLoading ? 'Загрузка...' : 'Добавить изображение'}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : !user ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Войдите или зарегистрируйтесь, чтобы ответить в этой теме
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                      Вход
                    </Button>
                    <Button onClick={() => setIsRegisterOpen(true)}>
                      Регистрация
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : currentTopic?.is_locked && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Icon name="Lock" size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Эта тема заблокирована. Новые сообщения недоступны.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение Email</DialogTitle>
            <DialogDescription>
              Введите код подтверждения из уведомления
              {verificationCode && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-green-800 font-mono text-sm">
                    Ваш код: <strong>{verificationCode}</strong>
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              placeholder="Код подтверждения"
              value={verifyForm.code}
              onChange={(e) => setVerifyForm({ ...verifyForm, code: e.target.value })}
              required
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Проверка...' : 'Подтвердить'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forum;