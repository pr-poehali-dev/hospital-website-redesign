import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_URL = 'https://functions.poehali.dev/fb5160e8-f170-4c21-97a9-3afbcb6f78a9';

const Faq = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const response = await fetch(FAQ_URL);
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/files/d1c15da6-7ffe-46bb-b5db-3d114b408cec.jpg" 
              alt="Логотип АЦГМБ ЛНР" 
              className="w-12 h-12 object-contain mix-blend-multiply"
            />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">ГУ АЦГМБ ЛНР</p>
              <h1 className="text-sm font-bold text-primary leading-tight">Антрацитовская центральная<br />городская многопрофильная больница</h1>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="/">
              <Icon name="Home" size={18} className="mr-2" />
              На главную
            </a>
          </Button>
        </div>
      </header>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Icon name="HelpCircle" size={32} className="text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Часто задаваемые вопросы</h1>
            <p className="text-lg text-muted-foreground">
              Ответы на популярные вопросы о работе нашей больницы
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Загрузка...</p>
              </CardContent>
            </Card>
          ) : faqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="FileQuestion" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  Пока нет вопросов и ответов
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={faq.id} 
                  value={`item-${faq.id}`}
                  className="bg-white rounded-lg border-2 border-border overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4 text-left">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="font-semibold text-lg pr-4">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="ml-12 space-y-4">
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.image_url && (
                        <img 
                          src={faq.image_url} 
                          alt={faq.question}
                          className="rounded-lg max-w-full h-auto shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="MessageCircle" size={24} className="text-primary" />
                Не нашли ответ на свой вопрос?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Свяжитесь с нами любым удобным способом, и мы с радостью поможем вам
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href="/#complaints">
                    <Icon name="Send" size={18} className="mr-2" />
                    Задать вопрос
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/#contacts">
                    <Icon name="Phone" size={18} className="mr-2" />
                    Контакты
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/90">
            <p className="text-sm">&copy; 2024 Государственное учреждение «Антрацитовская центральная городская многопрофильная больница» ЛНР</p>
            <p className="text-xs mt-2 text-white/70">Все права защищены</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Faq;
