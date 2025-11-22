@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================
echo   АВТОМАТИЧЕСКИЙ УСТАНОВЩИК
echo   Планировщик Ремонта - Windows
echo ================================================
echo.
echo Этот скрипт автоматически:
echo - Проверит и установит Docker Desktop
echo - Запустит Docker
echo - Запустит приложение
echo.
echo Процесс может занять несколько минут...
echo.

:: Создание временной директории для логов
set LOGFILE=%TEMP%\renovation-planner-install.log
echo Начало установки: %date% %time% > "%LOGFILE%"

:: Проверка прав администратора
echo [1/5] Проверка прав администратора...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ================================================
    echo   ТРЕБУЮТСЯ ПРАВА АДМИНИСТРАТОРА
    echo ================================================
    echo.
    echo Этот скрипт требует права администратора для установки Docker.
    echo Пожалуйста, закройте это окно и запустите скрипт заново
    echo правой кнопкой мыши -^> "Запуск от имени администратора"
    echo.
    pause
    exit /b 1
)
echo Права администратора: ОК
echo.

:: Проверка и установка Docker
echo [2/5] Проверка Docker Desktop...
where docker >nul 2>&1
if %errorLevel% neq 0 (
    echo Docker не найден. Начинаем автоматическую установку...
    echo.

    :: Скачивание Docker Desktop
    echo Скачивание Docker Desktop (это может занять несколько минут)...
    set DOCKER_URL=https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    set DOCKER_INSTALLER=%TEMP%\DockerDesktopInstaller.exe

    powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%DOCKER_URL%' -OutFile '%DOCKER_INSTALLER%'; if ($?) {Write-Host 'Загрузка завершена'} else {Write-Host 'Ошибка загрузки'; exit 1}}"

    if !errorLevel! neq 0 (
        echo Ошибка при скачивании Docker Desktop
        echo Попробуйте скачать вручную: https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )

    :: Установка Docker Desktop
    echo.
    echo Установка Docker Desktop (это займет 2-5 минут)...
    echo Пожалуйста, подождите...

    start /wait "" "%DOCKER_INSTALLER%" install --quiet --accept-license

    if !errorLevel! neq 0 (
        echo.
        echo Установка Docker Desktop завершилась с ошибкой.
        echo Попробуйте установить Docker Desktop вручную:
        echo https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )

    echo Docker Desktop установлен успешно!
    echo.

    :: Очистка
    del "%DOCKER_INSTALLER%" >nul 2>&1
) else (
    echo Docker Desktop уже установлен: ОК
    echo.
)

:: Запуск Docker Desktop
echo [3/5] Запуск Docker Desktop...

:: Проверка, запущен ли Docker
docker info >nul 2>&1
if %errorLevel% equ 0 (
    echo Docker Desktop уже запущен: ОК
    echo.
) else (
    echo Запуск Docker Desktop...

    :: Попытка запустить Docker Desktop
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo Не удалось найти Docker Desktop.
        echo Пожалуйста, запустите Docker Desktop вручную и нажмите любую клавишу...
        pause >nul
    )

    :: Ожидание запуска Docker (максимум 2 минуты)
    echo Ожидание запуска Docker Engine...
    set /a timeout=120
    set /a counter=0

    :wait_docker
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorLevel% equ 0 (
        echo Docker запущен: ОК
        echo.
        goto docker_ready
    )

    set /a counter+=3
    if !counter! geq !timeout! (
        echo.
        echo Превышено время ожидания запуска Docker.
        echo Пожалуйста, убедитесь, что Docker Desktop запущен и работает,
        echo затем нажмите любую клавишу для продолжения...
        pause >nul

        docker info >nul 2>&1
        if !errorLevel! neq 0 (
            echo Docker все еще не доступен. Установка прервана.
            pause
            exit /b 1
        )
    ) else (
        echo Ожидание... (!counter!/!timeout! сек)
        goto wait_docker
    )
)

:docker_ready

:: Переход в директорию скрипта
echo [4/5] Подготовка к запуску приложения...
cd /d "%~dp0"
echo Рабочая директория: %CD%
echo.

:: Проверка наличия docker-compose.yml
if not exist "docker-compose.yml" (
    echo ОШИБКА: Файл docker-compose.yml не найден!
    echo Убедитесь, что вы запускаете скрипт из корневой директории проекта.
    pause
    exit /b 1
)

:: Запуск приложения
echo [5/5] Запуск приложения...
echo.
echo Запуск Docker контейнеров...
docker-compose up -d

if %errorLevel% equ 0 (
    echo.
    echo ================================================
    echo   УСТАНОВКА И ЗАПУСК ЗАВЕРШЕНЫ!
    echo ================================================
    echo.
    echo Приложение "Планировщик Ремонта" запущено!
    echo.
    echo Доступ к приложению:
    echo   Frontend:  http://localhost:5173
    echo   API Docs:  http://localhost:8000/docs
    echo.
    echo Браузер откроется автоматически через 5 секунд...
    echo.
    echo Для остановки приложения выполните:
    echo   docker-compose down
    echo.

    :: Открытие браузера
    timeout /t 5 /nobreak >nul
    start http://localhost:5173

    echo Установка завершена: %date% %time% >> "%LOGFILE%"
    echo.
    echo Нажмите любую клавишу для выхода...
    pause >nul
) else (
    echo.
    echo ================================================
    echo   ОШИБКА ПРИ ЗАПУСКЕ ПРИЛОЖЕНИЯ
    echo ================================================
    echo.
    echo Проверьте логи для диагностики:
    echo   docker-compose logs
    echo.
    echo Лог установки: %LOGFILE%
    echo.
    pause
    exit /b 1
)

exit /b 0
