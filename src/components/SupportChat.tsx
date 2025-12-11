import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = 'https://functions.poehali.dev/f0120272-0320-4731-8a43-e5c1362e3057';

interface Message {
  id: number;
  sender_type: 'patient' | 'operator';
  sender_name: string;
  message: string;
  created_at: string;
}

const SupportChat = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
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
      const interval = setInterval(() => {
        loadMessages(chatId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [chatId, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (id: number) => {
    try {
      const response = await fetch(`${CHAT_URL}?action=get-messages&chat_id=${id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <Icon name="MessageCircle" size={24} />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between p-4 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Icon name="Headphones" size={20} />
              <CardTitle className="text-lg">Служба поддержки</CardTitle>
            </div>
            <div className="flex gap-2">
              {hasStartedChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Icon name="Plus" size={18} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <Icon name="X" size={18} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {!hasStartedChat ? (
              <form onSubmit={handleStartChat} className="p-4 space-y-4 flex-1 flex flex-col justify-center">
                <div className="text-center mb-4">
                  <Icon name="MessageSquare" size={48} className="text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Начать чат</h3>
                  <p className="text-sm text-muted-foreground">
                    Задайте вопрос и наш оператор ответит вам
                  </p>
                </div>
                <Input
                  placeholder="Ваше имя"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Телефон (необязательно)"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Создание...' : 'Начать чат'}
                </Button>
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
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
                          className={`max-w-[75%] rounded-lg p-3 ${
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

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default SupportChat;
