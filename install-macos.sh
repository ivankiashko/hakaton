#!/bin/bash

echo "=================================="
echo "  Установщик - Планировщик ремонта"
echo "  macOS"
echo "=================================="
echo ""

# Проверка Homebrew
if ! command -v brew &> /dev/null; then
    echo "Homebrew не установлен. Устанавливаем..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Установка Docker
if ! command -v docker &> /dev/null; then
    echo "Установка Docker Desktop для macOS..."
    echo "Скачивание Docker Desktop..."

    # Определение архитектуры
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    else
        URL="https://desktop.docker.com/mac/main/amd64/Docker.dmg"
    fi

    curl -L "$URL" -o /tmp/Docker.dmg

    echo "Монтирование образа..."
    hdiutil attach /tmp/Docker.dmg

    echo "Установка Docker Desktop..."
    cp -R "/Volumes/Docker/Docker.app" /Applications/

    echo "Размонтирование образа..."
    hdiutil detach "/Volumes/Docker"

    echo "Запуск Docker Desktop..."
    open /Applications/Docker.app

    echo ""
    echo "Дождитесь запуска Docker Desktop (значок в трее)"
    echo "Нажмите Enter когда Docker будет готов..."
    read
else
    echo "Docker уже установлен"
fi

# Установка Git (если нужно)
if ! command -v git &> /dev/null; then
    echo "Установка Git..."
    brew install git
else
    echo "Git уже установлен"
fi

# Клонирование репозитория (опционально)
echo ""
echo "Хотите клонировать репозиторий? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Введите URL репозитория:"
    read repo_url
    echo "Введите директорию для установки (по умолчанию: ~/renovation-planner):"
    read install_dir
    install_dir=${install_dir:-~/renovation-planner}

    git clone "$repo_url" "$install_dir"
    cd "$install_dir" || exit
fi

echo ""
echo "=================================="
echo "  Установка завершена!"
echo "=================================="
echo ""
echo "Для запуска приложения выполните:"
echo "  chmod +x start.sh"
echo "  ./start.sh"
echo ""
