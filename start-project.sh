#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функция для печати заголовка
print_header() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         🏗️  ПЛАНИРОВЩИК РЕМОНТА - LAUNCHER 🏗️              ║"
    echo "║                                                            ║"
    echo "║   Умный цифровой сервис для планирования перепланировки    ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Функция для проверки установки программы
check_installed() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 установлен"
        return 0
    else
        echo -e "${RED}✗${NC} $1 не установлен"
        return 1
    fi
}

# Функция для проверки доступности сервиса
check_service() {
    local url=$1
    local name=$2

    if curl -s --head --request GET $url | grep "200\|301\|302" > /dev/null; then
        echo -e "${GREEN}✓${NC} $name доступен ($url)"
        return 0
    else
        echo -e "${YELLOW}⏳${NC} $name пока не доступен..."
        return 1
    fi
}

# Функция для открытия браузера
open_browser() {
    local url=$1

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open $url &> /dev/null &
        elif command -v gnome-open &> /dev/null; then
            gnome-open $url &> /dev/null &
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open $url
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        start $url
    fi
}

# Основной скрипт
main() {
    clear
    print_header

    echo -e "${CYAN}Шаг 1: Проверка необходимых инструментов${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    docker_installed=true
    compose_installed=true

    if ! check_installed docker; then
        docker_installed=false
    fi

    if ! check_installed docker-compose && ! docker compose version &> /dev/null; then
        compose_installed=false
    fi

    echo ""

    if [ "$docker_installed" = false ] || [ "$compose_installed" = false ]; then
        echo -e "${RED}Ошибка: Docker и/или Docker Compose не установлены${NC}"
        echo ""
        echo "Пожалуйста, установите Docker:"
        echo "  - Linux: https://docs.docker.com/engine/install/"
        echo "  - macOS: https://docs.docker.com/desktop/install/mac-install/"
        echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
        echo ""
        exit 1
    fi

    echo -e "${CYAN}Шаг 2: Проверка запущенных контейнеров${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Проверяем, запущены ли контейнеры
    if docker ps | grep -q "renovation-planner"; then
        echo -e "${GREEN}✓${NC} Контейнеры уже запущены"
        echo ""
    else
        echo -e "${YELLOW}⏳${NC} Контейнеры не запущены. Запускаем..."
        echo ""

        echo -e "${CYAN}Шаг 3: Запуск Docker Compose${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Останавливаем старые контейнеры если есть
        docker-compose down &> /dev/null

        # Запускаем контейнеры
        if docker-compose up -d; then
            echo -e "${GREEN}✓${NC} Контейнеры успешно запущены"
            echo ""
        else
            echo -e "${RED}✗${NC} Ошибка при запуске контейнеров"
            echo ""
            echo "Попробуйте запустить вручную:"
            echo "  docker-compose up -d"
            echo ""
            exit 1
        fi
    fi

    echo -e "${CYAN}Шаг 4: Ожидание готовности сервисов${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Подождите, пока сервисы запустятся (это может занять 30-60 секунд)..."
    echo ""

    # Ждем запуска backend (до 60 секунд)
    backend_ready=false
    for i in {1..20}; do
        if check_service "http://localhost:8000/api/rules" "Backend API"; then
            backend_ready=true
            break
        fi
        sleep 3
    done

    # Ждем запуска frontend (до 60 секунд)
    frontend_ready=false
    for i in {1..20}; do
        if check_service "http://localhost:5173" "Frontend"; then
            frontend_ready=true
            break
        fi
        sleep 3
    done

    echo ""

    if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}║              ✓ ВСЕ СЕРВИСЫ УСПЕШНО ЗАПУЩЕНЫ ✓              ║${NC}"
        echo -e "${GREEN}║                                                            ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        echo -e "${CYAN}Доступные сервисы:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "  ${BLUE}🎨 Frontend:${NC}      http://localhost:5173"
        echo -e "  ${BLUE}📚 API Docs:${NC}      http://localhost:8000/docs"
        echo -e "  ${BLUE}⚖️  Rules API:${NC}     http://localhost:8000/api/rules"
        echo -e "  ${BLUE}🏗️  Backend API:${NC}   http://localhost:8000"
        echo ""

        echo -e "${YELLOW}Открываем приложение в браузере...${NC}"
        sleep 2

        # Открываем HTML лаунчер
        launcher_path="$(pwd)/LAUNCHER.html"
        if [ -f "$launcher_path" ]; then
            open_browser "file://$launcher_path"
            echo -e "${GREEN}✓${NC} Лаунчер открыт в браузере"
        else
            # Если лаунчера нет, открываем напрямую frontend
            open_browser "http://localhost:5173"
            echo -e "${GREEN}✓${NC} Frontend открыт в браузере"
        fi

        echo ""
        echo -e "${CYAN}Полезные команды:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Просмотр логов:        docker-compose logs -f"
        echo "  Остановить сервисы:    docker-compose down"
        echo "  Перезапустить:         docker-compose restart"
        echo "  Пересобрать образы:    docker-compose up -d --build"
        echo ""

    else
        echo -e "${YELLOW}⚠️  Предупреждение: Не все сервисы запустились${NC}"
        echo ""

        if [ "$backend_ready" = false ]; then
            echo -e "${RED}✗${NC} Backend не запустился"
        fi

        if [ "$frontend_ready" = false ]; then
            echo -e "${RED}✗${NC} Frontend не запустился"
        fi

        echo ""
        echo "Попробуйте:"
        echo "  1. Проверить логи: docker-compose logs"
        echo "  2. Перезапустить: docker-compose restart"
        echo "  3. Пересобрать: docker-compose up -d --build"
        echo ""
    fi
}

# Обработка Ctrl+C
trap 'echo -e "\n${YELLOW}Скрипт прерван${NC}"; exit 130' INT

# Запуск основного скрипта
main "$@"
