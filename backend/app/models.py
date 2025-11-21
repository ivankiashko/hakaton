from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum


class WallType(str, Enum):
    LOAD_BEARING = "load_bearing"
    NON_LOAD_BEARING = "non_load_bearing"
    UNKNOWN = "unknown"


class RoomType(str, Enum):
    LIVING = "living"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    TOILET = "toilet"
    CORRIDOR = "corridor"
    BALCONY = "balcony"
    STORAGE = "storage"


class Wall(BaseModel):
    id: str
    type: WallType
    x1: float
    y1: float
    x2: float
    y2: float
    thickness: float = 200  # мм


class Door(BaseModel):
    id: str
    wallId: str
    position: float  # позиция на стене (0-1)
    width: float = 900  # мм


class Window(BaseModel):
    id: str
    wallId: str
    position: float
    width: float = 1400  # мм


class Room(BaseModel):
    id: str
    type: RoomType
    area: float  # м²
    hasGas: bool = False
    hasVentilation: bool = True
    hasNaturalLight: bool = True


class FloorPlan(BaseModel):
    walls: List[Wall]
    doors: List[Door]
    windows: List[Window]
    rooms: List[Room]
    hasGasSupply: bool = False
    floor: int = 1
    totalFloors: int = 9
    buildingType: str = "panel"  # panel, brick, monolith


class RenovationAction(str, Enum):
    REMOVE_WALL = "remove_wall"
    ADD_WALL = "add_wall"
    MOVE_DOOR = "move_door"
    MOVE_KITCHEN = "move_kitchen"
    MOVE_BATHROOM = "move_bathroom"
    EXPAND_BATHROOM = "expand_bathroom"
    COMBINE_ROOMS = "combine_rooms"
    CHANGE_WINDOW = "change_window"
    ADD_BALCONY_GLAZING = "add_balcony_glazing"


class RenovationPlan(BaseModel):
    originalPlan: FloorPlan
    actions: List[dict]
    description: str = ""


class RiskLevel(str, Enum):
    CRITICAL = "critical"  # Запрещено законом
    HIGH = "high"  # Требует обязательного согласования
    MEDIUM = "medium"  # Требует согласования в некоторых случаях
    LOW = "low"  # Не требует согласования
    SAFE = "safe"  # Полностью безопасно


class Warning(BaseModel):
    level: RiskLevel
    title: str
    description: str
    law: str
    recommendations: List[str]
    actionRequired: bool


class AnalysisResult(BaseModel):
    isLegal: bool
    requiresApproval: bool
    warnings: List[Warning]
    recommendations: List[str]
    estimatedApprovalTime: Optional[str] = None
    estimatedCost: Optional[str] = None
