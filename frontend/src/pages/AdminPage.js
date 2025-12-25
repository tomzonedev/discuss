import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Search, Users, Shield, Trash2, Edit } from 'lucide-react';

const AdminPage = () => {
  const { user: currentUser, isSuperuser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', auth_level: '' });

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll(search || undefined);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      auth_level: user.auth_level
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    try {
      await usersAPI.update(selectedUser.id, editForm);
      toast.success('User updated');
      setShowEditUser(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (!isSuperuser()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-[#dee2e6]">
          <CardContent className="py-16 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-[#dc3545]" />
            <h3 className="text-lg font-medium text-[#212529] mb-2">Access Denied</h3>
            <p className="text-[#6c757d]">You need superuser privileges to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
          Admin Panel
        </h1>
        <p className="mt-1 text-[#6c757d]">Manage users and system settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#dee2e6]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">Total Users</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#0d6efd]/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#0d6efd]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#dee2e6]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">Superusers</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">
                  {users.filter(u => u.auth_level === 'superuser').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#198754]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#198754]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#dee2e6]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6c757d] uppercase tracking-wide">Regular Users</p>
                <p className="text-3xl font-bold text-[#212529] mt-1">
                  {users.filter(u => u.auth_level === 'user').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#6c757d]/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#6c757d]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-[#dee2e6]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold font-['Manrope']">Users</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[#dee2e6]"
              data-testid="search-users"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d6efd]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#dee2e6]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6c757d] uppercase tracking-wide">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6c757d] uppercase tracking-wide">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6c757d] uppercase tracking-wide">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#6c757d] uppercase tracking-wide">Role</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#6c757d] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#dee2e6] hover:bg-[#f8f9fa]" data-testid={`user-row-${user.id}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#0d6efd] rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-[#212529]">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#6c757d]">{user.email}</td>
                      <td className="py-4 px-4 text-[#6c757d]">{user.phone || '-'}</td>
                      <td className="py-4 px-4">
                        <Badge className={user.auth_level === 'superuser' ? 'bg-[#198754] text-white' : 'bg-[#6c757d] text-white'}>
                          {user.auth_level}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="text-[#0d6efd] hover:text-[#0d6efd]"
                            data-testid={`edit-user-${user.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-[#dc3545] hover:text-[#dc3545]"
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="edit-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                data-testid="edit-user-phone"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.auth_level} onValueChange={(v) => setEditForm({ ...editForm, auth_level: v })}>
                <SelectTrigger data-testid="edit-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="superuser">Superuser</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} className="bg-[#0d6efd] hover:bg-[#0b5ed7]" data-testid="save-user-btn">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
