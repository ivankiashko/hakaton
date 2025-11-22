#!/bin/bash

echo "=================================="
echo "  Планировщик ремонта"
echo "=================================="
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "Ошибка: Docker не установлен"
    echo "Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Проверка Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Ошибка: Docker Compose не установлен"
    exit 1
fi

echo "Запуск приложения..."
echo ""

# Запуск контейнеров
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "  Приложение успешно запущено!"
    echo "=================================="
    echo ""
    echo "Frontend: http://localhost:5173"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    echo "Для остановки: docker-compose down"
    echo ""

    # Открыть браузер
    sleep 3
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:5173
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:5173 2>/dev/null || echo "Откройте http://localhost:5173 в браузере"
    fi
else
    echo "Ошибка при запуске. Проверьте логи: docker-compose logs"
    exit 1
fi
