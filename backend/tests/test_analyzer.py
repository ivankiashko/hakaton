import pytest
from app.analyzer import RenovationAnalyzer
from app.models import (
    RenovationPlan, FloorPlan, Wall, Room, WallType, RoomType, RiskLevel
)


@pytest.fixture
def analyzer():
    """Создание экземпляра анализатора"""
    return RenovationAnalyzer()


@pytest.fixture
def basic_floor_plan():
    """Базовый план квартиры"""
    return FloorPlan(
        walls=[
            Wall(
                id="wall1",
                type=WallType.NON_LOAD_BEARING,
                points=[{"x": 0, "y": 0}, {"x": 100, "y": 0}]
            )
        ],
        doors=[],
        windows=[],
        rooms=[
            Room(
                id="room1",
                type=RoomType.LIVING,
                area=15,
                hasNaturalLight=True,
                hasVentilation=False
            )
        ],
        hasGasSupply=False,
        floor=5,
        totalFloors=9,
        buildingType="panel"
    )


def test_analyzer_initialization(analyzer):
    """Тест инициализации анализатора"""
    assert analyzer is not None
    assert analyzer.rules is not None
    assert "rules" in analyzer.rules


def test_analyze_non_load_bearing_wall_removal(analyzer, basic_floor_plan):
    """Тест демонтажа ненесущей стены"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "remove_wall",
                "data": {"wallId": "wall1"}
            }
        ],
        description="Демонтаж ненесущей перегородки"
    )

    result = analyzer.analyze(plan)

    assert result.isLegal is True
    assert len(result.warnings) > 0
    # Демонтаж ненесущей стены должен иметь низкий уровень риска
    wall_warning = next((w for w in result.warnings if "перегородк" in w.title.lower()), None)
    if wall_warning:
        assert wall_warning.level == RiskLevel.LOW


def test_analyze_load_bearing_wall_removal(analyzer, basic_floor_plan):
    """Тест демонтажа несущей стены"""
    # Изменяем тип стены на несущую
    basic_floor_plan.walls[0].type = WallType.LOAD_BEARING

    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "remove_wall",
                "data": {"wallId": "wall1"}
            }
        ],
        description="Демонтаж несущей стены"
    )

    result = analyzer.analyze(plan)

    # Демонтаж несущей стены критичен
    assert result.requiresApproval is True
    assert len(result.warnings) > 0

    # Проверяем наличие критического предупреждения
    critical_warnings = [w for w in result.warnings if w.level == RiskLevel.CRITICAL]
    assert len(critical_warnings) > 0


def test_analyze_kitchen_with_gas(analyzer, basic_floor_plan):
    """Тест объединения кухни с газом и жилой комнаты"""
    basic_floor_plan.hasGasSupply = True
    basic_floor_plan.rooms.append(
        Room(
            id="kitchen1",
            type=RoomType.KITCHEN,
            area=10,
            hasNaturalLight=True,
            hasVentilation=True
        )
    )

    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "combine_rooms",
                "data": {
                    "room1Type": "kitchen",
                    "room2Type": "living"
                }
            }
        ],
        description="Объединение кухни с газом и комнаты"
    )

    result = analyzer.analyze(plan)

    # Должно требовать согласования
    assert result.requiresApproval is True
    # Должно быть критическое предупреждение
    critical_warnings = [w for w in result.warnings if w.level == RiskLevel.CRITICAL]
    assert len(critical_warnings) > 0


def test_analyze_bathroom_relocation(analyzer, basic_floor_plan):
    """Тест переноса санузла"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "move_bathroom",
                "data": {"newLocation": "test"}
            }
        ],
        description="Перенос санузла"
    )

    result = analyzer.analyze(plan)

    # Перенос санузла требует согласования
    assert result.requiresApproval is True
    # Должны быть предупреждения высокого уровня
    high_warnings = [w for w in result.warnings if w.level == RiskLevel.HIGH]
    assert len(high_warnings) > 0


