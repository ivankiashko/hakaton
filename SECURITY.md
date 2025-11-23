# Руководство по безопасности

## Обзор безопасности

Проект реализует несколько уровней защиты для обеспечения безопасности приложения.

## Реализованные меры безопасности

### 1. CORS (Cross-Origin Resource Sharing)

**Настройка:** `backend/app/config.py`

```python
# Ограничение доступа только для разрешенных origins
allowed_origins = "http://localhost:5173,http://localhost:3000"
```

**Преимущества:**
- Защита от несанкционированных запросов из других доменов
- Контроль методов и заголовков
- Кэширование preflight запросов (max_age=3600)

**Настройка для production:**
```bash
# В .env файле
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Rate Limiting

**Библиотека:** SlowAPI

**Лимиты по endpoint:**
- `/` - 30 запросов/минута
- `/api/analyze` - 20 запросов/минута (самый ресурсоемкий)
- `/api/generate-document` - 10 запросов/минута
- Остальные GET endpoints - 30 запросов/минута
- `/health` - 60 запросов/минута

**Защита от:**
- DDoS атак
- Брутфорса
- Злоупотребления ресурсами

**Настройка:**
```python
# backend/app/config.py
rate_limit_per_minute = 60  # Базовый лимит
```

### 3. Валидация входных данных

**Библиотека:** Pydantic

**Что валидируется:**
- Типы данных (автоматически через Pydantic models)
- Обязательные поля
- Формат данных (email, phone, и т.д.)
- Размер и структура массивов

**Пример:**
```python
class DocumentRequest(BaseModel):
    document_type: str
    apartment_data: ApartmentData
    owner_data: OwnerData
    # Автоматическая валидация всех полей
```

### 4. Обработка ошибок и логирование

**Реализовано:**
- Глобальный обработчик исключений
- Логирование всех ошибок
- Различное поведение для dev/prod окружений
- Скрытие деталей ошибок в production

**Логирование:**
```python
# Логируются:
- Все запросы к API
- Ошибки анализа
- HTTP исключения
- Критические ошибки
```

**Файлы логов:**
- Консоль (development)
- Файл логов (production) - настраивается отдельно

### 5. Переменные окружения

**Файл:** `.env.example`

**Важные параметры:**
```bash
SECRET_KEY=change-this-in-production
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com
```

**⚠️ ВАЖНО:**
- Никогда не коммитьте `.env` файл
- Используйте сложные SECRET_KEY в production
- Меняйте дефолтные значения

### 6. Security Headers (рекомендуется добавить)

```python
# Добавить в main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)
```

### 7. HTTPS (для production)

**Настройка Uvicorn с SSL:**
```bash
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 443 \
  --ssl-keyfile=/path/to/key.pem \
  --ssl-certfile=/path/to/cert.pem
```

**Или используйте reverse proxy (Nginx):**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Чеклист безопасности для production

- [ ] Изменить SECRET_KEY
- [ ] Настроить ALLOWED_ORIGINS
- [ ] Включить HTTPS
- [ ] Настроить rate limiting под нагрузку
- [ ] Настроить логирование в файлы
- [ ] Добавить мониторинг (Sentry, DataDog)
- [ ] Настроить backup базы данных
- [ ] Включить ENVIRONMENT=production
- [ ] Проверить все переменные окружения
- [ ] Настроить firewall
- [ ] Обновить зависимости до последних версий
- [ ] Запустить security scan (trivy, safety)

## Проверка безопасности

### Backend

```bash
# Проверка зависимостей на уязвимости
pip install safety
safety check -r backend/requirements.txt

# Или используйте pip-audit
pip install pip-audit
pip-audit -r backend/requirements.txt
```

### Frontend

```bash
# Проверка npm зависимостей
cd frontend
npm audit

# Автоматическое исправление
npm audit fix
```

### Docker образы

```bash
# Проверка образов с Trivy
docker pull aquasec/trivy
trivy image renovation-planner-backend:latest
trivy image renovation-planner-frontend:latest
```

## Мониторинг и алерты

### Рекомендуемые инструменты:

1. **Sentry** - отслеживание ошибок
2. **Prometheus + Grafana** - метрики и мониторинг
3. **ELK Stack** - логи и аналитика
4. **Fail2ban** - защита от брутфорса

## Отчет об уязвимостях

Если вы обнаружили уязвимость, пожалуйста:

1. **НЕ создавайте** публичный issue
2. Отправьте email на: security@yourdomain.com
3. Опишите уязвимость детально
4. Дайте нам 90 дней на исправление

## Дополнительные ресурсы

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Python Security Best Practices](https://snyk.io/blog/python-security-best-practices/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
