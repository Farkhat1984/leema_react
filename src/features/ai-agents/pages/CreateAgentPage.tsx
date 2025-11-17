/**
 * Create AI Agent Page - Shop Owner
 * Multi-step form for creating a new AI agent
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { FormCheckbox } from '@/shared/components/forms/FormCheckbox';
import { agentCreateSchema, type AgentCreateFormData } from '../schemas/agent-form.schema';
import { useTemplates, useTools, useCreateAgent } from '../hooks/useAgents';
import type { AgentTemplateResponse } from '../types/ai-agents.types';

export default function CreateAgentPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplateResponse | null>(null);
  const [knowledgeBasePairs, setKnowledgeBasePairs] = useState<Array<{ question: string; answer: string }>>([]);

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: tools, isLoading: toolsLoading } = useTools();
  const { mutate: createAgent, isPending } = useCreateAgent();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<AgentCreateFormData>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      template_id: null,
      name: '',
      description: null,
      system_prompt: null,
      custom_instructions: null,
      config: {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        max_tokens: 1024,
        language: 'ru',
        tone: 'friendly',
        enabled_tools: [],
        response_style: 'balanced',
        working_hours: null,
        fallback_message: null,
        knowledge_base: {},
      },
    },
  });

  const templateId = watch('template_id');
  const enabledTools = watch('config.enabled_tools') || [];

  // Handle template selection
  const handleTemplateSelect = (template: AgentTemplateResponse | null) => {
    setSelectedTemplate(template);
    setValue('template_id', template?.id || null);

    if (template) {
      // Pre-fill config from template
      setValue('config.model', template.default_config.model);
      setValue('config.temperature', template.default_config.temperature);
      setValue('config.max_tokens', template.default_config.max_tokens);
      setValue('config.language', template.default_config.language);
      setValue('config.tone', template.default_config.tone);
      setValue('config.enabled_tools', template.default_config.enabled_tools);
      setValue('config.response_style', template.default_config.response_style);
    }
  };

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
  const onSubmit = (data: AgentCreateFormData) => {
    // Build knowledge base from pairs
    const knowledgeBase: Record<string, string> = {};
    knowledgeBasePairs.forEach(pair => {
      if (pair.question.trim() && pair.answer.trim()) {
        knowledgeBase[pair.question] = pair.answer;
      }
    });

    const payload = {
      ...data,
      config: {
        ...data.config,
        knowledge_base: Object.keys(knowledgeBase).length > 0 ? knowledgeBase : undefined,
      },
    };

    createAgent(payload, {
      onSuccess: (response) => {
        toast.success(`Агент "${response.name}" успешно создан`);
        navigate('/shop/ai-agents');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось создать агента');
      },
    });
  };

  const totalSteps = 5;
  const canGoNext = () => {
    if (currentStep === 1) return true; // Template is optional
    if (currentStep === 2) {
      // Must have name and either template or system_prompt
      const name = watch('name');
      const systemPrompt = watch('system_prompt');
      return name && (templateId || systemPrompt);
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (templatesLoading || toolsLoading) {
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
            <Bot className="w-7 h-7" />
            Создать AI Агента
          </h1>
          <p className="text-gray-600 mt-1">Шаг {currentStep} из {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs text-gray-600 mt-2">
          <div>Шаблон</div>
          <div>Основная информация</div>
          <div>Настройки</div>
          <div>Инструменты</div>
          <div>База знаний</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Выбор шаблона (опционально)</h3>
              <p className="text-sm text-gray-600">
                Выберите готовый шаблон или начните с нуля
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start from scratch */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    !selectedTemplate
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleTemplateSelect(null)}
                >
                  <h4 className="font-medium">Начать с нуля</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Создайте собственного агента без шаблона
                  </p>
                </div>

                {/* Template cards */}
                {templates?.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.default_config.enabled_tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                      {template.default_config.enabled_tools.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{template.default_config.enabled_tools.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
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

              {!templateId && (
                <FormTextarea
                  control={control}
                  name="system_prompt"
                  label="Системный промпт"
                  placeholder="Ты — полезный AI-ассистент, который помогает клиентам интернет-магазина модной одежды..."
                  rows={6}
                  required
                  error={errors.system_prompt?.message}
                />
              )}

              <FormTextarea
                control={control}
                name="custom_instructions"
                label="Дополнительные инструкции"
                placeholder="Дополнительные указания для агента (до 2000 символов)"
                rows={4}
                error={errors.custom_instructions?.message}
              />
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
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
                  value={watch('config.temperature')}
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
                  value={watch('config.max_tokens')}
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
          )}

          {/* Step 4: Tools */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Инструменты</h3>
              <p className="text-sm text-gray-600">
                Выберите инструменты, которые будут доступны агенту
              </p>

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
          )}

          {/* Step 5: Knowledge Base */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">База знаний (опционально)</h3>
              <p className="text-sm text-gray-600">
                Добавьте пары вопрос-ответ для обучения агента
              </p>

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
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Назад
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/shop/ai-agents')}
            >
              Отмена
            </Button>
            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep} disabled={!canGoNext()}>
                Далее
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !canGoNext()}>
                <Save className="w-4 h-4 mr-2" />
                {isPending ? 'Создание...' : 'Создать агента'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
