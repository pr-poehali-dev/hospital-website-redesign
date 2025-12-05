import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
  doctors: 'https://functions.poehali.dev/68f877b2-aeda-437a-ad67-925a3414d688',
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

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth) {
      setIsAuthenticated(true);
      loadDoctors();
    }
  }, []);

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

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать этого врача?')) return;
    
    try {
      const response = await fetch(`${API_URLS.doctors}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({ title: "Успешно", description: "Врач деактивирован" });
        loadDoctors();
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось деактивировать врача", variant: "destructive" });
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
                  <Input
                    placeholder="URL фотографии врача (необязательно)"
                    value={doctorForm.photo_url}
                    onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                  />
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
                  <Input
                    placeholder="URL фотографии врача"
                    value={doctorForm.photo_url}
                    onChange={(e) => setDoctorForm({ ...doctorForm, photo_url: e.target.value })}
                  />
                  {doctorForm.photo_url && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <img 
                        src={doctorForm.photo_url} 
                        alt="Предпросмотр" 
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Предпросмотр фото</p>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDoctorForm({ ...doctorForm, photo_url: '' })}
                        >
                          Удалить фото
                        </Button>
                      </div>
                    </div>
                  )}
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
                  <p className="text-sm"><strong>Статус:</strong> {doctor.is_active ? 'Активен' : 'Деактивирован'}</p>
                  {doctor.is_active && (
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
                      >
                        <Icon name="Trash2" size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;