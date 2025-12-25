import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersAPI.update(user.id, formData);
      toast.success('Profile updated successfully');
      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8" data-testid="profile-page">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-['Manrope'] text-[#212529] tracking-tight">
          Profile
        </h1>
        <p className="mt-1 text-[#6c757d]">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="border-[#dee2e6]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0d6efd] rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <CardTitle className="text-xl font-semibold font-['Manrope'] text-[#212529]">
                {user?.name}
              </CardTitle>
              <CardDescription className="text-[#6c757d] flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user?.email}
              </CardDescription>
              <Badge className={user?.auth_level === 'superuser' ? 'bg-[#198754] text-white mt-1' : 'bg-[#6c757d] text-white mt-1'}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.auth_level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#212529]">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                  data-testid="profile-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#212529]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                <Input
                  id="email"
                  value={user?.email}
                  disabled
                  className="pl-10 border-[#dee2e6] bg-[#e9ecef] cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-[#6c757d]">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#212529]">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                  className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                  data-testid="profile-phone"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white"
              data-testid="save-profile-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[#dc3545]/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-[#dc3545]">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white"
            onClick={logout}
            data-testid="logout-profile-btn"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
