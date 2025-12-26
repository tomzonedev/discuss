import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { topicsAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Users, 
  CheckSquare,
  MessageSquare,
  Filter
} from 'lucide-react';

const TopicsPage = () => {
  const { t } = useLanguage();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, subscribed
  const navigate = useNavigate();

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const params = { search: search || undefined };
      if (filter === 'subscribed') {
        params.my_topics = true;
      }
      const response = await topicsAPI.getAll(params);
      setTopics(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchTopics, 300);
    return () => clearTimeout(debounce);
  }, [search, filter]);

  const handleSubscribe = async (topicId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await topicsAPI.subscribe(topicId);
      toast.success(t('common.success'));
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleUnsubscribe = async (topicId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await topicsAPI.unsubscribe(topicId);
      toast.success(t('common.success'));
      fetchTopics();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-[#0d6efd] text-white';
      case 'admin': return 'bg-[#198754] text-white';
      case 'member': return 'bg-[#6c757d] text-white';
      default: return 'bg-[#f8f9fa] text-[#212529] border border-[#dee2e6]';
    }
  };

  return (
    <div className="space-y-8" data-testid="topics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
            {t('topics.title')}
          </h1>
          <p className="mt-1 text-[#6c757d]">{t('topics.subtitle')}</p>
        </div>
        <Link to="/topics/new">
          <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white" data-testid="create-topic-btn">
            <Plus className="w-4 h-4 mr-2" />
            {t('topics.newTopic')}
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
          <Input
            placeholder={t('topics.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-[#dee2e6] bg-white"
            data-testid="search-input"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#0d6efd] text-white' : 'border-[#dee2e6]'}
            data-testid="filter-all"
          >
            {t('topics.allTopics')}
          </Button>
          <Button
            variant={filter === 'subscribed' ? 'default' : 'outline'}
            onClick={() => setFilter('subscribed')}
            className={filter === 'subscribed' ? 'bg-[#0d6efd] text-white' : 'border-[#dee2e6]'}
            data-testid="filter-subscribed"
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('topics.myTopics')}
          </Button>
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d6efd]"></div>
        </div>
      ) : topics.length === 0 ? (
        <Card className="border-[#dee2e6]">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#6c757d] opacity-50" />
            <h3 className="text-lg font-medium text-[#212529] mb-2">{t('topics.noTopicsFound')}</h3>
            <p className="text-[#6c757d] mb-4">
              {search ? t('topics.tryDifferentSearch') : t('topics.createToGetStarted')}
            </p>
            <Link to="/topics/new">
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('topics.createTopic')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.id}`}
              className="block"
              data-testid={`topic-card-${topic.id}`}
            >
              <Card className="border-[#dee2e6] h-full hover:shadow-md hover:border-[#0d6efd]/30 transition-all duration-200 transform hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#212529] font-['Manrope'] line-clamp-1">
                      {topic.name}
                    </h3>
                    {topic.user_role && (
                      <Badge className={getRoleBadgeColor(topic.user_role)}>
                        {topic.user_role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#6c757d] text-sm line-clamp-2 mb-4 min-h-[40px]">
                    {topic.description || t('topics.noDescription')}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#dee2e6]">
                    <div className="flex items-center gap-4 text-sm text-[#6c757d]">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {topic.member_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" /> {topic.task_count}
                      </span>
                    </div>
                    {topic.user_role ? (
                      topic.user_role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#dc3545] hover:text-[#dc3545] hover:bg-[#dc3545]/10"
                          onClick={(e) => handleUnsubscribe(topic.id, e)}
                          data-testid={`unsubscribe-${topic.id}`}
                        >
                          {t('topics.leave')}
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0d6efd] hover:text-[#0d6efd] hover:bg-[#0d6efd]/10"
                        onClick={(e) => handleSubscribe(topic.id, e)}
                        data-testid={`subscribe-${topic.id}`}
                      >
                        {t('topics.join')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicsPage;
