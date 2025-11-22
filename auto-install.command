#!/bin/bash

# Переход в директорию, где находится скрипт
cd "$(dirname "$0")"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
LOGFILE="/tmp/renovation-planner-install.log"
echo "Начало установки: $(date)" > "$LOGFILE"

# Функция для вывода цветного текста
print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# Заголовок
clear
echo "================================================"
echo "  АВТОМАТИЧЕСКИЙ УСТАНОВЩИК"
echo "  Планировщик Ремонта - macOS"
echo "================================================"
echo ""
echo "Этот скрипт автоматически:"
echo "- Проверит и установит Homebrew"
echo "- Проверит и установит Docker Desktop"
echo "- Запустит Docker"
echo "- Запустит приложение"
echo ""
echo "Процесс может занять несколько минут..."
echo ""

# Функция ожидания нажатия клавиши
wait_key() {
    echo ""
    read -n 1 -s -r -p "Нажмите любую клавишу для продолжения..."
    echo ""
}

# 1. Проверка и установка Homebrew
print_info "[1/5] Проверка Homebrew..."
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew не найден. Устанавливаем..."
    echo ""

    # Установка Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [ $? -ne 0 ]; then
        print_error "Ошибка при установке Homebrew"
        echo "Попробуйте установить вручную: https://brew.sh"
        wait_key
        exit 1
    fi

    # Добавление Homebrew в PATH для Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    print_success "Homebrew установлен успешно!"
else
    print_success "Homebrew уже установлен: ОК"
fi
echo ""

# 2. Проверка и установка Docker Desktop
print_info "[2/5] Проверка Docker Desktop..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker Desktop не найден. Начинаем автоматическую установку..."
    echo ""

    # Определение архитектуры
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        DOCKER_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
        print_info "Определена архитектура: Apple Silicon (ARM64)"
    else
        DOCKER_URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
        print_info "Определена архитектура: Intel (x64)"
    fi
    echo ""

    # Скачивание Docker Desktop
    print_info "Скачивание Docker Desktop (это может занять несколько минут)..."
    DOCKER_DMG="/tmp/Docker.dmg"

    curl -L --progress-bar "$DOCKER_URL" -o "$DOCKER_DMG"

    if [ $? -ne 0 ]; then
        print_error "Ошибка при скачивании Docker Desktop"
        echo "Попробуйте скачать вручную: https://www.docker.com/products/docker-desktop/"
        wait_key
        exit 1
    fi

    print_success "Загрузка завершена!"
    echo ""

    # Монтирование образа
    print_info "Монтирование образа..."
    hdiutil attach "$DOCKER_DMG" -nobrowse -quiet

    if [ $? -ne 0 ]; then
        print_error "Ошибка при монтировании образа Docker"
        wait_key
        exit 1
    fi

    # Установка Docker Desktop
    print_info "Установка Docker Desktop..."
    cp -R "/Volumes/Docker/Docker.app" /Applications/

    if [ $? -ne 0 ]; then
        print_error "Ошибка при копировании Docker.app"
        hdiutil detach "/Volumes/Docker" -quiet
        wait_key
        exit 1
    fi

    # Размонтирование образа
    print_info "Размонтирование образа..."
    hdiutil detach "/Volumes/Docker" -quiet

    # Очистка
    rm -f "$DOCKER_DMG"

    print_success "Docker Desktop установлен успешно!"
else
    print_success "Docker Desktop уже установлен: ОК"
fi
echo ""

# 3. Запуск Docker Desktop
print_info "[3/5] Запуск Docker Desktop..."

# Проверка, запущен ли Docker
if docker info &> /dev/null; then
    print_success "Docker Desktop уже запущен: ОК"
else
    print_info "Запуск Docker Desktop..."

    # Запуск Docker Desktop
    open -a Docker

    if [ $? -ne 0 ]; then
        print_error "Ошибка при запуске Docker Desktop"
        echo "Попробуйте запустить Docker Desktop вручную из Applications"
        wait_key
        exit 1
    fi

    # Ожидание запуска Docker (максимум 2 минуты)
    print_info "Ожидание запуска Docker Engine..."
    TIMEOUT=120
    COUNTER=0

    while ! docker info &> /dev/null; do
        sleep 3
        COUNTER=$((COUNTER + 3))

        if [ $COUNTER -ge $TIMEOUT ]; then
            print_error "Превышено время ожидания запуска Docker"
            echo ""
            echo "Docker Desktop запущен, но Engine еще не готов."
            echo "Пожалуйста, дождитесь полного запуска Docker Desktop"
            echo "(индикатор в строке меню должен перестать мигать)"
            echo ""
            read -n 1 -s -r -p "Нажмите любую клавишу, когда Docker будет готов..."
            echo ""

            if ! docker info &> /dev/null; then
                print_error "Docker все еще не доступен. Установка прервана."
                wait_key
                exit 1
            fi
            break
        fi

        echo -ne "Ожидание... ($COUNTER/$TIMEOUT сек)\r"
    done

    echo ""
    print_success "Docker запущен: ОК"
fi
echo ""

# 4. Подготовка к запуску
print_info "[4/5] Подготовка к запуску приложения..."
echo "Рабочая директория: $(pwd)"
echo ""

# Проверка наличия docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    print_error "ОШИБКА: Файл docker-compose.yml не найден!"
    echo "Убедитесь, что вы запускаете скрипт из корневой директории проекта."
    wait_key
    exit 1
fi

# 5. Запуск приложения
print_info "[5/5] Запуск приложения..."
echo ""
print_info "Запуск Docker контейнеров..."

docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    print_success "  УСТАНОВКА И ЗАПУСК ЗАВЕРШЕНЫ!"
    echo "================================================"
    echo ""
    echo "Приложение \"Планировщик Ремонта\" запущено!"
    echo ""
    echo "Доступ к приложению:"
    echo "  Frontend:  http://localhost:5173"
    echo "  API Docs:  http://localhost:8000/docs"
    echo ""
    echo "Браузер откроется автоматически через 5 секунд..."
    echo ""
    echo "Для остановки приложения выполните:"
    echo "  docker-compose down"
    echo ""

    # Логирование
    echo "Установка завершена: $(date)" >> "$LOGFILE"

    # Открытие браузера
    sleep 5
    open http://localhost:5173

    echo ""
    print_success "Готово! Нажмите любую клавишу для выхода..."
    read -n 1 -s -r
else
    echo ""
    echo "================================================"
    print_error "  ОШИБКА ПРИ ЗАПУСКЕ ПРИЛОЖЕНИЯ"
    echo "================================================"
    echo ""
    echo "Проверьте логи для диагностики:"
    echo "  docker-compose logs"
    echo ""
    echo "Лог установки: $LOGFILE"
    echo ""
    wait_key
    exit 1
fi

exit 0
