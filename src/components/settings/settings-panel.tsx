import React, { useState } from 'react';
import { 
 
  Key, 
  Thermometer, 
 
 
 
  Save,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { useChatStore } from '../../stores/chat-store';
import { useLocalization } from '../../hooks/use-localization';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    apiKey,
    model,
    temperature,
    maxTokens,
    setApiKey,
    setModel,
    setTemperature,
    setMaxTokens,
    exportConversations,
    importConversations,
  } = useChatStore();
  
  const { t } = useLocalization();
  
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localMaxTokens, setLocalMaxTokens] = useState(maxTokens);

  // Load environment variable on component mount
  React.useEffect(() => {
    if (!localApiKey) {
      const envApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (envApiKey) {
        setLocalApiKey(envApiKey);
      }
    }
  }, [localApiKey]);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    setTemperature(localTemperature);
    setMaxTokens(localMaxTokens);
    toast.success('Settings saved successfully');
    onClose();
  };

  const handleExport = () => {
    const data = exportConversations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-conversations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Conversations exported successfully');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        importConversations(data);
        toast.success('Conversations imported successfully');
        event.target.value = ''; // Reset file input
      } catch (error) {
        toast.error('Failed to import conversations');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setLocalApiKey('');
      setLocalModel('claude-3-sonnet-20240229');
      setLocalTemperature(0.7);
      setLocalMaxTokens(4000);
      toast.success('Settings reset to defaults');
    }
  };

  const models = [
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      size="lg"
    >
      <div className="space-y-6">
        {/* API Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Key size={20} />
            API Configuration
          </h3>
          
          <Input
            label={t('settings.apiKey')}
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder={t('settings.apiKeyPlaceholder')}
            helperText="Your API key is stored locally and never sent to our servers"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.model')}
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Model Parameters */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Thermometer size={20} />
            Model Parameters
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.temperature')}: {localTemperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localTemperature}
              onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>
          
          <Input
            label={t('settings.maxTokens')}
            type="number"
            value={localMaxTokens}
            onChange={(e) => setLocalMaxTokens(parseInt(e.target.value) || 4000)}
            min="100"
            max="8000"
            step="100"
          />
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Save size={20} />
            Data Management
          </h3>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              icon={Download}
              size="sm"
            >
              {t('settings.exportSettings')}
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                icon={Upload}
                size="sm"
              >
                {t('settings.importSettings')}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleReset}
            variant="outline"
            icon={RotateCcw}
          >
            {t('settings.resetSettings')}
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};