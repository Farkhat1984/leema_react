/**
 * Global AI Config Page - Admin
 * Manage global AI configuration settings
 */

import { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { useGlobalConfig, useUpdateGlobalConfig } from '../../hooks/useAdminAgents';
import type { GlobalAIConfigUpdate } from '../../types/ai-agents.types';

export default function GlobalConfigPage() {
  const { data: config, isLoading } = useGlobalConfig();
  const { mutate: updateConfig, isPending } = useUpdateGlobalConfig();

  const { control, handleSubmit, watch, setValue } = useForm<GlobalAIConfigUpdate>({
    defaultValues: {
      max_temperature: config?.max_temperature || 2.0,
      max_tokens: config?.max_tokens || 8192,
      default_model: config?.default_model || 'gemini-2.0-flash-exp',
      rate_limit_per_hour: config?.rate_limit_per_hour || 1000,
    },
  });

  // Update form when config is loaded
  useState(() => {
    if (config) {
      setValue('max_temperature', config.max_temperature);
      setValue('max_tokens', config.max_tokens);
      setValue('default_model', config.default_model);
      setValue('rate_limit_per_hour', config.rate_limit_per_hour);
    }
  });

  const onSubmit = (data: GlobalAIConfigUpdate) => {
    updateConfig(data, {
      onSuccess: () => {
        toast.success('Конфигурация обновлена');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось обновить конфигурацию');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7" />
            Глобальная конфигурация AI
          </h1>
          <p className="text-gray-600 mt-1">Настройки по умолчанию для всех агентов</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Available Models */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Доступные модели</h3>

          {config && Object.keys(config.available_models).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(config.available_models).map(([key, model]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{model.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{model.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Макс. токенов: {model.max_tokens}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{key}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет доступных моделей</p>
          )}
        </div>

        {/* Limits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Лимиты</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Макс. температура: {watch('max_temperature')}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={watch('max_temperature') || 2.0}
              onChange={(e) => setValue('max_temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Максимальное значение температуры для агентов
            </p>
          </div>

          <FormInput
            control={control}
            name="max_tokens"
            label="Макс. токенов"
            type="number"
            min={100}
            max={16384}
          />

          <FormInput
            control={control}
            name="rate_limit_per_hour"
            label="Лимит запросов в час"
            type="number"
            min={1}
            max={10000}
          />
        </div>

        {/* Defaults */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">По умолчанию</h3>

          <FormSelect
            control={control}
            name="default_model"
            label="Модель по умолчанию"
            options={
              config
                ? Object.keys(config.available_models).map((key) => ({
                    value: key,
                    label: config.available_models[key].name,
                  }))
                : []
            }
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Сбросить
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </form>
    </div>
  );
}
