import pytest
from httpx import AsyncClient
from app.main import app


@pytest.fixture
def sample_plan():
    """Пример плана для тестирования"""
    return {
        "originalPlan": {
            "walls": [
                {
                    "id": "wall1",
                    "type": "non_load_bearing",
                    "points": [
                        {"x": 0, "y": 0},
                        {"x": 100, "y": 0}
                    ]
                }
            ],
            "doors": [],
            "windows": [],
            "rooms": [
                {
                    "id": "room1",
                    "type": "living",
                    "area": 15,
                    "hasNaturalLight": True,
                    "hasVentilation": False
                }
            ],
            "hasGasSupply": False,
            "floor": 5,
            "totalFloors": 9,
            "buildingType": "panel"
        },
        "actions": [
            {
                "type": "remove_wall",
                "data": {
                    "wallId": "wall1"
                }
            }
        ],
        "description": "Тестовая перепланировка"
    }


@pytest.mark.asyncio
async def test_root_endpoint():
    """Тест корневого endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_check():
    """Тест проверки здоровья API"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "renovation-planner"


@pytest.mark.asyncio
async def test_analyze_endpoint(sample_plan):
    """Тест анализа плана перепланировки"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/analyze", json=sample_plan)
        assert response.status_code == 200
        data = response.json()

        # Проверяем структуру ответа
        assert "isLegal" in data
        assert "requiresApproval" in data
        assert "warnings" in data
        assert "recommendations" in data
        assert "estimatedApprovalTime" in data
        assert "estimatedCost" in data

        # Проверяем типы данных
        assert isinstance(data["isLegal"], bool)
        assert isinstance(data["requiresApproval"], bool)
        assert isinstance(data["warnings"], list)
        assert isinstance(data["recommendations"], list)


@pytest.mark.asyncio
async def test_analyze_load_bearing_wall():
    """Тест анализа демонтажа несущей стены"""
    plan = {
        "originalPlan": {
            "walls": [
                {
                    "id": "wall1",
                    "type": "load_bearing",
                    "points": [
                        {"x": 0, "y": 0},
                        {"x": 100, "y": 0}
                    ]
                }
            ],
            "doors": [],
            "windows": [],
            "rooms": [],
            "hasGasSupply": False,
            "floor": 5,
            "totalFloors": 9,
            "buildingType": "panel"
        },
        "actions": [
            {
                "type": "remove_wall",
                "data": {
                    "wallId": "wall1"
                }
            }
        ],
        "description": "Демонтаж несущей стены"
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/analyze", json=plan)
        assert response.status_code == 200
        data = response.json()

        # Демонтаж несущей стены должен требовать согласования
        assert data["requiresApproval"] is True
        # Должно быть хотя бы одно предупреждение
        assert len(data["warnings"]) > 0
        # Первое предупреждение должно быть критическим
        assert data["warnings"][0]["level"] == "critical"


@pytest.mark.asyncio
async def test_get_rules():
    """Тест получения всех правил"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/rules")
        assert response.status_code == 200
        data = response.json()
        assert "rules" in data
        assert isinstance(data["rules"], dict)


@pytest.mark.asyncio
async def test_get_rule_category():
    """Тест получения правил по категории"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/rules/loadBearingWalls")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "law" in data
        assert "requirements" in data


@pytest.mark.asyncio
async def test_get_nonexistent_category():
    """Тест получения несуществующей категории"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/rules/nonexistent")
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_examples():
    """Тест получения примеров планировок"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/examples")
        assert response.status_code == 200
        data = response.json()
        assert "examples" in data
        assert isinstance(data["examples"], list)
        assert len(data["examples"]) > 0


@pytest.mark.asyncio
async def test_quick_check():
    """Тест быстрой проверки действия"""
    action = {
        "type": "remove_wall",
        "data": {
            "wallId": "test",
            "hasGas": False
        }
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/quick-check", json=action)
        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        assert "isLegal" in data
        assert "requiresApproval" in data


@pytest.mark.asyncio
async def test_get_document_types():
    """Тест получения типов документов"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/document-types")
        assert response.status_code == 200
        data = response.json()
        assert "document_types" in data
        assert isinstance(data["document_types"], list)
        assert len(data["document_types"]) == 5


@pytest.mark.asyncio
async def test_generate_document_checklist():
    """Тест генерации чек-листа документов"""
    request_data = {
        "document_type": "checklist",
        "apartment_data": {
            "address": "г. Москва, ул. Тестовая, д. 1, кв. 10",
            "cadastral_number": "77:01:0001001:1234",
            "total_area": 60.5,
            "floor": 5,
            "building_type": "panel"
        },
        "owner_data": {
            "full_name": "Иванов Иван Иванович",
            "passport_series": "1234",
            "passport_number": "567890",
            "passport_issued_by": "ОВД Тестовского района",
            "passport_issue_date": "2010-01-15",
            "registration_address": "г. Москва, ул. Тестовая, д. 1, кв. 10",
            "phone": "+7 (999) 123-45-67",
            "email": "test@example.com"
        }
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/generate-document", json=request_data)
        assert response.status_code == 200
        # Проверяем, что это текстовый документ
        assert len(response.text) > 0
        assert "ЧЕК-ЛИСТ" in response.text.upper()


@pytest.mark.asyncio
async def test_generate_document_invalid_type():
    """Тест генерации документа с некорректным типом"""
    request_data = {
        "document_type": "invalid_type",
        "apartment_data": {
            "address": "г. Москва, ул. Тестовая, д. 1, кв. 10",
            "cadastral_number": "77:01:0001001:1234",
            "total_area": 60.5,
            "floor": 5,
            "building_type": "panel"
        },
        "owner_data": {
            "full_name": "Иванов Иван Иванович",
            "passport_series": "1234",
            "passport_number": "567890",
            "passport_issued_by": "ОВД Тестовского района",
            "passport_issue_date": "2010-01-15",
            "registration_address": "г. Москва, ул. Тестовая, д. 1, кв. 10",
            "phone": "+7 (999) 123-45-67",
            "email": "test@example.com"
        }
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/generate-document", json=request_data)
        assert response.status_code == 400
