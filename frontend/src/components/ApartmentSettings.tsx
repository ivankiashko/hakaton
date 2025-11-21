import React from 'react';
import { FloorPlan } from '../types';

interface ApartmentSettingsProps {
  settings: FloorPlan;
  onSettingsChange: (settings: Partial<FloorPlan>) => void;
}

export const ApartmentSettings: React.FC<ApartmentSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="glass p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
        Параметры квартиры
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Тип дома
          </label>
          <select
            value={settings.buildingType}
            onChange={(e) => onSettingsChange({ buildingType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          >
            <option value="panel">Панельный</option>
            <option value="brick">Кирпичный</option>
            <option value="monolith">Монолитный</option>
            <option value="block">Блочный</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Этаж
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.floor}
              onChange={(e) => onSettingsChange({ floor: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Всего этажей
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.totalFloors}
              onChange={(e) => onSettingsChange({ totalFloors: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hasGasSupply}
              onChange={(e) => onSettingsChange({ hasGasSupply: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{
                accentColor: 'var(--color-accent-primary)'
              }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Газовая плита на кухне
            </span>
          </label>
          {settings.hasGasSupply && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-caution)' }}>
              При наличии газа действуют дополнительные ограничения
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--color-accent-primary)' }}>
        <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text-heading)' }}>
          Совет:
        </h4>
        <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <li>Красные стены - несущие (нельзя демонтировать)</li>
          <li>Серые стены - перегородки (можно демонтировать)</li>
          <li>Для точного определения типа стен обратитесь к техническому паспорту БТИ</li>
        </ul>
      </div>
    </div>
  );
};
