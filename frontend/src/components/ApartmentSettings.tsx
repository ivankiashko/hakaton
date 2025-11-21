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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold mb-4">Параметры квартиры</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип дома
          </label>
          <select
            value={settings.buildingType}
            onChange={(e) => onSettingsChange({ buildingType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="panel">Панельный</option>
            <option value="brick">Кирпичный</option>
            <option value="monolith">Монолитный</option>
            <option value="block">Блочный</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Этаж
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.floor}
              onChange={(e) => onSettingsChange({ floor: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Всего этажей
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.totalFloors}
              onChange={(e) => onSettingsChange({ totalFloors: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hasGasSupply}
              onChange={(e) => onSettingsChange({ hasGasSupply: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Газовая плита на кухне
            </span>
          </label>
          {settings.hasGasSupply && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ При наличии газа действуют дополнительные ограничения
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Совет:</h4>
        <ul className="text-xs space-y-1 text-gray-700">
          <li>• Красные стены - несущие (нельзя демонтировать)</li>
          <li>• Серые стены - перегородки (можно демонтировать)</li>
          <li>• Для точного определения типа стен обратитесь к техническому паспорту БТИ</li>
        </ul>
      </div>
    </div>
  );
};
