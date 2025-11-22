@echo off
chcp 65001 >nul
echo ==================================
echo   Установщик - Планировщик ремонта
echo   Windows
echo ==================================
echo.

:: Проверка прав администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Запустите этот скрипт от имени администратора
    pause
    exit /b 1
)

:: Проверка Docker
where docker >nul 2>&1
if %errorLevel% neq 0 (
    echo Docker не установлен. Устанавливаем Docker Desktop...

    :: Скачивание Docker Desktop
    echo Скачивание Docker Desktop для Windows...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe' -OutFile '%TEMP%\DockerDesktopInstaller.exe'}"

    :: Установка Docker Desktop
    echo Установка Docker Desktop...
    start /wait %TEMP%\DockerDesktopInstaller.exe install --quiet

    echo.
    echo Docker Desktop установлен. Запустите Docker Desktop и дождитесь его готовности.
    echo Нажмите любую клавишу после запуска Docker Desktop...
    pause >nul
) else (
    echo Docker уже установлен
)

:: Проверка Git
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo Git не установлен. Устанавливаем Git...

    :: Скачивание Git
    echo Скачивание Git для Windows...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile '%TEMP%\GitInstaller.exe'}"

    :: Установка Git
    echo Установка Git...
    start /wait %TEMP%\GitInstaller.exe /VERYSILENT /NORESTART

    echo Git установлен
) else (
    echo Git уже установлен
)

echo.
set /p clone="Хотите клонировать репозиторий? (y/n): "
if /i "%clone%"=="y" (
    set /p repo_url="Введите URL репозитория: "
    set /p install_dir="Введите директорию для установки (по умолчанию: C:\renovation-planner): "
    if "%install_dir%"=="" set install_dir=C:\renovation-planner

    git clone "%repo_url%" "%install_dir%"
    cd /d "%install_dir%"
)

echo.
echo ==================================
echo   Установка завершена!
echo ==================================
echo.
echo Для запуска приложения выполните:
echo   start.bat
echo.
pause
