@echo off
chcp 65001 >nul
echo ==========================================
echo   Сборка установщика для Windows
echo   Планировщик Ремонта
echo ==========================================
echo.

:: Проверка Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo Скачайте и установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

:: Проверка Python
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo [ОШИБКА] Python не установлен!
    echo Скачайте и установите Python 3.11+ с https://python.org/
    pause
    exit /b 1
)

echo [1/5] Установка зависимостей корневого проекта...
call npm install
if %errorLevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости!
    pause
    exit /b 1
)

echo.
echo [2/5] Сборка frontend...
cd frontend
call npm install
if %errorLevel% neq 0 (
    echo [ОШИБКА] Не удалось установить зависимости frontend!
    pause
    exit /b 1
)

call npm run build
if %errorLevel% neq 0 (
    echo [ОШИБКА] Не удалось собрать frontend!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Подготовка backend...
cd backend
if not exist requirements.txt (
    echo Создание requirements.txt...
    (
        echo fastapi==0.104.1
        echo uvicorn[standard]==0.24.0
        echo pydantic==2.5.0
        echo python-multipart==0.0.6
    ) > requirements.txt
)
cd ..

echo.
echo [4/5] Проверка иконок...
if not exist build\icon.ico (
    echo [ПРЕДУПРЕЖДЕНИЕ] Иконка Windows (icon.ico) не найдена!
    echo Будет использована иконка по умолчанию.
    echo См. build\README.md для инструкций по созданию иконок.
    echo.
)

echo.
echo [5/5] Сборка установщика Windows...
call npm run build:win

if %errorLevel% equ 0 (
    echo.
    echo ==========================================
    echo   Сборка завершена успешно!
    echo ==========================================
    echo.
    echo Установщик находится в папке: dist\
    echo.
    dir /b dist\*.exe 2>nul
    echo.
) else (
    echo.
    echo [ОШИБКА] Сборка не удалась!
    echo.
)

pause
