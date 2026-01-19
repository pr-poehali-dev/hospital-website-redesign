# Универсальная система проверки слотов времени

## Описание
Система автоматически проверяет доступность слотов времени перед записью пациента к врачу. Если слот занят другим пациентом, операция блокируется и показывается красивое модальное окно с ошибкой.

## Где используется
Проверка встроена во все операции с записями:

### Страница Регистратора (`src/pages/Registrar.tsx`)
- ✅ Создание новой записи (`handleCreateAppointment`)
- ✅ Перенос записи (`handleRescheduleAppointment`)
- ✅ Клонирование записи (`handleCloneAppointment`)

### Страница Врача (`src/pages/Doctor.tsx`)
- ✅ Создание новой записи (`handleCreateNewAppointment`)
- ✅ Перенос записи (`handleRescheduleAppointment`)
- ✅ Клонирование записи (`handleCloneAppointment`)

## Как работает

### 1. Бэкенд API (Python)
Новый endpoint в `backend/appointments-v2/index.py`:
```
GET /?action=check-slot&doctor_id=X&date=YYYY-MM-DD&time=HH:MM&exclude_id=X
```

**Параметры:**
- `doctor_id` — ID врача (обязательно)
- `date` — дата в формате YYYY-MM-DD (обязательно)
- `time` — время в формате HH:MM (обязательно)
- `exclude_id` — ID записи для исключения при переносе (опционально)

**Ответ:**
```json
{
  "available": true/false,
  "error": "Время 10:00 на 2024-01-20 уже занято другим пациентом"
}
```

### 2. Фронтенд утилита
Файл: `src/utils/slotChecker.ts`

**Функция проверки:**
```typescript
import { checkSlotAvailability, showSlotErrorDialog } from '@/utils/slotChecker';

// Проверка доступности
const result = await checkSlotAvailability(
  doctorId,     // ID врача
  date,         // 'YYYY-MM-DD'
  time,         // 'HH:MM'
  excludeId     // опционально для переноса
);

if (!result.available) {
  showSlotErrorDialog(result.error);
  return; // Блокируем операцию
}

// Продолжаем создание/перенос записи
```

**Красивое модальное окно:**
- Показывается по центру экрана
- Красный круглый значок с ⚠️
- Заголовок: "Слот времени занят"
- Детальное сообщение об ошибке
- Кнопка "Понятно" для закрытия
- Анимации появления/исчезания
- Закрытие по клику на фон

## Пример использования

```typescript
const handleCreateAppointment = async () => {
  // 1. Проверяем слот ПЕРЕД отправкой запроса
  const slotCheck = await checkSlotAvailability(
    doctorId,
    selectedDate,
    selectedTime
  );

  // 2. Если занят — показываем ошибку и выходим
  if (!slotCheck.available) {
    showSlotErrorDialog(slotCheck.error || 'Слот времени занят');
    return;
  }

  // 3. Только если свободен — создаём запись
  try {
    const response = await fetch(API_URLS.appointments, {
      method: 'POST',
      body: JSON.stringify({ ... })
    });
    // ...
  }
}
```

## Технические детали

### Бэкенд (Python)
- Быстрая проверка через прямой SQL запрос
- Поддержка исключения записи (для переноса)
- Проверка только активных записей (status != 'cancelled')

### Фронтенд (TypeScript)
- Минимальная нагрузка — один GET запрос
- Универсальная функция для всех страниц
- Красивое UX с анимациями
- Автоматическое удаление старых диалогов

## Преимущества
✅ Предотвращает двойную запись на один слот  
✅ Работает даже при одновременной работе регистраторов  
✅ Красивое уведомление вместо технической ошибки  
✅ Универсальное решение для всех операций  
✅ Минимальная нагрузка на сервер  
