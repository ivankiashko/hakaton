import React, { useState, Suspense } from 'react';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ApartmentSettings } from './components/ApartmentSettings';
import { OwnerDataForm, ApartmentDataForm, OwnerData, ApartmentData } from './components/OwnerDataForm';
import { DocumentGenerator } from './components/DocumentGenerator';
import {
  FloorPlan,
  Wall,
  Door,
  Window,
  Room,
  RenovationPlan,
  AnalysisResult,
  WallType,
} from './types';
import { api } from './api/client';
import { Home, FileText, Download, Upload, Box, FileCheck } from 'lucide-react';

// Lazy load 3D component
const FloorPlan3D = React.lazy(() => import('./components/FloorPlan3D'));

function App() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<FloorPlan>({
    walls: [],
    doors: [],
    windows: [],
    rooms: [],
    hasGasSupply: false,
    floor: 1,
    totalFloors: 9,
    buildingType: 'panel',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | '3d' | 'documents'>('editor');

  // Данные для документов
  const [ownerData, setOwnerData] = useState<OwnerData>({
    full_name: '',
    passport_series: '',
    passport_number: '',
    passport_issued_by: '',
    passport_issued_date: '',
    phone: '',
    email: '',
    registration_address: ''
  });

  const [apartmentData, setApartmentData] = useState<ApartmentData>({
    address: '',
    apartment_number: '',
    cadastral_number: '',
    total_area: '',
    building_year: '',
    building_series: ''
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setActiveTab('analysis');

    try {
      // Определяем действия на основе изменений
      const actions = [];

      // Проверяем удаление несущих стен
      const removedLoadBearingWalls = walls.filter(
        w => w.type === WallType.LOAD_BEARING
      );

      if (removedLoadBearingWalls.length > 0) {
        removedLoadBearingWalls.forEach(wall => {
          actions.push({
            type: 'remove_wall',
            data: { wallId: wall.id, wallType: wall.type },
          });
        });
      }

      // Создаем план для анализа
      const plan: RenovationPlan = {
        originalPlan: {
          ...settings,
          walls,
          doors,
          windows,
          rooms,
        },
        actions,
        description: 'Анализ плана перепланировки',
      };

      const result = await api.analyzeRenovation(plan);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing renovation:', error);
      alert('Ошибка при анализе. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: Partial<FloorPlan>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleClear = () => {
    if (confirm('Очистить весь план?')) {
      setWalls([]);
      setDoors([]);
      setWindows([]);
      setRooms([]);
      setAnalysisResult(null);
    }
  };

  const handleExport = () => {
    const data = {
      walls,
      doors,
      windows,
      rooms,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setWalls(data.walls || []);
        setDoors(data.doors || []);
        setWindows(data.windows || []);
        setRooms(data.rooms || []);
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        alert('Ошибка при загрузке файла');
      }
    };
    reader.readAsText(file);
  };

  const loadExample = () => {
    // Пример типовой хрущевки
    const exampleWalls: Wall[] = [
      // Наружные стены (несущие)
      { id: 'w1', type: WallType.LOAD_BEARING, x1: 100, y1: 100, x2: 600, y2: 100, thickness: 200 },
      { id: 'w2', type: WallType.LOAD_BEARING, x1: 600, y1: 100, x2: 600, y2: 500, thickness: 200 },
      { id: 'w3', type: WallType.LOAD_BEARING, x1: 600, y1: 500, x2: 100, y2: 500, thickness: 200 },
      { id: 'w4', type: WallType.LOAD_BEARING, x1: 100, y1: 500, x2: 100, y2: 100, thickness: 200 },
      // Внутренние перегородки (ненесущие)
      { id: 'w5', type: WallType.NON_LOAD_BEARING, x1: 350, y1: 100, x2: 350, y2: 300, thickness: 100 },
      { id: 'w6', type: WallType.NON_LOAD_BEARING, x1: 100, y1: 300, x2: 350, y2: 300, thickness: 100 },
    ];

    const exampleDoors: Door[] = [
      { id: 'd1', wallId: 'w5', position: 0.6, width: 800 },
      { id: 'd2', wallId: 'w6', position: 0.3, width: 700 },
    ];

    const exampleWindows: Window[] = [
      { id: 'win1', wallId: 'w1', position: 0.3, width: 1500 },
      { id: 'win2', wallId: 'w1', position: 0.7, width: 1500 },
    ];

    setWalls(exampleWalls);
    setDoors(exampleDoors);
    setWindows(exampleWindows);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home size={32} />
              <div>
                <h1 className="text-2xl font-bold">Планировщик ремонта</h1>
                <p className="text-sm text-blue-100">
                  Проверка перепланировки по законодательству РФ
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadExample}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm flex items-center gap-2"
              >
                <FileText size={18} />
                Загрузить пример
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm flex items-center gap-2"
                disabled={walls.length === 0}
              >
                <Download size={18} />
                Экспорт
              </button>
              <label className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm flex items-center gap-2 cursor-pointer">
                <Upload size={18} />
                Импорт
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Settings */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-auto">
          <div className="p-4">
            <ApartmentSettings settings={settings} onSettingsChange={handleSettingsChange} />

            <div className="mt-6 space-y-2">
              <button
                onClick={handleAnalyze}
                disabled={walls.length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Анализировать план
              </button>
              <button
                onClick={handleClear}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Очистить
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Статистика</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Стен:</span>
                  <span className="font-semibold">{walls.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Дверей:</span>
                  <span className="font-semibold">{doors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Окон:</span>
                  <span className="font-semibold">{windows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Несущих стен:</span>
                  <span className="font-semibold text-red-600">
                    {walls.filter(w => w.type === WallType.LOAD_BEARING).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Tabs */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-6 py-3 font-semibold flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'editor'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={18} />
                Редактор 2D
              </button>
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-6 py-3 font-semibold flex items-center gap-2 whitespace-nowrap ${
                  activeTab === '3d'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Box size={18} />
                3D визуализация
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-3 font-semibold flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'analysis'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileCheck size={18} />
                Анализ
                {analysisResult && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    analysisResult.isLegal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {analysisResult.warnings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-3 font-semibold flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'documents'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={18} />
                Документы
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <FloorPlanEditor
                walls={walls}
                doors={doors}
                windows={windows}
                onWallsChange={setWalls}
                onDoorsChange={setDoors}
                onWindowsChange={setWindows}
              />
            )}

            {activeTab === '3d' && (
              <div className="h-full p-4 overflow-auto">
                {walls.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        3D визуализация недоступна
                      </h3>
                      <p className="text-gray-500">
                        Сначала создайте план в редакторе 2D
                      </p>
                    </div>
                  </div>
                ) : (
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Загрузка 3D визуализации...</div>
                    </div>
                  }>
                    <FloorPlan3D plan={{ ...settings, walls, doors, windows, rooms }} />
                  </Suspense>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <AnalysisPanel result={analysisResult} loading={loading} />
            )}

            {activeTab === 'documents' && (
              <div className="h-full p-6 overflow-auto bg-gray-50">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Генерация документов</h2>
                    <p className="text-gray-600">
                      Заполните данные для автоматической генерации документов по российским стандартам
                    </p>
                  </div>

                  <OwnerDataForm data={ownerData} onChange={setOwnerData} />
                  <ApartmentDataForm data={apartmentData} onChange={setApartmentData} />

                  <DocumentGenerator
                    plan={{ ...settings, walls, doors, windows, rooms }}
                    analysis={analysisResult}
                    ownerData={ownerData}
                    apartmentData={apartmentData}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-3 px-4 text-center text-sm">
        <p>
          © 2024 Планировщик ремонта | Все данные основаны на ЖК РФ, СНиП, СанПиН |{' '}
          <span className="text-yellow-400">
            ⚠️ Для точного анализа обратитесь к специалистам
          </span>
        </p>
      </footer>
    </div>
  );
}

export default App;
