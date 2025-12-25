import { useState, useEffect } from 'react';
import { tasksAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckSquare, Calendar, Clock, Filter } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getMyTasks();
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      toast.success('Task updated');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

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
    <div className="space-y-8" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
            My Tasks
          </h1>
          <p className="mt-1 text-[#6c757d]">Tasks assigned to you across all topics</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6c757d]" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-[#dee2e6]" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-[#dee2e6]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#212529]">{tasks.filter(t => t.status === 'pending').length}</p>
            <p className="text-sm text-[#6c757d]">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-[#dee2e6]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#ffc107]">{tasks.filter(t => t.status === 'in_progress').length}</p>
            <p className="text-sm text-[#6c757d]">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-[#dee2e6]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#198754]">{tasks.filter(t => t.status === 'completed').length}</p>
            <p className="text-sm text-[#6c757d]">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="border-[#dee2e6]">
          <CardContent className="py-16 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-[#6c757d] opacity-50" />
            <h3 className="text-lg font-medium text-[#212529] mb-2">
              {filter === 'all' ? 'No tasks assigned' : `No ${filter.replace('_', ' ')} tasks`}
            </h3>
            <p className="text-[#6c757d]">
              {filter === 'all' ? 'Tasks assigned to you will appear here' : 'Try a different filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="border-[#dee2e6] hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#212529]">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-[#6c757d] mb-3">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6c757d]">
                      <span className="px-2 py-1 bg-[#f8f9fa] rounded">{task.topic_name}</span>
                      {task.start_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Start: {format(new Date(task.start_time), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {task.end_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {format(new Date(task.end_time), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {task.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        className="border-[#ffc107] text-[#ffc107] hover:bg-[#ffc107] hover:text-[#212529]"
                        data-testid={`start-task-${task.id}`}
                      >
                        Start
                      </Button>
                    )}
                    {task.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(task.id, 'completed')}
                        className="border-[#198754] text-[#198754] hover:bg-[#198754] hover:text-white"
                        data-testid={`complete-task-${task.id}`}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
