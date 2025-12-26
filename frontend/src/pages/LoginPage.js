import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Mail, Lock, User, Phone } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success(t('auth.welcomeBack') + '!');
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone || null);
        toast.success(t('common.success') + '!');
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || t('common.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d6efd] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6efd] to-[#0b5ed7]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold font-['Manrope'] tracking-tight mb-4">
            {t('app.name')}
          </h1>
          <p className="text-xl text-white/90 leading-relaxed max-w-md">
            {t('app.tagline')}
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-white/90">{t('app.feature1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="text-white/90">{t('app.feature2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-white/90">{t('app.feature3')}</span>
            </div>
          </div>
        </div>
        {/* Decorative shapes */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Language Switcher - Top Right */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        
        <Card className="w-full max-w-md border-[#dee2e6] shadow-lg" data-testid="auth-card">
          <CardHeader className="space-y-1 pb-6">
            <div className="lg:hidden flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0d6efd] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold font-['Manrope']">{t('app.name')}</span>
            </div>
            <CardTitle className="text-2xl font-semibold font-['Manrope'] text-[#212529]">
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </CardTitle>
            <CardDescription className="text-[#6c757d]">
              {isLogin ? t('auth.enterCredentials') : t('auth.fillDetails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#212529]">{t('auth.name')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                      data-testid="name-input"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#212529]">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#212529]">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                    data-testid="password-input"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#212529]">{t('auth.phoneOptional')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c757d]" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                      data-testid="phone-input"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-medium py-2.5 transition-all duration-200"
                disabled={loading}
                data-testid="submit-btn"
              >
                {loading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#6c757d]">
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 text-[#0d6efd] hover:underline font-medium"
                  data-testid="toggle-auth-mode"
                >
                  {isLogin ? t('auth.signUp') : t('auth.signIn')}
                </button>
              </p>
            </div>

            {isLogin && (
              <div className="mt-4 p-3 bg-[#f8f9fa] rounded-md border border-[#dee2e6]">
                <p className="text-xs text-[#6c757d] text-center">
                  <strong>{t('auth.demoAdmin')}:</strong> admin@example.com / admin123
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
