import json
from typing import List, Dict
from pathlib import Path
from .models import (
    RenovationPlan, AnalysisResult, Warning, RiskLevel,
    WallType, RoomType, RenovationAction
)


class RenovationAnalyzer:
    def __init__(self):
        # Загрузка правил из JSON
        rules_path = Path(__file__).parent.parent / "data" / "renovation_rules.json"
        with open(rules_path, 'r', encoding='utf-8') as f:
            self.rules = json.load(f)

    def analyze(self, plan: RenovationPlan) -> AnalysisResult:
        """Анализ плана перепланировки на соответствие законодательству"""
        warnings = []
        requires_approval = False
        is_legal = True
        recommendations = []

        # Анализируем каждое действие
        for action in plan.actions:
            action_type = action.get('type')
            action_data = action.get('data', {})

            if action_type == 'remove_wall':
                wall_warnings = self._check_wall_removal(action_data, plan)
                warnings.extend(wall_warnings)

            elif action_type == 'move_kitchen':
                kitchen_warnings = self._check_kitchen_relocation(action_data, plan)
                warnings.extend(kitchen_warnings)

            elif action_type == 'move_bathroom' or action_type == 'expand_bathroom':
                bathroom_warnings = self._check_bathroom_relocation(action_data, plan)
                warnings.extend(bathroom_warnings)

            elif action_type == 'combine_rooms':
                combine_warnings = self._check_room_combination(action_data, plan)
                warnings.extend(combine_warnings)

            elif action_type == 'change_window':
                window_warnings = self._check_window_changes(action_data, plan)
                warnings.extend(window_warnings)

        # Проверка общих требований
        general_warnings = self._check_general_requirements(plan)
        warnings.extend(general_warnings)

        # Определяем требуется ли согласование
        for warning in warnings:
            if warning.level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
                requires_approval = True
            if warning.level == RiskLevel.CRITICAL and not warning.actionRequired:
                is_legal = False

        # Добавляем рекомендации
        if requires_approval:
            recommendations.append("Необходимо получить разрешение на перепланировку в Жилищной инспекции")
            recommendations.append("Потребуется проект перепланировки от организации с допуском СРО")
            recommendations.append("После завершения работ необходим акт приемочной комиссии")

        if plan.originalPlan.hasGasSupply:
            recommendations.append("При наличии газа обязательно согласование с газовой службой")

        # Оценка сроков и стоимости
        estimated_time = self._estimate_approval_time(requires_approval, warnings)
        estimated_cost = self._estimate_costs(plan, warnings)

        return AnalysisResult(
            isLegal=is_legal,
            requiresApproval=requires_approval,
            warnings=warnings,
            recommendations=recommendations,
            estimatedApprovalTime=estimated_time,
            estimatedCost=estimated_cost
        )

    def _check_wall_removal(self, action_data: dict, plan: RenovationPlan) -> List[Warning]:
        """Проверка демонтажа стен"""
        warnings = []
        wall_id = action_data.get('wallId')

        # Находим стену в плане
        wall = None
        for w in plan.originalPlan.walls:
            if w.id == wall_id:
                wall = w
                break

        if not wall:
            return warnings

        if wall.type == WallType.LOAD_BEARING:
            rule = self.rules['rules']['loadBearingWalls']
            warnings.append(Warning(
                level=RiskLevel.CRITICAL,
                title=rule['name'],
                description="Демонтаж несущей стены категорически запрещен без специального проекта усиления конструкций",
                law=rule['law'],
                recommendations=rule['requirements'],
                actionRequired=True
            ))
        elif wall.type == WallType.NON_LOAD_BEARING:
            warnings.append(Warning(
                level=RiskLevel.LOW,
                title="Демонтаж ненесущей перегородки",
                description="Демонтаж разрешен, согласование обычно не требуется",
                law="СНиП 31-01-2003",
                recommendations=[
                    "Убедитесь, что стена не содержит важных коммуникаций",
                    "Проверьте отсутствие скрытой электропроводки",
                    "Рекомендуется консультация с инженером"
                ],
                actionRequired=False
            ))
        else:
            warnings.append(Warning(
                level=RiskLevel.HIGH,
                title="Неизвестный тип стены",
                description="Необходимо определить тип стены перед демонтажем",
                law="ЖК РФ ст. 26",
                recommendations=[
                    "Закажите техническое заключение о типе стены",
                    "Обратитесь к проектной организации",
                    "Изучите поэтажный план БТИ"
                ],
                actionRequired=True
            ))

        return warnings

    def _check_kitchen_relocation(self, action_data: dict, plan: RenovationPlan) -> List[Warning]:
        """Проверка переноса кухни"""
        warnings = []
        rule = self.rules['rules']['wetRooms']

        warnings.append(Warning(
            level=RiskLevel.CRITICAL,
            title="Перенос кухни",
            description="Перенос кухни запрещен, если новое расположение будет над жилой комнатой соседей снизу",
            law=rule['law'],
            recommendations=[
                "Кухню можно расширить за счет коридора или кладовой",
                "Запрещено размещать кухню над жилыми комнатами",
                "При наличии газа - обязательна дверь на кухню",
                "Минимальная площадь кухни - 5 м²"
            ],
            actionRequired=True
        ))

        if plan.originalPlan.hasGasSupply:
            gas_rule = self.rules['rules']['gasEquipment']
            warnings.append(Warning(
                level=RiskLevel.CRITICAL,
                title=gas_rule['name'],
                description="При наличии газа кухня должна иметь дверь и не может быть объединена с жилой комнатой",
                law=gas_rule['law'],
                recommendations=gas_rule['requirements'],
                actionRequired=True
            ))

        return warnings

    def _check_bathroom_relocation(self, action_data: dict, plan: RenovationPlan) -> List[Warning]:
        """Проверка переноса/расширения санузла"""
        warnings = []
        rule = self.rules['rules']['wetRooms']

        warnings.append(Warning(
            level=RiskLevel.HIGH,
            title="Перенос/расширение санузла",
            description="Санузел можно расширить только за счет нежилых помещений (коридор, кладовая)",
            law=rule['law'],
            recommendations=[
                "Запрещено размещать санузел над жилыми комнатами соседей",
                "Разрешено расширение за счет коридора, кладовой, встроенных шкафов",
                "Обязательна усиленная гидроизоляция пола",
                "Требуется согласование и проект",
                "Минимальная площадь совмещенного санузла - 3.8 м²"
            ],
            actionRequired=True
        ))

        return warnings

    def _check_room_combination(self, action_data: dict, plan: RenovationPlan) -> List[Warning]:
        """Проверка объединения комнат"""
        warnings = []

        room1_type = action_data.get('room1Type')
        room2_type = action_data.get('room2Type')

        # Проверка объединения кухни с газом и жилой комнаты
        if plan.originalPlan.hasGasSupply:
            if (room1_type == RoomType.KITCHEN and room2_type == RoomType.LIVING) or \
               (room2_type == RoomType.KITCHEN and room1_type == RoomType.LIVING):
                gas_rule = self.rules['rules']['gasEquipment']
                warnings.append(Warning(
                    level=RiskLevel.CRITICAL,
                    title="Объединение кухни с газом и комнаты",
                    description="Запрещено объединять кухню с газовой плитой и жилую комнату без раздвижной двери",
                    law=gas_rule['law'],
                    recommendations=[
                        "Необходима дверь между кухней с газом и жилой комнатой",
                        "Можно установить раздвижную или складную дверь",
                        "Альтернатива: замена газовой плиты на электрическую (требует согласования)",
                        "Минимальный объем кухни с газом - 8 м³"
                    ],
                    actionRequired=True
                ))

        # Проверка объединения с балконом
        if room2_type == RoomType.BALCONY or room1_type == RoomType.BALCONY:
            balcony_rule = self.rules['rules']['balcony']
            warnings.append(Warning(
                level=RiskLevel.CRITICAL,
                title="Объединение с балконом",
                description="Запрещено полностью сносить стену между комнатой и балконом",
                law=balcony_rule['law'],
                recommendations=[
                    "Запрещено сносить порожек - это часть несущей конструкции",
                    "Можно убрать окно и дверь, оставив подоконную часть",
                    "Запрещено выносить радиаторы на балкон",
                    "Требуется согласование и проект"
                ],
                actionRequired=True
            ))

        return warnings

    def _check_window_changes(self, action_data: dict, plan: RenovationPlan) -> List[Warning]:
        """Проверка изменения окон"""
        warnings = []
        rule = self.rules['rules']['windows']

        if action_data.get('changeSize', False):
            warnings.append(Warning(
                level=RiskLevel.HIGH,
                title="Изменение размера оконного проема",
                description="Изменение размера окна на фасаде требует согласования",
                law=rule['law'],
                recommendations=[
                    "Требуется согласование с архитектурным управлением",
                    "Необходим проект изменения фасада",
                    "В историческом центре может быть запрещено",
                    "Замена окна без изменения размера не требует согласования"
                ],
                actionRequired=True
            ))

        return warnings

    def _check_general_requirements(self, plan: RenovationPlan) -> List[Warning]:
        """Проверка общих требований"""
        warnings = []

        # Проверка вентиляции
        vent_rule = self.rules['rules']['ventilation']
        has_bathroom_vent = False
        has_kitchen_vent = False

        for room in plan.originalPlan.rooms:
            if room.type in [RoomType.BATHROOM, RoomType.TOILET]:
                has_bathroom_vent = has_bathroom_vent or room.hasVentilation
            if room.type == RoomType.KITCHEN:
                has_kitchen_vent = has_kitchen_vent or room.hasVentilation

        if not has_bathroom_vent or not has_kitchen_vent:
            warnings.append(Warning(
                level=RiskLevel.HIGH,
                title="Вентиляция",
                description="Обязательна естественная вентиляция в санузле и на кухне",
                law=vent_rule['law'],
                recommendations=vent_rule['requirements'],
                actionRequired=True
            ))

        # Проверка жилых комнат
        living_rule = self.rules['rules']['livingSpace']
        for room in plan.originalPlan.rooms:
            if room.type == RoomType.LIVING:
                if room.area < 9:
                    warnings.append(Warning(
                        level=RiskLevel.MEDIUM,
                        title="Площадь жилой комнаты",
                        description=f"Комната площадью {room.area} м² меньше минимальной нормы",
                        law=living_rule['law'],
                        recommendations=[
                            "Минимальная площадь жилой комнаты - 9 м²",
                            "Минимальная площадь спальни - 8 м²",
                            "Комнаты меньшей площади могут не считаться жилыми"
                        ],
                        actionRequired=False
                    ))

                if not room.hasNaturalLight:
                    warnings.append(Warning(
                        level=RiskLevel.CRITICAL,
                        title="Естественное освещение",
                        description="Жилая комната должна иметь естественное освещение (окно)",
                        law=living_rule['law'],
                        recommendations=[
                            "Обязательно окно в жилой комнате",
                            "Помещение без окна не может быть жилой комнатой"
                        ],
                        actionRequired=True
                    ))

        return warnings

    def _estimate_approval_time(self, requires_approval: bool, warnings: List[Warning]) -> str:
        """Оценка сроков согласования"""
        if not requires_approval:
            return "Согласование не требуется"

        has_critical = any(w.level == RiskLevel.CRITICAL for w in warnings)

        if has_critical:
            return "3-6 месяцев (требуется проект и согласования)"
        else:
            return "1-3 месяца (стандартная процедура)"

    def _estimate_costs(self, plan: RenovationPlan, warnings: List[Warning]) -> str:
        """Оценка стоимости согласования"""
        requires_approval = any(w.level in [RiskLevel.CRITICAL, RiskLevel.HIGH] for w in warnings)

        if not requires_approval:
            return "Согласование не требуется (0 руб.)"

        has_critical = any(w.level == RiskLevel.CRITICAL for w in warnings)

        if has_critical:
            return "От 50,000 до 150,000 руб. (проект + согласования)"
        else:
            return "От 25,000 до 50,000 руб. (согласования)"
