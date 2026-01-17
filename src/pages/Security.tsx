import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import SecurityLogin from '@/components/security/SecurityLogin';
import SecurityStatistics from '@/components/security/SecurityStatistics';
import AdminManagement from '@/components/security/AdminManagement';

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
      loadAdmins(token);
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !adminToken) return;

    const interval = setInterval(() => {
      loadStatistics(adminToken);
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
    const authToken = token || adminToken || localStorage.getItem('security_token');
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
    const authToken = token || adminToken || localStorage.getItem('security_token');
    if (!authToken) {
      toast({
        title: 'Ошибка',
        description: 'Не авторизован. Войдите заново.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${RATE_LIMITER_URL}?action=get-stats`, {
        headers: {
          'X-Admin-Token': authToken,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Токен недействителен. Войдите заново.');
        }
        throw new Error('Failed to load statistics');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Не удалось загрузить статистику',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SecurityLogin
        login={login}
        password={password}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
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
              <Button variant="outline" size="sm" onClick={() => loadStatistics()} disabled={loading}>
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
          <SecurityStatistics
            stats={stats}
            loading={loading}
            searchIP={searchIP}
            onSearchIPChange={setSearchIP}
          />
        )}

        {activeTab === 'admins' && (
          <AdminManagement
            admins={admins}
            showAddAdmin={showAddAdmin}
            editingAdmin={editingAdmin}
            newAdmin={newAdmin}
            onShowAddAdmin={setShowAddAdmin}
            onEditingAdmin={setEditingAdmin}
            onNewAdminChange={setNewAdmin}
            onAddAdmin={handleAddAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
          />
        )}
      </main>
    </div>
  );
};

export default Security;
