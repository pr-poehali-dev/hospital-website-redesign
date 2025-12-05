import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const Structure = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(https://cdn.poehali.dev/projects/317e44da-9a2a-46c7-91b6-a5c7dee19b28/files/f3cad472-e990-4101-9d1b-163dee97656f.jpg)' }}>
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
          <nav className="hidden lg:flex gap-4 text-sm">
            <a href="/" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Главная</a>
            <a href="/#about" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">О нас</a>
            <a href="/#doctors" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">График приема</a>
            <a href="/structure" className="text-primary transition-colors font-medium whitespace-nowrap">Структура</a>
            <a href="/#contacts" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">Контакты</a>
          </nav>
        </div>
      </header>

      <section className="py-12 bg-white/90">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Структура ГУ "АЦГМБ" ЛНР</h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Государственное учреждение "Антрацитовская центральная многопрофильная больница" Луганской Народной Республики
            </p>
            <p className="text-sm text-muted-foreground mt-2">г. Антрацит, ул. Толстоусова, д.1, 294613</p>
          </div>

          <Tabs defaultValue="clinics" className="max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="clinics">Поликлиники</TabsTrigger>
              <TabsTrigger value="ambulatory">Амбулатории и ФАПы</TabsTrigger>
              <TabsTrigger value="departments">Отделения</TabsTrigger>
              <TabsTrigger value="services">Службы</TabsTrigger>
            </TabsList>

            <TabsContent value="clinics" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Building2" size={24} className="text-primary" />
                      Центральная городская поликлиника
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Сулима Вера Николаевна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, ул. Толстоусова, д.1, 294613</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-312-60-44 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Baby" size={24} className="text-primary" />
                      Детская городская поликлиника
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Комарова Елена Геннадьевна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, ул. Петровского, 56</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-312-59-59 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Building" size={24} className="text-primary" />
                      Поликлиника №1
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Гончарова Ольга Викторовна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, ул. Говорова, 1</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-312-63-30 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Building" size={24} className="text-primary" />
                      Поликлиника №2
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Уколова Юлия Михайловна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит-7, пер. Первомайский, 4</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-312-41-00 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Building" size={24} className="text-primary" />
                      Поликлиника №3
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Лукьяненко Олеся Владимировна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, пгт. Крепенский, ул. 40 лет Октября, 9</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-319-82-70 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Building" size={24} className="text-primary" />
                      Поликлиника №4
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Михайличенко Лариса Сергеевна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, пгт. Щетово, ул. Ленина, 4а</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7 857-319-43-63 (регистратура)</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Home" size={24} className="text-primary" />
                      Амбулатория п. Дубовский
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий - Панасюк Наталья Владимировна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, пгт. Дубовский, ул. Горького, 5</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Heart" size={24} className="text-primary" />
                      Женская консультация
                    </CardTitle>
                    <CardDescription className="text-base">
                      Заведующий – Кохно Людмила Васильевна
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <Icon name="MapPin" size={18} className="text-primary mt-1" />
                      <p>г. Антрацит, ул. Толстоусова, д.1</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Phone" size={18} className="text-primary mt-1" />
                      <p>+7-857-312-60-57</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Регистратура</p>
                          <p className="text-sm">пн-пт 07:30 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Icon name="Clock" size={18} className="text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-sm">Поликлиника</p>
                          <p className="text-sm">пн-пт 08:00 – 17:00</p>
                          <p className="text-sm">сб, вс 08:00 – 14:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ambulatory" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП п. Боково-Платово
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, п. Боково-Платово, ул. Октябрьская 31</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП шахты 7-7 бис
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, ш.7-7бис, ул. Школьная, 10/26</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП шахты 15
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, шахта 15, ул. Садовая 56</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пгт. Ивановка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Ивановка, ул. Артема, 72а</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ с. Дьяково
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Дьяково, ул. Мира, 116а</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пгт. Красный Кут
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Красный Кут, ул. ІІ-я Советская, 47</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пгт. Фащевка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Фащевка, ул. Советская, 9</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ с. Червоная Поляна
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Червоная Поляна, ул. Первомайская, 8</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пгт. Нижний Нагольчик
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Нижний Нагольчик, ул. Ленина, 80</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ с. Бобриково
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Бобриково, ул. Шевченко, 3</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пгт. Есауловка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Есауловка, ул. Переверзева, 11</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      АОПСМ пос. Кошары
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, п. Кошары, ул. Пролетарская, 22</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП пгт. Малониколаевка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, пгт. Малониколаевка, кв. Сиволапа, 6</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП с. Рафаиловка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Рафаиловка, ул. Подлесная, 36</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП с. Ребриково
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Ребриково, ул. Школьная, 1</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП с. Картушино
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Картушино, ул. Пионерская, 4</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП с. Индустрия
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Индустрия, ул. Совхозная, 3</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП пгт. Верхний Нагольчик
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, пгт. Верхний Нагольчик, пер. Ленина 1</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФАП пгт. Каменный
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, пгт. Каменный, ул. Шахтерская, 107</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП п. Лесной
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, п. Лесное, ул. Ленина, 2/1</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП п. Христофоровка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">г. Антрацит, п. Христофоровка, ул. Беляева, 15</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Краснолучский
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Краснолучский, ул. Советская, 20/1</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Колпаково
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Колпаково, ул. Пролетарская, 33</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Мечетка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Мечетка, ул. Почтовая, 16а</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Никитовка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Никитовка, ул. Центральная, 15</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Орловское
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Орловское, ул. Космонавтов, 22</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Лескино
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Лескино, ул. Октябрьская, 17</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Новокрасновка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Новокрасновка, ул. Будановой, 4</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Зеленодольское
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Зеленодольское, ул. Центральная</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Егоровка
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Егоровка, ул. Будённого, 10</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП п. Колпаково
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, п. Колпаково, ул. Садовая, 1Б</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Западное
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Западное, ул. Степная, 5а</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Курган
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Курган, ул. Вишнёвая, 26</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Вишнёвое
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Вишнёвое, ул. Давыденко, 1</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Степное
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Степное, ул. Дзержинского, 21</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Home" size={20} className="text-primary" />
                      ФП с. Красный Октябрь
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Антрацитовский р-н, с. Красный Октябрь, ул. Октябрьская, 20</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="departments" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Heart" size={20} className="text-primary" />
                      Гинекологическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Репникова Елена Александровна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Activity" size={20} className="text-primary" />
                      Дневной стационар неврологического отделения
                    </CardTitle>
                    <CardDescription>Заведующий – Косяченко Наталья Ивановна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="AlertCircle" size={20} className="text-primary" />
                      Инфекционное – боксированное отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Шурупова Анжела Владимировна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="HeartPulse" size={20} className="text-primary" />
                      Кардиологическое отделение
                    </CardTitle>
                    <CardDescription>И.о. заведующий – Биляченко Сергей Митрофанович</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="TestTube" size={20} className="text-primary" />
                      Клинико – диагностическая лаборатория
                    </CardTitle>
                    <CardDescription>Заведующий – Серикова Наталья Анатольевна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm mb-2">тел.: +7-857-312-60-57</p>
                    <p className="text-sm text-muted-foreground">пн-сб 07:30– 15:30</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Brain" size={20} className="text-primary" />
                      Неврологическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Чернявская Марина Александровна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Siren" size={20} className="text-primary" />
                      Отделение анестезиологии и интенсивной терапии
                    </CardTitle>
                    <CardDescription>Заведующий – Чернявский Родион Игоревич</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Droplet" size={20} className="text-primary" />
                      Отделение заготовки и переработки крови
                    </CardTitle>
                    <CardDescription>Заведующий – Ульянова Тамара Ивановна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Baby" size={20} className="text-primary" />
                      Отделение новорожденных
                    </CardTitle>
                    <CardDescription>Заведующий – Суялкина Виктория Викторовна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Eye" size={20} className="text-primary" />
                      Офтальмо – отоларингологическое отделение
                    </CardTitle>
                    <CardDescription>И.о. заведующий – Мазуров Николай Михайлович</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Microscope" size={20} className="text-primary" />
                      Патологоанатомическое отделение
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Baby" size={20} className="text-primary" />
                      Педиатрическое отделение
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Ambulance" size={20} className="text-primary" />
                      Приемное отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Панкова Элла Александровна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Brain" size={20} className="text-primary" />
                      Психиатрическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Зайцева Людмила Владимировна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, пер. Победы</p>
                    <p className="text-sm">тел.: +7-857-312-40-90</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="ScanLine" size={20} className="text-primary" />
                      Рентгенологическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Харламенко Людмила Александровна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Heart" size={20} className="text-primary" />
                      Родильное отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Царенко Людмила Васильевна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Activity" size={20} className="text-primary" />
                      Терапевтическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Балаба Людмила Викторовна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Bone" size={20} className="text-primary" />
                      Травматологический пункт
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Bone" size={20} className="text-primary" />
                      Травматологическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Комаров Роман Иванович</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Waves" size={20} className="text-primary" />
                      Физиотерапевтическое отделение
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Scissors" size={20} className="text-primary" />
                      Хирургическое отделение
                    </CardTitle>
                    <CardDescription>Заведующий – Чумак Игорь Анатольевич</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="Shield" size={20} className="text-primary" />
                      Центральная стерилизационная
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Толстоусова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon name="MessageCircle" size={20} className="text-primary" />
                      Кабинет «Доверия»
                    </CardTitle>
                    <CardDescription>врач – эпидемиолог – Жолос Татьяна Александровна</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">г. Антрацит, ул. Говорова, д.1</p>
                    <p className="text-sm">тел.: +7-857-312-60-57</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg">
              <a href="/">
                <Icon name="ArrowLeft" size={20} className="mr-2" />
                Вернуться на главную
              </a>
            </Button>
          </div>
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

export default Structure;
