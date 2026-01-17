import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Admin {
  id: number;
  login: string;
  email: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  last_login?: string;
  password?: string;
}

interface AdminManagementProps {
  admins: Admin[];
  showAddAdmin: boolean;
  editingAdmin: Admin | null;
  newAdmin: { login: string; email: string; password: string; full_name: string };
  onShowAddAdmin: (show: boolean) => void;
  onEditingAdmin: (admin: Admin | null) => void;
  onNewAdminChange: (admin: { login: string; email: string; password: string; full_name: string }) => void;
  onAddAdmin: (e: React.FormEvent) => void;
  onUpdateAdmin: (e: React.FormEvent) => void;
  onDeleteAdmin: (id: number) => void;
}

const AdminManagement = ({
  admins,
  showAddAdmin,
  editingAdmin,
  newAdmin,
  onShowAddAdmin,
  onEditingAdmin,
  onNewAdminChange,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: AdminManagementProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Управление администраторами</h2>
        <Button onClick={() => onShowAddAdmin(true)}>
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
            <form onSubmit={onAddAdmin} className="space-y-4">
              <Input
                placeholder="Логин"
                value={newAdmin.login}
                onChange={(e) => onNewAdminChange({ ...newAdmin, login: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={newAdmin.email}
                onChange={(e) => onNewAdminChange({ ...newAdmin, email: e.target.value })}
                required
              />
              <Input
                placeholder="ФИО (необязательно)"
                value={newAdmin.full_name}
                onChange={(e) => onNewAdminChange({ ...newAdmin, full_name: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Пароль (минимум 8 символов)"
                value={newAdmin.password}
                onChange={(e) => onNewAdminChange({ ...newAdmin, password: e.target.value })}
                required
                minLength={8}
              />
              <div className="flex gap-2">
                <Button type="submit">Создать</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onShowAddAdmin(false);
                    onNewAdminChange({ login: '', email: '', password: '', full_name: '' });
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
            <form onSubmit={onUpdateAdmin} className="space-y-4">
              <Input
                placeholder="Логин"
                value={editingAdmin.login}
                onChange={(e) => onEditingAdmin({ ...editingAdmin, login: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={editingAdmin.email}
                onChange={(e) => onEditingAdmin({ ...editingAdmin, email: e.target.value })}
                required
              />
              <Input
                placeholder="ФИО (необязательно)"
                value={editingAdmin.full_name || ''}
                onChange={(e) => onEditingAdmin({ ...editingAdmin, full_name: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Новый пароль (оставьте пустым, если не меняете)"
                onChange={(e) => onEditingAdmin({ ...editingAdmin, password: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingAdmin.is_active}
                  onChange={(e) => onEditingAdmin({ ...editingAdmin, is_active: e.target.checked })}
                />
                <label htmlFor="is_active">Аккаунт активен</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Сохранить</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEditingAdmin(null)}
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
                    onClick={() => onEditingAdmin(admin)}
                  >
                    <Icon name="Edit" size={16} className="mr-2" />
                    Редактировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteAdmin(admin.id)}
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
  );
};

export default AdminManagement;
