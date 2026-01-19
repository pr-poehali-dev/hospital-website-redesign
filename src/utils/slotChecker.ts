export interface SlotCheckResult {
  available: boolean;
  error?: string;
}

export async function checkSlotAvailability(
  appointmentsApiUrl: string,
  doctorId: number,
  date: string,
  time: string,
  excludeAppointmentId?: number
): Promise<SlotCheckResult> {
  try {
    let url = `${appointmentsApiUrl}?action=check-slot&doctor_id=${doctorId}&date=${date}&time=${time}`;
    
    if (excludeAppointmentId) {
      url += `&exclude_id=${excludeAppointmentId}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      return {
        available: false,
        error: 'Не удалось проверить доступность слота'
      };
    }

    const data = await response.json();
    
    if (!data.available) {
      return {
        available: false,
        error: data.error || `Время ${time} на ${new Date(date + 'T00:00:00').toLocaleDateString('ru-RU')} уже занято`
      };
    }

    return { available: true };
  } catch (error) {
    console.error('Slot check error:', error);
    return {
      available: false,
      error: 'Произошла ошибка при проверке доступности времени'
    };
  }
}

export function showSlotErrorDialog(errorMessage: string): void {
  const existingDialog = document.getElementById('slot-error-overlay');
  if (existingDialog) {
    existingDialog.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'slot-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-in;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    text-align: center;
    animation: slideDown 0.3s ease-out;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 50%;
    margin: 0 auto 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    animation: scaleUp 0.4s ease-out;
  `;
  icon.textContent = '⚠️';

  const title = document.createElement('h2');
  title.style.cssText = `
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 12px;
  `;
  title.textContent = 'Слот времени занят';

  const message = document.createElement('p');
  message.style.cssText = `
    font-size: 16px;
    color: #6b7280;
    margin-bottom: 28px;
    line-height: 1.6;
  `;
  message.textContent = errorMessage;

  const button = document.createElement('button');
  button.style.cssText = `
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 14px 32px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  `;
  button.textContent = 'Понятно';
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
  });

  button.addEventListener('click', () => {
    overlay.style.animation = 'fadeOut 0.2s ease-out';
    setTimeout(() => overlay.remove(), 200);
  });

  dialog.appendChild(icon);
  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(button);
  overlay.appendChild(dialog);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideDown {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes scaleUp {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => overlay.remove(), 200);
    }
  });
}