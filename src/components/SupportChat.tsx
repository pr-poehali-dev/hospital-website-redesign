import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useRateLimiter } from '@/hooks/use-rate-limiter';

const CHAT_URL = 'https://functions.poehali.dev/f0120272-0320-4731-8a43-e5c1362e3057';
const SMS_VERIFY_URL = 'https://functions.poehali.dev/7ea5c6f5-d200-4cc0-b34b-10144a995d69';

interface Message {
  id: number;
  sender_type: 'patient' | 'operator';
  sender_name: string;
  message: string;
  created_at: string;
}

const SupportChat = () => {
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimiter({ 
    endpoint: 'support-chat',
    maxRequestsPerMinute: 10
  });
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'form' | 'code' | 'verified'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedChatId = localStorage.getItem('supportChatId');
    if (savedChatId) {
      setChatId(Number(savedChatId));
      setHasStartedChat(true);
      loadMessages(Number(savedChatId));
    }
  }, []);

  useEffect(() => {
    if (chatId && isOpen) {
      let interval: NodeJS.Timeout | null = null;
      let isPageVisible = true;
      
      const startPolling = () => {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          if (isPageVisible) {
            loadMessages(chatId, true);
          }
        }, 10000);
      };
      
      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
        if (isPageVisible) {
          loadMessages(chatId, false);
          startPolling();
        } else {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      startPolling();
      
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [chatId, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (id: number, silent = false) => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get-messages&chat_id=${id}`);
      const data = await response.json();
      const newMessages = data.messages || [];
      
      if (silent && newMessages.length === messages.length) {
        return;
      }
      
      setMessages(newMessages);
    } catch (error) {
      if (!silent) {
        console.error('Failed to load messages:', error);
      }
    }
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rateLimitCheck = await checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Ограничение запросов',
        description: rateLimitCheck.reason || 'Слишком много запросов. Подождите немного.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(SMS_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send',
          phone_number: patientPhone 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.show_code) {
          toast({
            title: 'Ваш код верификации',
            description: `Код: ${data.show_code}. Не удалось отправить в MAX, используйте этот код для подтверждения.`,
            duration: 0,
          });
        } else {
          toast({
            title: 'Код отправлен в MAX',
            description: `Проверьте сообщения в мессенджере MAX на номере ${patientPhone}`,
            duration: 10000,
          });
        }
        setVerificationStep('code');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением к серверу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(SMS_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify',
          phone_number: patientPhone,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStep('verified');
        toast({
          title: 'Номер подтвержден',
          description: 'Создаём чат...',
        });
        await handleStartChat();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный код',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Проблема с подключением к серверу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-chat',
          patient_name: patientName,
          patient_phone: patientPhone,
        }),
      });

      const data = await response.json();

      if (data.success && data.chat_id) {
        setChatId(data.chat_id);
        setHasStartedChat(true);
        localStorage.setItem('supportChatId', data.chat_id.toString());
        toast({
          title: 'Чат создан',
          description: 'Оператор скоро ответит вам',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const rateLimitCheck = await checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Ограничение запросов',
        description: rateLimitCheck.reason || 'Слишком много запросов. Подождите немного.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          chat_id: chatId,
          sender_type: 'patient',
          sender_name: patientName,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        loadMessages(chatId);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    localStorage.removeItem('supportChatId');
    setChatId(null);
    setHasStartedChat(false);
    setMessages([]);
    setPatientName('');
    setPatientPhone('');
    setVerificationStep('form');
    setVerificationCode('');
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <Icon name="MessageCircle" size={24} />
        </Button>
      )}

      {isOpen && (
        <div className="fixed top-[80px] left-0 right-0 bottom-0 md:inset-auto md:top-auto md:bottom-6 md:right-6 md:left-auto md:w-96 md:h-[500px] z-50 flex flex-col">
          <Card className="w-full h-full md:h-auto flex flex-col shadow-2xl rounded-none md:rounded-lg overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between p-3 md:p-4 shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="Headphones" size={18} className="md:w-5 md:h-5" />
                <CardTitle className="text-base md:text-lg">Служба поддержки</CardTitle>
              </div>
              <div className="flex gap-1 md:gap-2">
                {hasStartedChat && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <Icon name="Plus" size={16} className="md:w-[18px] md:h-[18px]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Icon name="X" size={16} className="md:w-[18px] md:h-[18px]" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden min-h-0">
              {!hasStartedChat ? (
                <div className="p-4 space-y-3 md:space-y-4 flex flex-col justify-center flex-1">
                  <div className="text-center mb-2 md:mb-4">
                    <Icon name="MessageSquare" size={40} className="text-primary mx-auto mb-2 md:mb-3 md:w-12 md:h-12" />
                    <h3 className="font-semibold text-base md:text-lg mb-1">Начать общение</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {verificationStep === 'form' && 'Введите ваши данные для начала чата'}
                      {verificationStep === 'code' && 'Введите код из MAX для подтверждения'}
                      {verificationStep === 'verified' && 'Создаём чат...'}
                    </p>
                  </div>

                  {verificationStep === 'form' && (
                    <form onSubmit={handleSendVerificationCode} className="space-y-3 md:space-y-4">
                      <Input
                        placeholder="Ваше имя"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        className="text-sm md:text-base"
                      />
                      <Input
                        placeholder="Телефон (+79991234567)"
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        className="text-sm md:text-base"
                      />
                      <Button 
                        type="submit" 
                        className="w-full text-sm md:text-base" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Отправка кода...' : 'Отправить код в MAX'}
                      </Button>
                    </form>
                  )}

                  {verificationStep === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-3 md:space-y-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-3 md:pt-4">
                          <div className="flex items-start gap-2 md:gap-3">
                            <Icon name="Info" size={20} className="text-blue-600 mt-1 md:w-6 md:h-6" />
                            <div>
                              <p className="font-medium text-blue-900 mb-1 text-xs md:text-sm">Проверьте MAX</p>
                              <p className="text-xs text-blue-700">
                                Код отправлен в мессенджер MAX на ваш номер. Введите полученный код.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Input
                        placeholder="Введите 6-значный код"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        pattern="[0-9]{6}"
                        className="text-sm md:text-base"
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          className="flex-1 text-sm md:text-base"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Проверка...' : 'Подтвердить'}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setVerificationStep('form');
                            setVerificationCode('');
                          }}
                          className="text-sm md:text-base"
                        >
                          Назад
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-muted/20 min-h-0">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        <Icon name="MessageSquare" size={32} className="mx-auto mb-2 opacity-50" />
                        Сообщений пока нет
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[75%] rounded-lg p-2.5 md:p-3 ${
                              msg.sender_type === 'patient'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white border border-border'
                            }`}
                          >
                            {msg.sender_type === 'operator' && (
                              <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${msg.sender_type === 'patient' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t bg-white shrink-0">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        className="text-base"
                      />
                      <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()} className="shrink-0">
                        <Icon name="Send" size={18} />
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default SupportChat;