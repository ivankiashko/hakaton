import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Info, Clock, DollarSign } from 'lucide-react';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 mx-auto" style={{ borderBottom: '2px solid var(--color-accent-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Анализируем ваш план...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <Info size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-disabled)' }} />
          <p style={{ color: 'var(--color-text-primary)' }}>Создайте план и нажмите "Анализировать"</p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>чтобы проверить соответствие законодательству РФ</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL:
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'var(--color-critical)', text: 'var(--color-critical)' };
      case RiskLevel.HIGH:
        return { bg: 'rgba(249, 115, 22, 0.15)', border: 'var(--color-warning)', text: 'var(--color-warning)' };
      case RiskLevel.MEDIUM:
        return { bg: 'rgba(234, 179, 8, 0.15)', border: 'var(--color-caution)', text: 'var(--color-caution)' };
      case RiskLevel.LOW:
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'var(--color-info)', text: 'var(--color-info)' };
      case RiskLevel.SAFE:
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'var(--color-success)', text: 'var(--color-success)' };
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL:
      case RiskLevel.HIGH:
        return <XCircle style={{ color: getRiskColor(level).border }} />;
      case RiskLevel.MEDIUM:
        return <AlertTriangle style={{ color: getRiskColor(level).border }} />;
      case RiskLevel.LOW:
      case RiskLevel.SAFE:
        return <CheckCircle style={{ color: getRiskColor(level).border }} />;
    }
  };

  const getRiskLabel = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL:
        return 'КРИТИЧНО';
      case RiskLevel.HIGH:
        return 'ВЫСОКИЙ РИСК';
      case RiskLevel.MEDIUM:
        return 'СРЕДНИЙ РИСК';
      case RiskLevel.LOW:
        return 'НИЗКИЙ РИСК';
      case RiskLevel.SAFE:
        return 'БЕЗОПАСНО';
    }
  };

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Общий статус */}
      <div className="p-6 border-b-4" style={{
        backgroundColor: result.isLegal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderColor: result.isLegal ? 'var(--color-success)' : 'var(--color-critical)'
      }}>
        <div className="flex items-center gap-3">
          {result.isLegal ? (
            <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
          ) : (
            <XCircle size={32} style={{ color: 'var(--color-critical)' }} />
          )}
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
              {result.isLegal ? 'План допустим' : 'Обнаружены нарушения'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {result.requiresApproval
                ? 'Требуется согласование с жилищной инспекцией'
                : 'Согласование не требуется'}
            </p>
          </div>
        </div>

        {/* Сроки и стоимость */}
        {(result.estimatedApprovalTime || result.estimatedCost) && (
          <div className="mt-4 flex gap-4">
            {result.estimatedApprovalTime && (
              <div className="glass flex items-center gap-2 px-4 py-2 rounded-lg">
                <Clock size={18} style={{ color: 'var(--color-info)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Срок согласования</div>
                  <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{result.estimatedApprovalTime}</div>
                </div>
              </div>
            )}
            {result.estimatedCost && (
              <div className="glass flex items-center gap-2 px-4 py-2 rounded-lg">
                <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Стоимость</div>
                  <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{result.estimatedCost}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Предупреждения */}
      {result.warnings.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
            Предупреждения ({result.warnings.length})
          </h3>
          <div className="space-y-4">
            {result.warnings.map((warning, index) => {
              const colors = getRiskColor(warning.level);
              return (
                <div
                  key={index}
                  className="glass border-l-4 rounded-lg p-4"
                  style={{
                    borderLeftColor: colors.border,
                    backgroundColor: colors.bg
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getRiskIcon(warning.level)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          color: colors.text
                        }}>
                          {getRiskLabel(warning.level)}
                        </span>
                        <h4 className="font-bold" style={{ color: 'var(--color-text-heading)' }}>
                          {warning.title}
                        </h4>
                      </div>
                      <p className="text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
                        {warning.description}
                      </p>
                      <div className="text-xs glass p-2 rounded mb-3">
                        <strong style={{ color: 'var(--color-text-heading)' }}>Законодательство:</strong>{' '}
                        <span style={{ color: 'var(--color-text-secondary)' }}>{warning.law}</span>
                      </div>
                      {warning.recommendations.length > 0 && (
                        <div>
                          <strong className="text-sm" style={{ color: 'var(--color-text-heading)' }}>
                            Рекомендации:
                          </strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {warning.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {warning.actionRequired && (
                        <div className="mt-3 glass p-2 rounded text-sm font-semibold" style={{ color: 'var(--color-caution)' }}>
                          Требуется обязательное согласование
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Рекомендации */}
      {result.recommendations.length > 0 && (
        <div className="p-6 glass m-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
            Общие рекомендации
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={18} className="mt-1 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-text-primary)' }}>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Отсутствие предупреждений */}
      {result.warnings.length === 0 && (
        <div className="p-6 text-center">
          <CheckCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>Отлично!</h3>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Нарушений законодательства не обнаружено
          </p>
        </div>
      )}
    </div>
  );
};
