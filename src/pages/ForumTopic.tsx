import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const API_URLS = {
  topics: 'https://functions.poehali.dev/e1e111a6-e824-4bf1-9416-b5c145b37906',
  posts: 'https://functions.poehali.dev/0352645c-ae3d-4c45-8081-4f7a347244a6',
};

const ForumTopic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTopic();
    loadPosts();
  }, [id]);

  const checkAuth = () => {
    const token = localStorage.getItem('forum_token');
    const userData = localStorage.getItem('forum_user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadTopic = async () => {
    try {
      const response = await fetch(`${API_URLS.topics}?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data.topic) {
        setTopic(data.topic);
      } else {
        toast({
          title: "Ошибка",
          description: "Тема не найдена",
          variant: "destructive",
        });
        navigate('/forum');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить тему",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_URLS.posts}?topic_id=${id}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы оставить сообщение",
        variant: "destructive",
      });
      return;
    }

    if (!newPost.trim()) {
      toast({
        title: "Ошибка",
        description: "Сообщение не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('forum_token');
      const response = await fetch(API_URLS.posts, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token || '',
        },
        body: JSON.stringify({
          topic_id: id,
          content: newPost,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Успешно!",
          description: "Сообщение добавлено",
        });
        setNewPost('');
        loadPosts();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось добавить сообщение",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/forum">
            <Button variant="outline" size="sm">
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад к списку тем
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
                {topic.description && (
                  <p className="text-muted-foreground">{topic.description}</p>
                )}
              </div>
              {topic.is_pinned && (
                <Icon name="Pin" size={20} className="text-primary ml-4" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1">
                <Icon name="User" size={16} />
                {topic.author_username || 'Аноним'}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={16} />
                {topic.views_count || 0} просмотров
              </span>
              <span className="flex items-center gap-1">
                <Icon name="MessageSquare" size={16} />
                {posts.length} сообщений
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={16} />
                {formatDate(topic.created_at)}
              </span>
            </div>
            {topic.is_locked && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <Icon name="Lock" size={18} className="text-yellow-600" />
                <span className="text-sm text-yellow-800">Тема заблокирована для новых сообщений</span>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="space-y-4 mb-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Пока нет сообщений в этой теме
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="User" size={16} className="text-muted-foreground" />
                        <span className="font-medium">{post.author_username || 'Аноним'}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!topic.is_locked && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Добавить сообщение</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <Textarea
                    placeholder="Введите ваше сообщение..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={5}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting || !newPost.trim()}>
                    <Icon name="Send" size={16} className="mr-2" />
                    {isSubmitting ? 'Отправка...' : 'Отправить'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Войдите, чтобы оставить сообщение</p>
                  <Link to="/forum">
                    <Button variant="link" className="mt-2">
                      Перейти к авторизации
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default ForumTopic;
