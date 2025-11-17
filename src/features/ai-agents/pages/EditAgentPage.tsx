/**
 * Edit AI Agent Page - Shop Owner
 * Edit existing AI agent configuration
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { agentUpdateSchema, type AgentUpdateFormData } from '../schemas/agent-form.schema';
import { useAgent, useTools, useUpdateAgent } from '../hooks/useAgents';

export default function EditAgentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const agentId = parseInt(id || '0');

  const [knowledgeBasePairs, setKnowledgeBasePairs] = useState<Array<{ question: string; answer: string }>>([]);

  const { data: agent, isLoading: agentLoading } = useAgent(agentId);
  const { data: tools, isLoading: toolsLoading } = useTools();
  const { mutate: updateAgent, isPending } = useUpdateAgent();

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AgentUpdateFormData>({
    resolver: zodResolver(agentUpdateSchema),
  });

  const enabledTools = watch('config.enabled_tools') || [];

  // Load agent data
  useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description,
        custom_instructions: agent.custom_instructions,
        config: {
          model: agent.config.model,
          temperature: agent.config.temperature,
          max_tokens: agent.config.max_tokens,
          language: agent.config.language,
          tone: agent.config.tone,
          enabled_tools: agent.config.enabled_tools,
          response_style: agent.config.response_style,
          working_hours: agent.config.working_hours,
          fallback_message: agent.config.fallback_message,
          knowledge_base: agent.config.knowledge_base,
        },
      });

      // Load knowledge base
      if (agent.config.knowledge_base) {
        const pairs = Object.entries(agent.config.knowledge_base).map(([question, answer]) => ({
          question,
          answer,
        }));
        setKnowledgeBasePairs(pairs);
      }
    }
  }, [agent, reset]);

  // Handle tool toggle
  const handleToolToggle = (toolName: string, checked: boolean) => {
    if (checked) {
      setValue('config.enabled_tools', [...enabledTools, toolName]);
    } else {
      setValue('config.enabled_tools', enabledTools.filter(t => t !== toolName));
    }
  };

  // Handle knowledge base
  const addKnowledgePair = () => {
    setKnowledgeBasePairs([...knowledgeBasePairs, { question: '', answer: '' }]);
  };

  const removeKnowledgePair = (index: number) => {
    setKnowledgeBasePairs(knowledgeBasePairs.filter((_, i) => i !== index));
  };

  const updateKnowledgePair = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...knowledgeBasePairs];
    updated[index][field] = value;
    setKnowledgeBasePairs(updated);
  };

  // Handle form submission
  const onSubmit = (data: AgentUpdateFormData) => {
    // Build knowledge base from pairs
    const knowledgeBase: Record<string, string> = {};
    knowledgeBasePairs.forEach(pair => {
      if (pair.question.trim() && pair.answer.trim()) {
        knowledgeBase[pair.question] = pair.answer;
      }
    });

    const payload = {
      ...data,
      config: data.config ? {
        ...data.config,
        knowledge_base: Object.keys(knowledgeBase).length > 0 ? knowledgeBase : undefined,
      } : undefined,
    };

    updateAgent({ agentId, data: payload }, {
      onSuccess: (response) => {
        toast.success(`Агент "${response.name}" успешно обновлен`);
        navigate(`/shop/ai-agents/${agentId}`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось обновить агента');
      },
    });
  };

  if (agentLoading || toolsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Агент не найден</p>
          <Button onClick={() => navigate('/shop/ai-agents')} className="mt-4">
            Вернуться к списку
          </Button>
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
            <Bot className="w-7 h-7" />
            Редактировать агента
          </h1>
          <p className="text-gray-600 mt-1">{agent.name}</p>
        </div>
      </div>

      {/* Template Info (Read-only) */}
      {agent.template_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Шаблон:</strong> #{agent.template_id}
            <span className="ml-2 text-xs">(Системный промпт нельзя редактировать)</span>
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Основная информация</h3>

          <FormInput
            control={control}
            name="name"
            label="Название агента"
            placeholder="Мой AI помощник"
            required
            error={errors.name?.message}
          />

          <FormTextarea
            control={control}
            name="description"
            label="Описание"
            placeholder="Краткое описание назначения агента"
            rows={3}
            error={errors.description?.message}
          />

          <FormTextarea
            control={control}
            name="custom_instructions"
            label="Дополнительные инструкции"
            placeholder="Дополнительные указания для агента (до 2000 символов)"
            rows={4}
            error={errors.custom_instructions?.message}
          />
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Настройки</h3>

          <FormSelect
            control={control}
            name="config.model"
            label="Модель AI"
            options={[
              { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (быстрая)' },
              { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
              { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (продвинутая)' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Температура: {watch('config.temperature')}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={watch('config.temperature') || 0.7}
              onChange={(e) => setValue('config.temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Контролирует случайность ответов (0 = точные, 2 = творческие)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Макс. токенов: {watch('config.max_tokens')}
            </label>
            <input
              type="range"
              min="100"
              max="8192"
              step="100"
              value={watch('config.max_tokens') || 1024}
              onChange={(e) => setValue('config.max_tokens', parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Максимальная длина ответа</p>
          </div>

          <FormSelect
            control={control}
            name="config.language"
            label="Язык"
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'kk', label: 'Қазақша' },
              { value: 'en', label: 'English' },
            ]}
          />

          <FormInput
            control={control}
            name="config.tone"
            label="Тон общения"
            placeholder="friendly"
          />

          <FormSelect
            control={control}
            name="config.response_style"
            label="Стиль ответов"
            options={[
              { value: 'concise', label: 'Краткий' },
              { value: 'balanced', label: 'Сбалансированный' },
              { value: 'detailed', label: 'Подробный' },
            ]}
          />
        </div>

        {/* Tools */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Инструменты</h3>

          <div className="space-y-2">
            {tools?.map((tool) => (
              <label
                key={tool.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={enabledTools.includes(tool.name)}
                  onChange={(e) => handleToolToggle(tool.name, e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-xs text-gray-500">v{tool.version}</span>
                    {tool.is_experimental && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Экспериментальный
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">База знаний</h3>

          <div className="space-y-3">
            {knowledgeBasePairs.map((pair, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Пара #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeKnowledgePair(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pair.question}
                  onChange={(e) => updateKnowledgePair(index, 'question', e.target.value)}
                  placeholder="Вопрос"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={pair.answer}
                  onChange={(e) => updateKnowledgePair(index, 'answer', e.target.value)}
                  placeholder="Ответ"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addKnowledgePair}>
            + Добавить пару
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/shop/ai-agents/${agentId}`)}
          >
            Отмена
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
