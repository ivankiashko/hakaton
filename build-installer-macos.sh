#!/bin/bash

echo "=========================================="
echo "  Сборка установщика для macOS"
echo "  Планировщик Ремонта"
echo "=========================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ОШИБКА]${NC} Node.js не установлен!"
    echo "Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ОШИБКА]${NC} Python не установлен!"
    echo "Установите Python 3.11+ с https://python.org/"
    exit 1
fi

echo -e "${GREEN}[1/5]${NC} Установка зависимостей корневого проекта..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ОШИБКА]${NC} Не удалось установить зависимости!"
    exit 1
fi

echo ""
echo -e "${GREEN}[2/5]${NC} Сборка frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ОШИБКА]${NC} Не удалось установить зависимости frontend!"
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ОШИБКА]${NC} Не удалось собрать frontend!"
    exit 1
fi
cd ..

echo ""
echo -e "${GREEN}[3/5]${NC} Подготовка backend..."
cd backend
if [ ! -f requirements.txt ]; then
    echo "Создание requirements.txt..."
    cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
EOF
fi
cd ..

echo ""
echo -e "${GREEN}[4/5]${NC} Проверка иконок..."
if [ ! -f build/icon.icns ]; then
    echo -e "${YELLOW}[ПРЕДУПРЕЖДЕНИЕ]${NC} Иконка macOS (icon.icns) не найдена!"
    echo "Будет использована иконка по умолчанию."
    echo "См. build/README.md для инструкций по созданию иконок."
    echo ""
fi

echo ""
echo -e "${GREEN}[5/5]${NC} Сборка установщика macOS..."
npm run build:mac

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo -e "  ${GREEN}Сборка завершена успешно!${NC}"
    echo "=========================================="
    echo ""
    echo "Установщик находится в папке: dist/"
    echo ""
    ls -lh dist/*.dmg 2>/dev/null || echo "DMG файлы будут созданы в dist/"
    echo ""
else
    echo ""
    echo -e "${RED}[ОШИБКА]${NC} Сборка не удалась!"
    echo ""
    exit 1
fi

echo "Готово!"
