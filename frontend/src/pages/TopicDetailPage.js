import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { topicsAPI, tasksAPI, usersAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  UserPlus,
  Calendar as CalendarIcon,
  Clock,
  User
} from 'lucide-react';

const TopicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuperuser } = useAuth();
  const { t } = useLanguage();
  const [topic, setTopic] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form states
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    worker_id: '',
    start_time: null,
    end_time: null
  });

  const fetchTopic = async () => {
    try {
      const [topicRes, tasksRes, usersRes] = await Promise.all([
        topicsAPI.getById(id),
        tasksAPI.getTopicTasks(id),
        usersAPI.getAll()
      ]);
      setTopic(topicRes.data);
      setTasks(tasksRes.data);
      setAllUsers(usersRes.data);
      setEditForm({ name: topicRes.data.name, description: topicRes.data.description || '' });
    } catch (error) {
      toast.error(t('common.error'));
      navigate('/topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const isAdmin = topic?.user_role === 'owner' || topic?.user_role === 'admin' || isSuperuser();
  const isOwner = topic?.user_role === 'owner' || isSuperuser();

  const handleUpdateTopic = async () => {
    try {
      await topicsAPI.update(id, editForm);
      toast.success(t('topicDetail.topicUpdated'));
      setShowEditTopic(false);
      fetchTopic();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm(t('topicDetail.confirmDelete'))) return;
    try {
      await topicsAPI.delete(id);
      toast.success(t('topicDetail.topicDeleted'));
      navigate('/topics');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleAddMember = async () => {
    try {
      await topicsAPI.addMember(id, {
        user_id: parseInt(memberForm.user_id),
        role: memberForm.role
      });
      toast.success(t('topicDetail.memberAdded'));
      setShowAddMember(false);
      setMemberForm({ user_id: '', role: 'member' });
      fetchTopic();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm(t('topicDetail.removeMember') + '?')) return;
    try {
      await topicsAPI.removeMember(id, userId);
      toast.success(t('topicDetail.memberRemoved'));
      fetchTopic();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        topic_id: parseInt(id),
        title: taskForm.title,
        description: taskForm.description || null,
        worker_id: taskForm.worker_id && taskForm.worker_id !== 'unassigned' ? parseInt(taskForm.worker_id) : null,
        start_time: taskForm.start_time?.toISOString() || null,
        end_time: taskForm.end_time?.toISOString() || null
      };
      await tasksAPI.create(taskData);
      toast.success(t('taskForm.taskCreated'));
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', worker_id: '', start_time: null, end_time: null });
      fetchTopic();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm(t('taskForm.deleteTask') + '?')) return;
    try {
      await tasksAPI.delete(taskId);
      toast.success(t('taskForm.taskDeleted'));
      fetchTopic();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      toast.success(t('taskForm.taskUpdated'));
      fetchTopic();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAssignToUsers = async (workerIds) => {
    if (!selectedTask) return;
    try {
      await tasksAPI.assignToUsers(selectedTask.id, workerIds);
      toast.success(t('common.success'));
      setShowAssignTask(false);
      setSelectedTask(null);
      fetchTopic();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-[#198754] text-white';
      case 'in_progress': return 'bg-[#ffc107] text-[#212529]';
      default: return 'bg-[#6c757d] text-white';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-[#0d6efd] text-white';
      case 'admin': return 'bg-[#198754] text-white';
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

  const nonMembers = allUsers.filter(u => !topic?.members?.find(m => m.user_id === u.id));

  return (
    <div className="space-y-8" data-testid="topic-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link to="/topics" className="text-[#6c757d] hover:text-[#212529] flex items-center gap-1 mb-3 text-sm">
            <ArrowLeft className="w-4 h-4" /> {t('topicDetail.backToTopics')}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
              {topic?.name}
            </h1>
            {topic?.user_role && (
              <Badge className={getRoleBadgeColor(topic.user_role)}>
                {topic.user_role}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-[#6c757d]">{topic?.description || t('topics.noDescription')}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-[#dee2e6]"
              onClick={() => setShowEditTopic(true)}
              data-testid="edit-topic-btn"
            >
              <Edit className="w-4 h-4 mr-2" /> {t('topicDetail.edit')}
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                className="border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white"
                onClick={handleDeleteTopic}
                data-testid="delete-topic-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" /> {t('topicDetail.delete')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members Section */}
        <Card className="border-[#dee2e6] lg:col-span-1" data-testid="members-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold font-['Manrope'] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0d6efd]" />
              {t('topicDetail.members')} ({topic?.members?.length || 0})
            </CardTitle>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMember(true)}
                className="text-[#0d6efd]"
                data-testid="add-member-btn"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {topic?.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors"
                data-testid={`member-${member.user_id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0d6efd] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#212529]">{member.user.name}</p>
                    <p className="text-xs text-[#6c757d]">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(member.role)} variant="secondary">
                    {member.role}
                  </Badge>
                  {isAdmin && member.role !== 'owner' && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-[#dc3545] hover:text-[#dc3545] h-8 w-8 p-0"
                      data-testid={`remove-member-${member.user_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="border-[#dee2e6] lg:col-span-2" data-testid="tasks-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold font-['Manrope'] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0d6efd]" />
              {t('topicDetail.tasks')} ({tasks.length})
            </CardTitle>
            {isAdmin && (
              <Button
                onClick={() => setShowCreateTask(true)}
                className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white"
                data-testid="create-task-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> {t('topicDetail.addTask')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-[#6c757d]">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('topicDetail.noTasksYet')}</p>
                {isAdmin && (
                  <Button
                    variant="link"
                    className="text-[#0d6efd] mt-2"
                    onClick={() => setShowCreateTask(true)}
                  >
                    {t('topicDetail.createFirstTask')}
                  </Button>
                )}
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-[#dee2e6] hover:border-[#0d6efd]/30 transition-all"
                  data-testid={`task-item-${task.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[#212529]">{task.title}</h4>
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-[#6c757d] mt-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#6c757d]">
                        {task.worker && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {task.worker.name}
                          </span>
                        )}
                        {task.start_time && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" /> {t('tasks.startDate')}: {format(new Date(task.start_time), 'MMM dd')}
                          </span>
                        )}
                        {task.end_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t('tasks.due')}: {format(new Date(task.end_time), 'MMM dd')}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {task.worker_id === user?.id && task.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}>
                            {t('taskForm.markInProgress')}
                          </DropdownMenuItem>
                        )}
                        {task.worker_id === user?.id && task.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, 'completed')}>
                            {t('taskForm.markComplete')}
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => { setSelectedTask(task); setShowAssignTask(true); }}>
                              {t('taskForm.assignToUsers')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#dc3545] focus:text-[#dc3545]"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              {t('taskForm.deleteTask')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Topic Dialog */}
      <Dialog open={showEditTopic} onOpenChange={setShowEditTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('topicDetail.editTopic')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('topicDetail.topicName')}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="edit-topic-name"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('topicDetail.description')}</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                data-testid="edit-topic-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTopic(false)}>{t('topicDetail.cancel')}</Button>
            <Button onClick={handleUpdateTopic} className="bg-[#0d6efd] hover:bg-[#0b5ed7]" data-testid="save-topic-btn">
              {t('topicDetail.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('topicDetail.addMember')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.user')}</Label>
              <Select value={memberForm.user_id} onValueChange={(v) => setMemberForm({ ...memberForm, user_id: v })}>
                <SelectTrigger data-testid="select-user">
                  <SelectValue placeholder={t('topicDetail.selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  {nonMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('topicDetail.role')}</Label>
              <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v })}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t('topicDetail.member')}</SelectItem>
                  <SelectItem value="admin">{t('common.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddMember} className="bg-[#0d6efd] hover:bg-[#0b5ed7]" data-testid="add-member-submit">
              {t('topicDetail.addMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('taskForm.createTask')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('taskForm.title')} *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder={t('taskForm.titlePlaceholder')}
                data-testid="task-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('taskForm.description')}</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={2}
                placeholder={t('taskForm.descriptionPlaceholder')}
                data-testid="task-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('taskForm.assignTo')}</Label>
              <Select value={taskForm.worker_id || "unassigned"} onValueChange={(v) => setTaskForm({ ...taskForm, worker_id: v === "unassigned" ? "" : v })}>
                <SelectTrigger data-testid="task-worker-select">
                  <SelectValue placeholder={t('taskForm.selectMember')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('taskForm.unassigned')}</SelectItem>
                  {topic?.members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id.toString()}>{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('taskForm.startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskForm.start_time ? format(taskForm.start_time, 'PPP') : t('taskForm.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskForm.start_time}
                      onSelect={(d) => setTaskForm({ ...taskForm, start_time: d })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{t('taskForm.endDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskForm.end_time ? format(taskForm.end_time, 'PPP') : t('taskForm.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskForm.end_time}
                      onSelect={(d) => setTaskForm({ ...taskForm, end_time: d })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTask(false)}>{t('taskForm.cancel')}</Button>
            <Button
              onClick={handleCreateTask}
              className="bg-[#0d6efd] hover:bg-[#0b5ed7]"
              disabled={!taskForm.title}
              data-testid="create-task-submit"
            >
              {t('taskForm.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('taskForm.assignTask')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[#6c757d] mb-4">
              {t('taskForm.assignDescription')}
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {topic?.members?.map((member) => (
                <label
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#dee2e6] cursor-pointer hover:bg-[#f8f9fa]"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    data-user-id={member.user_id}
                  />
                  <div>
                    <p className="text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-[#6c757d]">{member.user.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignTask(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => {
                const checkboxes = document.querySelectorAll('[data-user-id]:checked');
                const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.userId));
                handleAssignToUsers(ids);
              }}
              className="bg-[#0d6efd] hover:bg-[#0b5ed7]"
              data-testid="assign-task-submit"
            >
              {t('taskForm.assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicDetailPage;
