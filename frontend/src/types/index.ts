export enum WallType {
  LOAD_BEARING = 'load_bearing',
  NON_LOAD_BEARING = 'non_load_bearing',
  UNKNOWN = 'unknown',
}

export enum RoomType {
  LIVING = 'living',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  TOILET = 'toilet',
  CORRIDOR = 'corridor',
  BALCONY = 'balcony',
  STORAGE = 'storage',
}

export interface Wall {
  id: string;
  type: WallType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
}

export interface Room {
  id: string;
  type: RoomType;
  area: number;
  hasGas: boolean;
  hasVentilation: boolean;
  hasNaturalLight: boolean;
}

export interface FloorPlan {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  hasGasSupply: boolean;
  floor: number;
  totalFloors: number;
  buildingType: string;
}

export enum RenovationAction {
  REMOVE_WALL = 'remove_wall',
  ADD_WALL = 'add_wall',
  MOVE_DOOR = 'move_door',
  MOVE_KITCHEN = 'move_kitchen',
  MOVE_BATHROOM = 'move_bathroom',
  EXPAND_BATHROOM = 'expand_bathroom',
  COMBINE_ROOMS = 'combine_rooms',
  CHANGE_WINDOW = 'change_window',
  ADD_BALCONY_GLAZING = 'add_balcony_glazing',
}

export interface RenovationPlan {
  originalPlan: FloorPlan;
  actions: Array<{
    type: string;
    data: any;
  }>;
  description: string;
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  SAFE = 'safe',
}

export interface Warning {
  level: RiskLevel;
  title: string;
  description: string;
  law: string;
  recommendations: string[];
  actionRequired: boolean;
}

export interface AnalysisResult {
  isLegal: boolean;
  requiresApproval: boolean;
  warnings: Warning[];
  recommendations: string[];
  estimatedApprovalTime?: string;
  estimatedCost?: string;
}
