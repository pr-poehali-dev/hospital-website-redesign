import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const API_URLS = {
  auth: 'https://functions.poehali.dev/b51b3f73-d83d-4a55-828e-5feec95d1227',
};

interface DoctorLoginFormProps {
  onLoginSuccess: (doctor: any) => void;
  toast: any;
}

const DoctorLoginForm = ({ onLoginSuccess, toast }: DoctorLoginFormProps) => {
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const doctor = data.doctor;
        localStorage.setItem('doctor_auth', JSON.stringify(doctor));
        onLoginSuccess(doctor);
        toast({ title: "Вход выполнен", description: `Добро пожаловать, ${doctor.full_name}!` });
      } else {
        toast({ title: "Ошибка входа", description: data.error || "Неверный логин или пароль", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Проблема с подключением", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <Icon name="Stethoscope" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Портал врача</CardTitle>
          <CardDescription>Войдите для доступа к панели управления</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Логин</label>
              <Input
                type="text"
                placeholder="Введите ваш логин"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль</label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Icon name="LogIn" size={16} className="mr-2" />
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorLoginForm;
