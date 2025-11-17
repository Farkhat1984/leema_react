/**
 * Conversation Details Modal
 * Shows the full conversation history with messages
 */

import { MessageSquare, X, User, Bot as BotIcon } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { useConversationDetails } from '../hooks/useAgents';
import { formatDate } from '@/shared/lib/utils';

interface ConversationDetailsModalProps {
  agentId: number;
  conversationId: number;
  onClose: () => void;
}

export function ConversationDetailsModal({
  agentId,
  conversationId,
  onClose,
}: ConversationDetailsModalProps) {
  const { data: conversation, isLoading } = useConversationDetails(agentId, conversationId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error'> = {
      active: 'warning',
      resolved: 'success',
      escalated: 'error',
    };
    const labels: Record<string, string> = {
      active: 'Активный',
      resolved: 'Завершен',
      escalated: 'Эскалирован',
    };
    return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>;
  };

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Разговор с {conversation?.customer_phone}
            </h2>
            {conversation && (
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge(conversation.status)}
                <span className="text-sm text-gray-600">
                  {formatDate(conversation.started_at)} - {formatDate(conversation.last_message_at)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : conversation && conversation.messages.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-600'
                      : message.role === 'assistant'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : message.role === 'assistant' ? (
                    <BotIcon className="w-4 h-4" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1">
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'assistant'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-50 text-gray-700 border border-yellow-200'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                    {/* Tool Calls */}
                    {message.tool_calls && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer opacity-75 hover:opacity-100">
                          Вызовы инструментов
                        </summary>
                        <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                          {JSON.stringify(message.tool_calls, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Tool Results */}
                    {message.tool_results && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer opacity-75 hover:opacity-100">
                          Результаты инструментов
                        </summary>
                        <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                          {JSON.stringify(message.tool_results, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div
                    className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    {formatDate(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">Нет сообщений</div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </Modal>
  );
}
