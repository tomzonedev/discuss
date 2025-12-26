import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { topicsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const CreateTopicPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await topicsAPI.create(formData);
      toast.success(t('common.success'));
      navigate(`/topics/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto" data-testid="create-topic-page">
      <button
        onClick={() => navigate(-1)}
        className="text-[#6c757d] hover:text-[#212529] flex items-center gap-1 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <Card className="border-[#dee2e6]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0d6efd]/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#0d6efd]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold font-['Manrope'] text-[#212529]">
                {t('createTopic.title')}
              </CardTitle>
              <CardDescription className="text-[#6c757d]">
                {t('createTopic.subtitle')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#212529]">{t('createTopic.topicName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('createTopic.topicNamePlaceholder')}
                required
                className="border-[#dee2e6] bg-[#f8f9fa] focus:bg-white"
                data-testid="topic-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#212529]">{t('createTopic.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('createTopic.descriptionPlaceholder')}
                rows={4}
                className="border-[#dee2e6] bg-[#f8f9fa] focus:bg-white resize-none"
                data-testid="topic-description-input"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 border-[#dee2e6]"
              >
                {t('createTopic.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white"
                data-testid="submit-topic-btn"
              >
                {loading ? t('createTopic.creating') : t('createTopic.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTopicPage;
