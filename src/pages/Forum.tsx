import { useState, useEffect } from 'react';
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
};

const Forum = () => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });
  const [verifyForm, setVerifyForm] = useState({ user_id: '', code: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [newTopicForm, setNewTopicForm] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTopics();
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('forum_token');
    const userData = localStorage.getItem('forum_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadTopics = async () => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationCode(data.verification_code);
        setVerifyForm({ ...verifyForm, user_id: data.user_id });
        setIsRegisterOpen(false);
        setIsVerifyOpen(true);
        
        toast({
          title: "Регистрация успешна!",
          description: `Ваш код подтверждения: ${data.verification_code}`,
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
              <p className="text-[10px] text-muted-foreground leading-tight">ГУ АЦГМБ ЛНР</p>
              <h1 className="text-sm font-bold text-primary leading-tight">Форум пациентов</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">Привет, <strong>{user.username}</strong>!</span>
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

                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
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
                        После регистрации вы получите код подтверждения
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Имя пользователя"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        placeholder="Пароль (минимум 6 символов)"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        minLength={6}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            <Button variant="outline" asChild size="sm">
              <a href="/">
                <Icon name="Home" size={16} className="mr-2" />
                На главную
              </a>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение email</DialogTitle>
            <DialogDescription>
              Ваш код подтверждения: <strong className="text-lg text-primary">{verificationCode}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              placeholder="Введите код подтверждения"
              value={verifyForm.code}
              onChange={(e) => setVerifyForm({ ...verifyForm, code: e.target.value })}
              required
              maxLength={6}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Проверка...' : 'Подтвердить'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Форум пациентов</h1>
              <p className="text-muted-foreground">Общение, вопросы и обсуждения</p>
            </div>
            
            {user && (
              <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Icon name="Plus" size={18} className="mr-2" />
                    Создать тему
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая тема</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <Input
                      placeholder="Заголовок темы"
                      value={newTopicForm.title}
                      onChange={(e) => setNewTopicForm({ ...newTopicForm, title: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Описание (необязательно)"
                      value={newTopicForm.description}
                      onChange={(e) => setNewTopicForm({ ...newTopicForm, description: e.target.value })}
                      rows={4}
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
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Загрузка...</p>
              </CardContent>
            </Card>
          ) : topics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">Пока нет тем для обсуждения</p>
                {user && (
                  <Button onClick={() => setIsNewTopicOpen(true)}>
                    Создать первую тему
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {topic.is_pinned && (
                            <Icon name="Pin" size={16} className="text-primary" />
                          )}
                          {topic.is_locked && (
                            <Icon name="Lock" size={16} className="text-muted-foreground" />
                          )}
                          <CardTitle className="text-lg">
                            <a href={`/forum/${topic.id}`} className="hover:text-primary transition-colors">
                              {topic.title}
                            </a>
                          </CardTitle>
                        </div>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="User" size={14} />
                            {topic.author_username}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="MessageCircle" size={14} />
                            {topic.posts_count || 0} сообщений
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Eye" size={14} />
                            {topic.views_count || 0} просмотров
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Clock" size={14} />
                            {new Date(topic.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Forum;
