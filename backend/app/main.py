from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .models import RenovationPlan, AnalysisResult, FloorPlan, DocumentRequest, OwnerData, ApartmentData
from .analyzer import RenovationAnalyzer
from .document_generator import DocumentGenerator
from .config import settings
import json
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Планировщик ремонта API",
    description="API для анализа перепланировок квартир по российскому законодательству",
    version="1.0.0"
)

# Добавляем rate limiter в state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - ограничиваем доступ только для разрешенных origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# Инициализация анализатора и генератора документов
analyzer = RenovationAnalyzer()
doc_generator = DocumentGenerator()


# Глобальная обработка исключений
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Обработка всех необработанных исключений"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    # В production не показываем детали ошибки
    if settings.is_production:
        return JSONResponse(
            status_code=500,
            content={"detail": "Внутренняя ошибка сервера"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Логирование HTTP исключений"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.get("/")
@limiter.limit("30/minute")
async def root(request: Request):
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
@limiter.limit("20/minute")
async def analyze_renovation(request: Request, plan: RenovationPlan):
    """
    Анализ плана перепланировки на соответствие законодательству РФ
    """
    try:
        logger.info(f"Analyzing renovation plan: {plan.description}")
        result = analyzer.analyze(plan)
        logger.info(f"Analysis complete. Legal: {result.isLegal}, Requires approval: {result.requiresApproval}")
        return result
    except Exception as e:
        logger.error(f"Error analyzing plan: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rules")
@limiter.limit("30/minute")
async def get_rules(request: Request):
    """
    Получить все правила и законодательные требования
    """
    rules_path = Path(__file__).parent.parent / "data" / "renovation_rules.json"
    with open(rules_path, 'r', encoding='utf-8') as f:
        rules = json.load(f)
    return rules


@app.get("/api/rules/{category}")
@limiter.limit("30/minute")
async def get_rule_category(request: Request, category: str):
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
@limiter.limit("30/minute")
async def get_examples(request: Request):
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
@limiter.limit("30/minute")
async def quick_check(request: Request, action: dict):
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
@limiter.limit("10/minute")
async def generate_document(request: Request, doc_request: DocumentRequest):
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
        logger.info(f"Generating document type: {doc_request.document_type}")
        apartment_data_dict = doc_request.apartment_data.model_dump()
        owner_data_dict = doc_request.owner_data.model_dump()

        if doc_request.document_type == "application":
            document = doc_generator.generate_application(
                apartment_data_dict,
                owner_data_dict,
                doc_request.plan,
                doc_request.analysis
            )
        elif doc_request.document_type == "technical_conclusion":
            document = doc_generator.generate_technical_conclusion(
                apartment_data_dict,
                doc_request.plan,
                doc_request.analysis
            )
        elif doc_request.document_type == "completion_act":
            completion_date = doc_request.completion_date or doc_generator.current_date
            document = doc_generator.generate_completion_act(
                apartment_data_dict,
                owner_data_dict,
                completion_date
            )
        elif doc_request.document_type == "bti_application":
            document = doc_generator.generate_bti_application(
                apartment_data_dict,
                owner_data_dict
            )
        elif doc_request.document_type == "checklist":
            document = doc_generator.generate_document_checklist()
        else:
            raise HTTPException(status_code=400, detail="Invalid document type")

        logger.info(f"Document generated successfully")
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/document-types")
@limiter.limit("30/minute")
async def get_document_types(request: Request):
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
@limiter.limit("60/minute")
async def health_check(request: Request):
    """Проверка работоспособности API"""
    return {"status": "healthy", "service": "renovation-planner"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
