# Build Resources

Эта директория содержит ресурсы для сборки приложения.

## Требуемые файлы

### Иконки

Для полноценной сборки приложения нужны следующие иконки:

1. **icon.png** - PNG иконка 512x512px (для Linux и превью)
2. **icon.ico** - Windows иконка (содержит размеры: 16x16, 32x32, 48x48, 256x256)
3. **icon.icns** - macOS иконка (содержит все необходимые размеры)
4. **background.png** - Фон для DMG установщика macOS (540x380px)

### Как создать иконки

#### Из PNG изображения (512x512px):

**Windows (.ico):**
```bash
# Используя ImageMagick
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# Или онлайн на https://convertio.co/png-ico/
```

**macOS (.icns):**
```bash
# Создаем временную директорию
mkdir icon.iconset

# Создаем все нужные размеры
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Конвертируем в icns
iconutil -c icns icon.iconset

# Удаляем временную директорию
rm -rf icon.iconset
```

## Примечание

Если иконки отсутствуют, electron-builder использует иконку по умолчанию.
Для профессионального приложения рекомендуется создать собственные иконки.
