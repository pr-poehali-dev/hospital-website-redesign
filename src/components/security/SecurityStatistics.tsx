import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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

interface SecurityStatisticsProps {
  stats: Statistics | null;
  loading: boolean;
  searchIP: string;
  onSearchIPChange: (value: string) => void;
}

const SecurityStatistics = ({ stats, loading, searchIP, onSearchIPChange }: SecurityStatisticsProps) => {
  const { toast } = useToast();

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

  return (
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
              onChange={(e) => onSearchIPChange(e.target.value)}
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
  );
};

export default SecurityStatistics;
