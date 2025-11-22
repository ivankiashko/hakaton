# Руководство по тестированию

## Обзор

Проект имеет комплексное тестовое покрытие для backend и frontend компонентов.

## Backend Tests (pytest)

### Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### Запуск тестов

```bash
# Запустить все тесты
pytest

# Запустить с покрытием кода
pytest --cov=app --cov-report=html

# Запустить конкретный тестовый файл
pytest tests/test_api.py

# Запустить конкретный тест
pytest tests/test_api.py::test_root_endpoint
```

### Структура тестов

```
backend/
├── tests/
│   ├── __init__.py
│   ├── test_api.py           # Тесты API endpoints
│   └── test_analyzer.py      # Тесты анализатора
├── pytest.ini                # Конфигурация pytest
└── .coveragerc              # Конфигурация coverage
```

### Покрытие кода

После запуска тестов с флагом `--cov-report=html` откройте `htmlcov/index.html` в браузере для просмотра детального отчета о покрытии.

## Frontend Tests (Vitest)

### Установка зависимостей

```bash
cd frontend
npm install
```

### Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить с UI
npm run test:ui

# Запустить с покрытием
npm run test:coverage

# Режим watch (для разработки)
npm test -- --watch
```

### Структура тестов

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── ApartmentSettings.test.tsx
│   │   ├── AnalysisPanel.test.tsx
│   │   └── api-client.test.ts
│   └── test/
│       └── setup.ts          # Настройка тестового окружения
└── vitest.config.ts         # Конфигурация Vitest
```

## CI/CD

Все тесты автоматически запускаются при push и pull request через GitHub Actions.

### Workflows

- **CI** (.github/workflows/ci.yml) - Запускает тесты для backend и frontend
- **Code Quality** (.github/workflows/code-quality.yml) - Проверяет качество кода
- **Release** (.github/workflows/release.yml) - Создает релизы

### Статус

Проверьте статус CI в разделе Actions на GitHub.

## Линтинг

### Backend (Python)

```bash
cd backend

# Black - форматирование кода
black app/

# Flake8 - линтер
flake8 app/

# isort - сортировка импортов
isort app/

# mypy - проверка типов
mypy app/
```

### Frontend (TypeScript)

```bash
cd frontend

# ESLint
npm run lint

# TypeScript проверка
npx tsc --noEmit
```

## Best Practices

1. **Пишите тесты перед кодом** (TDD) для критических функций
2. **Поддерживайте покрытие** минимум 80%
3. **Используйте понятные имена** тестов
4. **Изолируйте тесты** - каждый тест должен быть независимым
5. **Мокайте внешние зависимости** (API, БД)
6. **Тестируйте edge cases** и обработку ошибок

## Troubleshooting

### Backend

**Проблема:** Тесты падают с ошибкой импорта
```bash
# Решение: Установите проект в режиме разработки
pip install -e .
```

**Проблема:** Не создается отчет о покрытии
```bash
# Решение: Проверьте установку pytest-cov
pip install pytest-cov
```

### Frontend

**Проблема:** Тесты не находят модули
```bash
# Решение: Очистите кэш и переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

**Проблема:** DOM тесты не работают
```bash
# Решение: Проверьте настройку jsdom в vitest.config.ts
# environment: 'jsdom' должен быть установлен
```

## Дополнительные ресурсы

- [Pytest документация](https://docs.pytest.org/)
- [Vitest документация](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
