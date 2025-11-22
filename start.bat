@echo off
chcp 65001 >nul
echo ==================================
echo   Планировщик ремонта
echo ==================================
echo.

:: Проверка Docker
where docker >nul 2>&1
if %errorLevel% neq 0 (
    echo Ошибка: Docker не установлен
    echo Установите Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo Запуск приложения...
echo.

:: Запуск контейнеров
docker-compose up -d

if %errorLevel% equ 0 (
    echo.
    echo ==================================
    echo   Приложение успешно запущено!
    echo ==================================
    echo.
    echo Frontend: http://localhost:5173
    echo API Docs: http://localhost:8000/docs
    echo.
    echo Для остановки: docker-compose down
    echo.

    :: Открыть браузер
    timeout /t 3 >nul
    start http://localhost:5173
) else (
    echo Ошибка при запуске. Проверьте логи: docker-compose logs
    pause
    exit /b 1
)

pause