def test_analyze_balcony_combination(analyzer, basic_floor_plan):
    """Тест объединения с балконом"""
    basic_floor_plan.rooms.append(
        Room(
            id="balcony1",
            type=RoomType.BALCONY,
            area=3,
            hasNaturalLight=True,
            hasVentilation=True
        )
    )

    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "combine_rooms",
                "data": {
                    "room1Type": "living",
                    "room2Type": "balcony"
                }
            }
        ],
        description="Объединение с балконом"
    )

    result = analyzer.analyze(plan)

    # Должно требовать согласования
    assert result.requiresApproval is True
    # Должно быть критическое предупреждение
    critical_warnings = [w for w in result.warnings if w.level == RiskLevel.CRITICAL]
    assert len(critical_warnings) > 0


def test_analyze_window_size_change(analyzer, basic_floor_plan):
    """Тест изменения размера окна"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "change_window",
                "data": {"changeSize": True}
            }
        ],
        description="Изменение размера окна"
    )

    result = analyzer.analyze(plan)

    # Должно требовать согласования
    assert result.requiresApproval is True


def test_small_room_warning(analyzer):
    """Тест предупреждения о маленькой комнате"""
    floor_plan = FloorPlan(
        walls=[],
        doors=[],
        windows=[],
        rooms=[
            Room(
                id="room1",
                type=RoomType.LIVING,
                area=7,  # Меньше минимальных 9 м²
                hasNaturalLight=True,
                hasVentilation=False
            )
        ],
        hasGasSupply=False,
        floor=5,
        totalFloors=9,
        buildingType="panel"
    )

    plan = RenovationPlan(
        originalPlan=floor_plan,
        actions=[],
        description="Проверка маленькой комнаты"
    )

    result = analyzer.analyze(plan)

    # Должно быть предупреждение о площади
    area_warnings = [w for w in result.warnings if "площад" in w.title.lower()]
    assert len(area_warnings) > 0


def test_room_without_natural_light(analyzer):
    """Тест комнаты без естественного освещения"""
    floor_plan = FloorPlan(
        walls=[],
        doors=[],
        windows=[],
        rooms=[
            Room(
                id="room1",
                type=RoomType.LIVING,
                area=15,
                hasNaturalLight=False,  # Нет окна
                hasVentilation=False
            )
        ],
        hasGasSupply=False,
        floor=5,
        totalFloors=9,
        buildingType="panel"
    )

    plan = RenovationPlan(
        originalPlan=floor_plan,
        actions=[],
        description="Комната без окна"
    )

    result = analyzer.analyze(plan)

    # Должно быть критическое предупреждение
    critical_warnings = [w for w in result.warnings if w.level == RiskLevel.CRITICAL]
    assert len(critical_warnings) > 0


def test_estimate_approval_time_no_approval(analyzer, basic_floor_plan):
    """Тест оценки времени когда согласование не требуется"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[],
        description="Без изменений"
    )

    result = analyzer.analyze(plan)

    if not result.requiresApproval:
        assert "не требуется" in result.estimatedApprovalTime.lower()


def test_estimate_costs_no_approval(analyzer, basic_floor_plan):
    """Тест оценки стоимости когда согласование не требуется"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[],
        description="Без изменений"
    )

    result = analyzer.analyze(plan)

    if not result.requiresApproval:
        assert "0" in result.estimatedCost


def test_gas_supply_recommendation(analyzer, basic_floor_plan):
    """Тест рекомендации при наличии газа"""
    basic_floor_plan.hasGasSupply = True

    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[
            {
                "type": "remove_wall",
                "data": {"wallId": "wall1"}
            }
        ],
        description="Перепланировка с газом"
    )

    result = analyzer.analyze(plan)

    # Должна быть рекомендация о согласовании с газовой службой
    gas_recommendations = [r for r in result.recommendations if "газ" in r.lower()]
    assert len(gas_recommendations) > 0


def test_empty_actions_plan(analyzer, basic_floor_plan):
    """Тест плана без действий"""
    plan = RenovationPlan(
        originalPlan=basic_floor_plan,
        actions=[],
        description="План без изменений"
    )

    result = analyzer.analyze(plan)

    # План должен быть легальным
    assert result.isLegal is True
    # Могут быть предупреждения о текущем состоянии
    assert isinstance(result.warnings, list)
    assert isinstance(result.recommendations, list)
