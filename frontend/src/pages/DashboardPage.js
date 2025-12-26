import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { topicsAPI, tasksAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Plus,
  Clock,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, tasksRes] = await Promise.all([
          topicsAPI.getAll({ my_topics: true }),
          tasksAPI.getMyTasks()
        ]);
        setTopics(topicsRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-[#198754] text-white';
      case 'in_progress': return 'bg-[#ffc107] text-[#212529]';
      default: return 'bg-[#6c757d] text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d6efd]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
            {t('dashboard.welcome')}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-[#6c757d]">{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/topics/new">
          <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white" data-testid="create-topic-btn">
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.newTopic')}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card className="border-[#dee2e6] hover:shadow-md transition-shadow" data-testid="stat-topics">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">{t('dashboard.myTopics')}</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">{topics.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#0d6efd]/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#0d6efd]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dee2e6] hover:shadow-md transition-shadow" data-testid="stat-pending">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">{t('dashboard.pendingTasks')}</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">{pendingTasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#ffc107]/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#ffc107]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dee2e6] hover:shadow-md transition-shadow" data-testid="stat-completed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">{t('dashboard.completed')}</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">{completedTasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#198754]/10 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-[#198754]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dee2e6] hover:shadow-md transition-shadow" data-testid="stat-total-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">{t('dashboard.totalTasks')}</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">{tasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#6c757d]/10 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-[#6c757d]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Topics */}
        <Card className="border-[#dee2e6]" data-testid="recent-topics-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-semibold font-['Manrope'] text-[#212529]">
              {t('dashboard.myTopics')}
            </CardTitle>
            <Link to="/topics" className="text-sm text-[#0d6efd] hover:underline flex items-center gap-1">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topics.length === 0 ? (
              <div className="text-center py-8 text-[#6c757d]">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noTopicsYet')}</p>
                <Link to="/topics/new">
                  <Button variant="link" className="text-[#0d6efd] mt-2">{t('dashboard.createFirstTopic')}</Button>
                </Link>
              </div>
            ) : (
              topics.slice(0, 5).map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className="block p-4 rounded-lg border border-[#dee2e6] hover:border-[#0d6efd]/30 hover:bg-[#f8f9fa] transition-all duration-200"
                  data-testid={`topic-${topic.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[#212529]">{topic.name}</h3>
                      <p className="text-sm text-[#6c757d] mt-1 line-clamp-1">
                        {topic.description || t('topics.noDescription')}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-[#dee2e6] text-[#6c757d]">
                      {topic.user_role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#6c757d]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {topic.member_count} {t('topics.members')}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> {topic.task_count} {t('topics.tasks')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="border-[#dee2e6]" data-testid="pending-tasks-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-semibold font-['Manrope'] text-[#212529]">
              {t('dashboard.pendingTasks')}
            </CardTitle>
            <Link to="/tasks" className="text-sm text-[#0d6efd] hover:underline flex items-center gap-1">
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-[#6c757d]">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noPendingTasks')}</p>
                <p className="text-sm mt-1">{t('dashboard.allCaughtUp')}</p>
              </div>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-[#dee2e6] hover:border-[#0d6efd]/30 transition-all duration-200"
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[#212529]">{task.title}</h3>
                      <p className="text-sm text-[#6c757d] mt-1">{task.topic_name}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  {task.end_time && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-[#6c757d]">
                      <Calendar className="w-3 h-3" />
                      {t('tasks.due')}: {format(new Date(task.end_time), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
