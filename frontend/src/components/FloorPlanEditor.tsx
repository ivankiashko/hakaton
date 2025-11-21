import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group } from 'react-konva';
import { Wall, WallType, Door, Window } from '../types';
import { Home, Plus, Trash2 } from 'lucide-react';

interface FloorPlanEditorProps {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  onWallsChange: (walls: Wall[]) => void;
  onDoorsChange: (doors: Door[]) => void;
  onWindowsChange: (windows: Window[]) => void;
}

type Tool = 'select' | 'wall' | 'door' | 'window';

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  walls,
  doors,
  windows,
  onWallsChange,
  onDoorsChange,
  onWindowsChange,
}) => {
  const [tool, setTool] = useState<Tool>('wall');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [wallType, setWallType] = useState<WallType>(WallType.NON_LOAD_BEARING);
  const stageRef = useRef<any>(null);

  const SCALE = 10; // 10 пикселей = 1 мм
  const GRID_SIZE = 50; // 500 мм = 50 см

  const handleMouseDown = (e: any) => {
    if (tool !== 'wall') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // Привязка к сетке
    const x = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;

    setIsDrawing(true);
    setCurrentLine({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool !== 'wall') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // Привязка к сетке
    const x = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;

    if (currentLine) {
      setCurrentLine({ ...currentLine, x2: x, y2: y });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentLine) return;

    // Создаем стену только если она не нулевой длины
    const length = Math.sqrt(
      Math.pow(currentLine.x2 - currentLine.x1, 2) +
      Math.pow(currentLine.y2 - currentLine.y1, 2)
    );

    if (length > 10) {
      const newWall: Wall = {
        id: `wall-${Date.now()}`,
        type: wallType,
        x1: currentLine.x1,
        y1: currentLine.y1,
        x2: currentLine.x2,
        y2: currentLine.y2,
        thickness: wallType === WallType.LOAD_BEARING ? 200 : 100,
      };
      onWallsChange([...walls, newWall]);
    }

    setIsDrawing(false);
    setCurrentLine(null);
  };

  const handleWallClick = (wallId: string) => {
    if (tool === 'select') {
      setSelectedWallId(wallId);
    } else if (tool === 'door') {
      addDoorToWall(wallId);
    } else if (tool === 'window') {
      addWindowToWall(wallId);
    }
  };

  const addDoorToWall = (wallId: string) => {
    const newDoor: Door = {
      id: `door-${Date.now()}`,
      wallId,
      position: 0.5,
      width: 900,
    };
    onDoorsChange([...doors, newDoor]);
  };

  const addWindowToWall = (wallId: string) => {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      wallId,
      position: 0.5,
      width: 1400,
    };
    onWindowsChange([...windows, newWindow]);
  };

  const deleteSelectedWall = () => {
    if (!selectedWallId) return;
    onWallsChange(walls.filter(w => w.id !== selectedWallId));
    onDoorsChange(doors.filter(d => d.wallId !== selectedWallId));
    onWindowsChange(windows.filter(w => w.wallId !== selectedWallId));
    setSelectedWallId(null);
  };

  const renderGrid = () => {
    const lines = [];
    const width = 800;
    const height = 600;

    // Вертикальные линии
    for (let i = 0; i < width; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke="#1F2937"
          strokeWidth={1}
        />
      );
    }

    // Горизонтальные линии
    for (let i = 0; i < height; i += GRID_SIZE) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, width, i]}
          stroke="#1F2937"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  const renderWall = (wall: Wall) => {
    const isSelected = selectedWallId === wall.id;
    const color = wall.type === WallType.LOAD_BEARING ? '#ef4444' : '#94a3b8';

    return (
      <Group key={wall.id}>
        <Line
          points={[wall.x1, wall.y1, wall.x2, wall.y2]}
          stroke={color}
          strokeWidth={wall.thickness / 20}
          onClick={() => handleWallClick(wall.id)}
          onTap={() => handleWallClick(wall.id)}
        />
        {isSelected && (
          <>
            <Circle x={wall.x1} y={wall.y1} radius={5} fill="#3b82f6" />
            <Circle x={wall.x2} y={wall.y2} radius={5} fill="#3b82f6" />
          </>
        )}
      </Group>
    );
  };

  const renderDoor = (door: Door) => {
    const wall = walls.find(w => w.id === door.wallId);
    if (!wall) return null;

    const x = wall.x1 + (wall.x2 - wall.x1) * door.position;
    const y = wall.y1 + (wall.y2 - wall.y1) * door.position;
    const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

    return (
      <Group key={door.id} x={x} y={y} rotation={(angle * 180) / Math.PI}>
        <Rect
          x={-door.width / 20 / 2}
          y={-10}
          width={door.width / 20}
          height={20}
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth={2}
        />
      </Group>
    );
  };

  const renderWindow = (windowItem: Window) => {
    const wall = walls.find(w => w.id === windowItem.wallId);
    if (!wall) return null;

    const x = wall.x1 + (wall.x2 - wall.x1) * windowItem.position;
    const y = wall.y1 + (wall.y2 - wall.y1) * windowItem.position;
    const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

    return (
      <Group key={windowItem.id} x={x} y={y} rotation={(angle * 180) / Math.PI}>
        <Rect
          x={-windowItem.width / 20 / 2}
          y={-8}
          width={windowItem.width / 20}
          height={16}
          fill="#60a5fa"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      </Group>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Панель инструментов */}
      <div className="glass border-b p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setTool('select')}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            style={{
              border: tool === 'select' ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
              color: tool === 'select' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              background: 'transparent'
            }}
          >
            Выбрать
          </button>
          <button
            onClick={() => setTool('wall')}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            style={{
              border: tool === 'wall' ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
              color: tool === 'wall' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              background: 'transparent'
            }}
          >
            <Home size={18} />
            Стена
          </button>
          <button
            onClick={() => setTool('door')}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            style={{
              border: tool === 'door' ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
              color: tool === 'door' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              background: 'transparent'
            }}
          >
            <Plus size={18} />
            Дверь
          </button>
          <button
            onClick={() => setTool('window')}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            style={{
              border: tool === 'window' ? '1px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
              color: tool === 'window' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              background: 'transparent'
            }}
          >
            <Plus size={18} />
            Окно
          </button>

          {tool === 'wall' && (
            <select
              value={wallType}
              onChange={(e) => setWallType(e.target.value as WallType)}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value={WallType.NON_LOAD_BEARING}>Ненесущая стена</option>
              <option value={WallType.LOAD_BEARING}>Несущая стена</option>
              <option value={WallType.UNKNOWN}>Неизвестный тип</option>
            </select>
          )}

          {selectedWallId && (
            <button
              onClick={deleteSelectedWall}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all glow-critical"
              style={{
                border: '1px solid var(--color-critical)',
                color: 'var(--color-critical)',
                background: 'transparent'
              }}
            >
              <Trash2 size={18} />
              Удалить
            </button>
          )}
        </div>
        <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {tool === 'wall' && 'Нажмите и протяните, чтобы нарисовать стену'}
          {tool === 'door' && 'Нажмите на стену, чтобы добавить дверь'}
          {tool === 'window' && 'Нажмите на стену, чтобы добавить окно'}
          {tool === 'select' && 'Выберите элемент для редактирования'}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#0F1117' }}>
        <Stage
          width={800}
          height={600}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {/* Сетка */}
            {renderGrid()}

            {/* Стены */}
            {walls.map(renderWall)}

            {/* Текущая рисуемая линия */}
            {currentLine && (
              <Line
                points={[currentLine.x1, currentLine.y1, currentLine.x2, currentLine.y2]}
                stroke="#6366F1"
                strokeWidth={wallType === WallType.LOAD_BEARING ? 10 : 5}
                dash={[10, 5]}
              />
            )}

            {/* Двери */}
            {doors.map(renderDoor)}

            {/* Окна */}
            {windows.map(renderWindow)}
          </Layer>
        </Stage>
      </div>

      {/* Легенда */}
      <div className="glass border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2" style={{ backgroundColor: 'var(--color-critical)' }}></div>
            <span style={{ color: 'var(--color-text-primary)' }}>Несущие стены</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2" style={{ backgroundColor: '#94a3b8' }}></div>
            <span style={{ color: 'var(--color-text-primary)' }}>Ненесущие стены</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4" style={{ backgroundColor: '#fbbf24', border: '2px solid #f59e0b' }}></div>
            <span style={{ color: 'var(--color-text-primary)' }}>Двери</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4" style={{ backgroundColor: '#60a5fa', border: '2px solid #3b82f6' }}></div>
            <span style={{ color: 'var(--color-text-primary)' }}>Окна</span>
          </div>
        </div>
      </div>
    </div>
  );
};
