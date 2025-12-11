import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const RATE_LIMITER_URL = 'https://functions.poehali.dev/dd760420-6c65-41e9-bd95-171dec0f3ac9';
const ADMIN_TOKEN = 'admin123';

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

const Security = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchIP, setSearchIP] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('security_auth');
    if (auth === ADMIN_TOKEN) {
      setIsAuthenticated(true);
      loadStatistics();
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      loadStatistics();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_TOKEN) {
      localStorage.setItem('security_auth', ADMIN_TOKEN);
      setIsAuthenticated(true);
      loadStatistics();
      toast({
        title: 'Вход выполнен',
        description: 'Добро пожаловать в панель безопасности',
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('security_auth');
    setIsAuthenticated(false);
    setStats(null);
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!',
    });
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${RATE_LIMITER_URL}?action=get-stats`, {
        headers: {
          'X-Admin-Token': ADMIN_TOKEN,
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
                  type="password"
                  placeholder="Пароль администратора"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
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
      </main>
    </div>
  );
};

export default Security;
