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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Анализируем ваш план...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <Info size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Создайте план и нажмите "Анализировать"</p>
          <p className="text-sm mt-2">чтобы проверить соответствие законодательству РФ</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL:
        return 'bg-red-100 border-red-500 text-red-900';
      case RiskLevel.HIGH:
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case RiskLevel.MEDIUM:
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case RiskLevel.LOW:
        return 'bg-blue-100 border-blue-500 text-blue-900';
      case RiskLevel.SAFE:
        return 'bg-green-100 border-green-500 text-green-900';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL:
      case RiskLevel.HIGH:
        return <XCircle className="text-red-600" />;
      case RiskLevel.MEDIUM:
        return <AlertTriangle className="text-yellow-600" />;
      case RiskLevel.LOW:
      case RiskLevel.SAFE:
        return <CheckCircle className="text-green-600" />;
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
    <div className="h-full overflow-auto bg-gray-50">
      {/* Общий статус */}
      <div className={`p-6 ${result.isLegal ? 'bg-green-50' : 'bg-red-50'} border-b-4 ${result.isLegal ? 'border-green-500' : 'border-red-500'}`}>
        <div className="flex items-center gap-3">
          {result.isLegal ? (
            <CheckCircle size={32} className="text-green-600" />
          ) : (
            <XCircle size={32} className="text-red-600" />
          )}
          <div>
            <h2 className="text-2xl font-bold">
              {result.isLegal ? 'План допустим' : 'Обнаружены нарушения'}
            </h2>
            <p className="text-sm mt-1">
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
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <Clock size={18} className="text-blue-600" />
                <div>
                  <div className="text-xs text-gray-600">Срок согласования</div>
                  <div className="font-semibold">{result.estimatedApprovalTime}</div>
                </div>
              </div>
            )}
            {result.estimatedCost && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
                <div>
                  <div className="text-xs text-gray-600">Стоимость</div>
                  <div className="font-semibold">{result.estimatedCost}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Предупреждения */}
      {result.warnings.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Предупреждения ({result.warnings.length})</h3>
          <div className="space-y-4">
            {result.warnings.map((warning, index) => (
              <div
                key={index}
                className={`border-l-4 rounded-lg p-4 ${getRiskColor(warning.level)}`}
              >
                <div className="flex items-start gap-3">
                  {getRiskIcon(warning.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-white rounded">
                        {getRiskLabel(warning.level)}
                      </span>
                      <h4 className="font-bold">{warning.title}</h4>
                    </div>
                    <p className="text-sm mb-3">{warning.description}</p>
                    <div className="text-xs bg-white bg-opacity-50 p-2 rounded mb-3">
                      <strong>Законодательство:</strong> {warning.law}
                    </div>
                    {warning.recommendations.length > 0 && (
                      <div>
                        <strong className="text-sm">Рекомендации:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          {warning.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {warning.actionRequired && (
                      <div className="mt-3 bg-white bg-opacity-70 p-2 rounded text-sm font-semibold">
                        ⚠️ Требуется обязательное согласование
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Рекомендации */}
      {result.recommendations.length > 0 && (
        <div className="p-6 bg-white">
          <h3 className="text-lg font-bold mb-4">Общие рекомендации</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 mt-1 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Отсутствие предупреждений */}
      {result.warnings.length === 0 && (
        <div className="p-6 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-700">Отлично!</h3>
          <p className="text-gray-600 mt-2">Нарушений законодательства не обнаружено</p>
        </div>
      )}
    </div>
  );
};
