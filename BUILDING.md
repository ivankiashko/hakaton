# Инструкция по сборке установщиков

Этот документ описывает процесс создания установщиков для Windows и macOS.

## Требования

### Общие требования
- **Node.js** 18.x или выше ([скачать](https://nodejs.org/))
- **Python** 3.11 или выше ([скачать](https://python.org/))
- **Git** ([скачать](https://git-scm.com/))

### Для сборки Windows установщика
- **Windows** 10 или выше
- **Node.js** и **Python** установлены и доступны в PATH

### Для сборки macOS установщика
- **macOS** 10.13 или выше
- **Xcode Command Line Tools** (установить: `xcode-select --install`)
- **Node.js** и **Python** установлены

## Автоматическая сборка

### Windows

1. Откройте командную строку в корне проекта
2. Запустите скрипт сборки:
   ```bat
   build-installer-windows.bat
   ```
3. Дождитесь завершения сборки
4. Установщик будет находиться в папке `dist/`

Имя файла: `Планировщик Ремонта-Setup-1.0.0.exe`

### macOS

1. Откройте терминал в корне проекта
2. Запустите скрипт сборки:
   ```bash
   chmod +x build-installer-macos.sh
   ./build-installer-macos.sh
   ```
3. Дождитесь завершения сборки
4. Установщик будет находиться в папке `dist/`

Имя файла: `Планировщик Ремонта-1.0.0-x64.dmg` и `Планировщик Ремонта-1.0.0-arm64.dmg`

## Ручная сборка

Если вы хотите выполнить сборку вручную:

### 1. Установка зависимостей

```bash
# Корневые зависимости (Electron и electron-builder)
npm install

# Frontend зависимости
cd frontend
npm install
cd ..
```

### 2. Сборка frontend

```bash
cd frontend
npm run build
cd ..
```

### 3. Сборка установщика

**Только для Windows:**
```bash
npm run build:win
```

**Только для macOS:**
```bash
npm run build:mac
```

**Для обеих платформ (требует macOS):**
```bash
npm run build:all
```

## Структура проекта для сборки

```
hakaton/
├── electron/              # Код Electron приложения
│   ├── main.js           # Главный процесс Electron
│   ├── preload.js        # Preload скрипт
│   └── build-backend.js  # Скрипт подготовки backend
├── frontend/             # React приложение
│   └── dist/            # Собранный frontend (создается при сборке)
├── backend/             # Python FastAPI backend
│   ├── app/            # Код приложения
│   └── data/           # Данные
├── build/              # Ресурсы для сборки
│   ├── icon.ico       # Иконка для Windows
│   ├── icon.icns      # Иконка для macOS
│   ├── icon.png       # Иконка для Linux
│   └── entitlements.mac.plist  # Права для macOS
├── dist/              # Готовые установщики (создается при сборке)
└── package.json       # Конфигурация Electron и electron-builder
```

## Иконки приложения

Для профессионального вида приложения рекомендуется создать собственные иконки.

См. [build/README.md](build/README.md) для подробных инструкций по созданию иконок.

### Быстрое создание иконок

Если у вас есть PNG изображение 512x512px:

**Windows (.ico):**
- Используйте онлайн конвертер: https://convertio.co/png-ico/
- Или ImageMagick: `convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico`

**macOS (.icns):**
- Используйте онлайн конвертер: https://convertio.co/png-icns/
- Или утилиту `iconutil` (см. build/README.md)

## Что происходит при сборке?

1. **Сборка frontend**: React приложение компилируется в статические файлы (HTML, CSS, JS)
2. **Подготовка backend**: Python файлы копируются в build директорию
3. **Упаковка Electron**: Electron упаковывает приложение со всеми зависимостями
4. **Создание установщика**:
   - **Windows**: Создается NSIS установщик (.exe)
   - **macOS**: Создается DMG образ (.dmg)

## Размер установщика

Примерные размеры готовых установщиков:

- **Windows**: ~150-200 MB
- **macOS**: ~200-250 MB (для каждой архитектуры)

Размер зависит от:
- Размера Electron runtime (~100 MB)
- Размера зависимостей Node.js
- Размера frontend (обычно 5-10 MB)
- Размера backend (обычно ~1 MB)

## Установка готового приложения

### Windows

1. Скачайте `.exe` установщик
2. Запустите установщик
3. Следуйте инструкциям мастера установки
4. Приложение будет установлено в `C:\Program Files\Планировщик Ремонта\`
5. Ярлык будет создан на рабочем столе и в меню Пуск

### macOS

1. Скачайте `.dmg` установщик (выберите подходящую архитектуру: x64 или arm64)
2. Откройте `.dmg` файл
3. Перетащите приложение в папку Applications
4. Запустите приложение из папки Applications

**Важно для macOS:** При первом запуске может появиться предупреждение о безопасности. Решение:
1. Откройте Системные настройки → Безопасность
2. Нажмите "Все равно открыть"

## Требования для пользователей

После установки пользователям **НЕ нужно** устанавливать:
- ✅ Node.js - встроен в Electron
- ✅ Docker - не требуется
- ⚠️ Python - **требуется** Python 3.11+ (установщик автоматически проверит наличие)

### Установка Python для пользователей

Если у пользователя нет Python:

**Windows:**
1. Скачать с https://python.org/
2. При установке отметить "Add Python to PATH"

**macOS:**
```bash
brew install python@3.11
```

Или скачать с https://python.org/

## Отладка

### Режим разработки

Для тестирования приложения без создания установщика:

```bash
# Установить зависимости
npm install

# Запустить frontend в dev режиме (в отдельном терминале)
cd frontend
npm run dev

# Запустить Electron в dev режиме
npm run dev
```

В dev режиме:
- Frontend загружается с `http://localhost:5173`
- Открываются DevTools
- Python backend запускается локально

### Проблемы при сборке

**Ошибка: "Cannot find module 'electron'"**
```bash
npm install
```

**Ошибка: "Python not found"**
- Установите Python 3.11+
- Убедитесь, что Python доступен в PATH

**Ошибка: "Frontend build failed"**
```bash
cd frontend
npm install
npm run build
```

**macOS: Ошибка при создании .icns**
- Проверьте наличие всех размеров иконок
- Используйте онлайн конвертер

## Публикация

После сборки установщики готовы к распространению:

1. **GitHub Releases**: Загрузите установщики как release artifacts
2. **Веб-сайт**: Разместите на своем сайте для скачивания
3. **Подпись кода** (рекомендуется):
   - Windows: используйте сертификат Code Signing
   - macOS: используйте Apple Developer ID

## Дополнительные команды npm

```bash
# Запустить приложение в dev режиме
npm run dev

# Собрать frontend
npm run build:frontend

# Подготовить backend
npm run build:backend

# Собрать для Windows
npm run build:win

# Собрать для macOS
npm run build:mac

# Собрать для обеих платформ
npm run build:all

# Создать неупакованную директорию (для отладки)
npm run pack

# Полная сборка (prebuild + build:all)
npm run dist
```

## Поддержка

Если возникли проблемы при сборке:
1. Проверьте версии Node.js и Python
2. Убедитесь, что все зависимости установлены
3. Проверьте логи сборки на наличие ошибок
4. Создайте issue в репозитории проекта
