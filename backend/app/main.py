from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from .models import RenovationPlan, AnalysisResult, FloorPlan, DocumentRequest, OwnerData, ApartmentData
from .analyzer import RenovationAnalyzer
from .document_generator import DocumentGenerator
import json
from pathlib import Path

app = FastAPI(
    title="Планировщик ремонта API",
    description="API для анализа перепланировок квартир по российскому законодательству",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация анализатора и генератора документов
analyzer = RenovationAnalyzer()
doc_generator = DocumentGenerator()


@app.get("/")
async def root():
    return {
        "message": "Планировщик ремонта API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "rules": "/api/rules",
            "examples": "/api/examples"
        }
    }


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_renovation(plan: RenovationPlan):
    """
    Анализ плана перепланировки на соответствие законодательству РФ
    """
    try:
        result = analyzer.analyze(plan)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rules")
async def get_rules():
    """
    Получить все правила и законодательные требования
    """
    rules_path = Path(__file__).parent.parent / "data" / "renovation_rules.json"
    with open(rules_path, 'r', encoding='utf-8') as f:
        rules = json.load(f)
    return rules


@app.get("/api/rules/{category}")
async def get_rule_category(category: str):
    """
    Получить правила по категории
    """
    rules_path = Path(__file__).parent.parent / "data" / "renovation_rules.json"
    with open(rules_path, 'r', encoding='utf-8') as f:
        rules = json.load(f)

    if category not in rules.get('rules', {}):
        raise HTTPException(status_code=404, detail=f"Category '{category}' not found")

    return rules['rules'][category]


@app.get("/api/examples")
async def get_examples():
    """
    Примеры типовых планировок
    """
    return {
        "examples": [
            {
                "name": "Хрущевка 2-комнатная",
                "type": "2-room",
                "area": 45,
                "description": "Типовая двухкомнатная квартира в панельном доме"
            },
            {
                "name": "Брежневка 3-комнатная",
                "type": "3-room",
                "area": 65,
                "description": "Трехкомнатная квартира улучшенной планировки"
            },
            {
                "name": "Студия современная",
                "type": "studio",
                "area": 35,
                "description": "Современная квартира-студия"
            }
        ]
    }


@app.post("/api/quick-check")
async def quick_check(action: dict):
    """
    Быстрая проверка одного действия
    """
    action_type = action.get('type')
    action_data = action.get('data', {})

    # Создаем упрощенный план для проверки
    simple_plan = RenovationPlan(
        originalPlan=FloorPlan(
            walls=[],
            doors=[],
            windows=[],
            rooms=[],
            hasGasSupply=action_data.get('hasGas', False)
        ),
        actions=[action],
        description=f"Проверка: {action_type}"
    )

    result = analyzer.analyze(simple_plan)
    return {
        "action": action_type,
        "isLegal": result.isLegal,
        "requiresApproval": result.requiresApproval,
        "mainWarning": result.warnings[0] if result.warnings else None
    }


@app.post("/api/generate-document", response_class=PlainTextResponse)
async def generate_document(request: DocumentRequest):
    """
    Генерация документов для перепланировки по российским стандартам

    Типы документов:
    - application: Заявление на перепланировку
    - technical_conclusion: Техническое заключение
    - completion_act: Акт о завершении перепланировки
    - bti_application: Заявление в БТИ
    - checklist: Чек-лист документов
    """
    try:
        apartment_data_dict = request.apartment_data.model_dump()
        owner_data_dict = request.owner_data.model_dump()

        if request.document_type == "application":
            document = doc_generator.generate_application(
                apartment_data_dict,
                owner_data_dict,
                request.plan,
                request.analysis
            )
        elif request.document_type == "technical_conclusion":
            document = doc_generator.generate_technical_conclusion(
                apartment_data_dict,
                request.plan,
                request.analysis
            )
        elif request.document_type == "completion_act":
            completion_date = request.completion_date or doc_generator.current_date
            document = doc_generator.generate_completion_act(
                apartment_data_dict,
                owner_data_dict,
                completion_date
            )
        elif request.document_type == "bti_application":
            document = doc_generator.generate_bti_application(
                apartment_data_dict,
                owner_data_dict
            )
        elif request.document_type == "checklist":
            document = doc_generator.generate_document_checklist()
        else:
            raise HTTPException(status_code=400, detail="Invalid document type")

        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/document-types")
async def get_document_types():
    """
    Получить список доступных типов документов
    """
    return {
        "document_types": [
            {
                "id": "application",
                "name": "Заявление на перепланировку",
                "description": "Заявление в жилищную инспекцию о согласовании перепланировки (ПП РФ №266)",
                "requires_analysis": True
            },
            {
                "id": "technical_conclusion",
                "name": "Техническое заключение",
                "description": "Техническое заключение о возможности и безопасности перепланировки",
                "requires_analysis": True
            },
            {
                "id": "completion_act",
                "name": "Акт о завершении перепланировки",
                "description": "Акт приемочной комиссии о завершенной перепланировке",
                "requires_analysis": False
            },
            {
                "id": "bti_application",
                "name": "Заявление в БТИ",
                "description": "Заявление о внесении изменений в технический паспорт",
                "requires_analysis": False
            },
            {
                "id": "checklist",
                "name": "Чек-лист документов",
                "description": "Полный список необходимых документов для всех этапов",
                "requires_analysis": False
            }
        ]
    }


@app.get("/health")
async def health_check():
    """Проверка работоспособности API"""
    return {"status": "healthy", "service": "renovation-planner"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
