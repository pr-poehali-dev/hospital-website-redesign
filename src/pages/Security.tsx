import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const RATE_LIMITER_URL = 'https://functions.poehali.dev/dd760420-6c65-41e9-bd95-171dec0f3ac9';
const AUTH_URL = 'https://functions.poehali.dev/c5b009b8-4d0d-4b09-91f5-1ab8bdf740bb';
const ADMIN_MANAGEMENT_URL = 'https://functions.poehali.dev/41b28850-cf23-4959-9bd7-7f728c1ad124';

interface EndpointStat {
  endpoint: string;
  total_requests: number;
  unique_ips: number;
  unique_devices: number;
}

interface SuspiciousIP {
  ip_address: string;
  request_count: number;
  first_seen: string;
  last_seen: string;
}

interface Statistics {
  endpoint_stats: EndpointStat[];
  suspicious_ips: SuspiciousIP[];
}

interface Admin {
  id: number;
  login: string;
  email: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  last_login?: string;
}

const Security = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchIP, setSearchIP] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'admins'>('stats');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({ login: '', email: '', password: '', full_name: '' });

  useEffect(() => {
    const token = localStorage.getItem('security_token');
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
      loadStatistics(token);
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      loadStatistics();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const token = data.token;
        localStorage.setItem('security_token', token);
        setAdminToken(token);
        setIsAuthenticated(true);
        loadStatistics(token);
        loadAdmins(token);
        toast({
          title: 'Вход выполнен',
          description: 'Добро пожаловать в панель безопасности',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный пароль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('security_token');
    setIsAuthenticated(false);
    setAdminToken(null);
    setStats(null);
    setAdmins([]);
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!',
    });
  };

  const loadAdmins = async (token?: string) => {
    const authToken = token || adminToken;
    if (!authToken) return;
    
    try {
      const response = await fetch(ADMIN_MANAGEMENT_URL, {
        headers: {
          'X-Admin-Token': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminToken) return;
    
    try {
      const response = await fetch(ADMIN_MANAGEMENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(newAdmin),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Администратор добавлен',
        });
        setShowAddAdmin(false);
        setNewAdmin({ login: '', email: '', password: '', full_name: '' });
        loadAdmins();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось добавить администратора',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminToken || !editingAdmin) return;
    
    try {
      const response = await fetch(ADMIN_MANAGEMENT_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(editingAdmin),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Администратор обновлен',
        });
        setEditingAdmin(null);
        loadAdmins();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить администратора',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!adminToken) return;
    
    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return;
    
    try {
      const response = await fetch(`${ADMIN_MANAGEMENT_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Администратор удален',
        });
        loadAdmins();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить администратора',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    }
  };

  const loadStatistics = async (token?: string) => {
    const authToken = token || adminToken;
    if (!authToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${RATE_LIMITER_URL}?action=get-stats`, {
        headers: {
          'X-Admin-Token': authToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getThreatLevel = (count: number): 'low' | 'medium' | 'high' => {
    if (count > 800) return 'high';
    if (count > 500) return 'medium';
    return 'low';
  };

  const filteredSuspiciousIPs = stats?.suspicious_ips.filter(ip =>
    searchIP ? ip.ip_address.includes(searchIP) : true
  ) || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Shield" size={24} />
              Панель безопасности
            </CardTitle>
            <CardDescription>
              Введите пароль для доступа к статистике
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Логин"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Пароль администратора"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={32} className="text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">Панель безопасности</h1>
                <p className="text-sm text-muted-foreground">Мониторинг и защита от ботов</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Icon name={autoRefresh ? "Pause" : "Play"} size={16} className="mr-2" />
                {autoRefresh ? 'Остановить' : 'Авто-обновление'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadStatistics} disabled={loading}>
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Обновить
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="BarChart3" size={16} className="inline mr-2" />
            Статистика
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="Users" size={16} className="inline mr-2" />
            Администраторы
          </button>
        </div>

        {activeTab === 'stats' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="Activity" size={16} />
                Всего endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.endpoint_stats.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Активных за 24 часа
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="Users" size={16} />
                Уникальные IP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.endpoint_stats.reduce((sum, stat) => sum + stat.unique_ips, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Разных пользователей
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} />
                Подозрительные IP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {stats?.suspicious_ips.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Более 500 запросов/день
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BarChart3" size={20} />
              Активность по endpoints
            </CardTitle>
            <CardDescription>
              Статистика запросов за последние 24 часа
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : stats?.endpoint_stats.length ? (
              <div className="space-y-4">
                {stats.endpoint_stats.map((stat) => (
                  <div key={stat.endpoint} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{stat.endpoint}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {stat.total_requests} запросов
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Users" size={14} />
                          {stat.unique_ips} IP
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Smartphone" size={14} />
                          {stat.unique_devices} устр.
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (stat.total_requests / (stats.endpoint_stats[0]?.total_requests || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных за последние 24 часа
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Shield" size={20} />
                  Подозрительные IP адреса
                </CardTitle>
                <CardDescription>
                  IP с более чем 500 запросами за последние 24 часа
                </CardDescription>
              </div>
              <Input
                placeholder="Поиск по IP..."
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : filteredSuspiciousIPs.length ? (
              <div className="space-y-3">
                {filteredSuspiciousIPs.map((ip) => {
                  const threat = getThreatLevel(ip.request_count);
                  return (
                    <div
                      key={ip.ip_address}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold">{ip.ip_address}</span>
                          <Badge
                            variant={
                              threat === 'high'
                                ? 'destructive'
                                : threat === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {threat === 'high' && '🔴 Высокая угроза'}
                            {threat === 'medium' && '🟡 Средняя угроза'}
                            {threat === 'low' && '🟢 Низкая угроза'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="Activity" size={14} />
                            {ip.request_count} запросов
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Clock" size={14} />
                            {formatDate(ip.first_seen)} - {formatDate(ip.last_seen)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(ip.ip_address);
                          toast({
                            title: 'IP скопирован',
                            description: `${ip.ip_address} скопирован в буфер обмена`,
                          });
                        }}
                      >
                        <Icon name="Copy" size={16} className="mr-2" />
                        Копировать
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchIP ? 'Ничего не найдено' : 'Подозрительных IP не обнаружено'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Info" size={20} />
              Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-green-500" />
                Активная защита
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                <li>Rate limiting на всех критичных endpoints</li>
                <li>Device fingerprinting для отслеживания устройств</li>
                <li>Автоматическая очистка логов старше 24 часов</li>
                <li>Client-side проверка перед отправкой запроса</li>
              </ul>
            </div>

            {stats && stats.suspicious_ips.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="AlertTriangle" size={16} className="text-orange-500" />
                  Действия при атаке
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                  <li>Скопируйте подозрительные IP из списка выше</li>
                  <li>Добавьте их в BLOCKED_IPS в backend/rate_limiter/index.py</li>
                  <li>Разверните обновленную функцию через sync_backend</li>
                  <li>Усильте лимиты (уменьшите requests_per_minute)</li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="TrendingUp" size={16} className="text-blue-500" />
                Мониторинг
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                <li>Проверяйте статистику раз в неделю</li>
                <li>Включайте авто-обновление при подозрениях на атаку</li>
                <li>Ищите аномалии (один IP значительно больше других)</li>
                <li>Следите за новыми endpoints в списке</li>
              </ul>
            </div>
          </CardContent>
        </Card>
          </>
        )}

        {activeTab === 'admins' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Управление администраторами</h2>
              <Button onClick={() => setShowAddAdmin(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить администратора
              </Button>
            </div>

            {showAddAdmin && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Новый администратор</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <Input
                      placeholder="Логин"
                      value={newAdmin.login}
                      onChange={(e) => setNewAdmin({ ...newAdmin, login: e.target.value })}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="ФИО (необязательно)"
                      value={newAdmin.full_name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Пароль (минимум 8 символов)"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Создать</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddAdmin(false);
                          setNewAdmin({ login: '', email: '', password: '', full_name: '' });
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {editingAdmin && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Редактирование администратора</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateAdmin} className="space-y-4">
                    <Input
                      placeholder="Логин"
                      value={editingAdmin.login}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, login: e.target.value })}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={editingAdmin.email}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="ФИО (необязательно)"
                      value={editingAdmin.full_name || ''}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, full_name: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Новый пароль (оставьте пустым, если не меняете)"
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value } as any)}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={editingAdmin.is_active}
                        onChange={(e) => setEditingAdmin({ ...editingAdmin, is_active: e.target.checked })}
                      />
                      <label htmlFor="is_active">Аккаунт активен</label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Сохранить</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingAdmin(null)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Список администраторов ({admins.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{admin.login}</span>
                          <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                            {admin.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Email: {admin.email}</div>
                          {admin.full_name && <div>ФИО: {admin.full_name}</div>}
                          {admin.last_login && (
                            <div>Последний вход: {formatDate(admin.last_login)}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAdmin(admin)}
                        >
                          <Icon name="Edit" size={16} className="mr-2" />
                          Редактировать
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Icon name="Trash2" size={16} className="mr-2" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Shield" size={20} />
                  Безопасность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Icon name="CheckCircle2" size={16} className="text-green-500" />
                    Защита паролей
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Пароли хранятся в хешированном виде (bcrypt)</li>
                    <li>Минимальная длина пароля: 8 символов</li>
                    <li>Невозможно восстановить исходный пароль из базы</li>
                    <li>Проверка паролей только на сервере</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Icon name="Shield" size={16} className="text-blue-500" />
                    Защита от SQL-инъекций
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Все запросы используют параметризацию (psycopg2)</li>
                    <li>Нет конкатенации пользовательского ввода с SQL</li>
                    <li>Валидация данных на уровне Pydantic</li>
                    <li>Проверка типов данных перед запросами</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Icon name="Lock" size={16} className="text-orange-500" />
                    Рекомендации
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Используйте сложные пароли (буквы, цифры, символы)</li>
                    <li>Не используйте один пароль для всех админов</li>
                    <li>Периодически меняйте пароли администраторов</li>
                    <li>Деактивируйте аккаунты уволенных сотрудников</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Security;