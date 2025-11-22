const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const fixPath = require('fix-path');

// Исправление PATH для macOS
fixPath();

let mainWindow;
let backendProcess;
const isDev = process.argv.includes('--dev');
const backendPort = 8000;

// Путь к ресурсам приложения
function getResourcePath(relativePath) {
  if (isDev) {
    return path.join(__dirname, '..', relativePath);
  }
  return path.join(process.resourcesPath, relativePath);
}

// Запуск Python backend
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = getResourcePath('backend');
    const pythonScript = path.join(backendPath, 'app', 'main.py');

    console.log('Starting backend from:', backendPath);
    console.log('Python script:', pythonScript);

    // Определение команды Python
    let pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    // В режиме разработки используем системный Python
    // В продакшене будем использовать встроенный Python
    if (!isDev) {
      if (process.platform === 'win32') {
        const embeddedPython = path.join(process.resourcesPath, 'python', 'python.exe');
        if (fs.existsSync(embeddedPython)) {
          pythonCmd = embeddedPython;
        }
      } else if (process.platform === 'darwin') {
        const embeddedPython = path.join(process.resourcesPath, 'python', 'bin', 'python3');
        if (fs.existsSync(embeddedPython)) {
          pythonCmd = embeddedPython;
        }
      }
    }

    // Проверка наличия Python
    const checkPython = spawn(pythonCmd, ['--version']);

    checkPython.on('error', (err) => {
      console.error('Python not found:', err);
      dialog.showErrorBox(
        'Python не найден',
        'Для работы приложения требуется Python 3.11 или выше.\n' +
        'Пожалуйста, установите Python с официального сайта python.org'
      );
      reject(err);
    });

    checkPython.on('close', (code) => {
      if (code === 0) {
        console.log('Python found, starting backend...');

        // Установка зависимостей (только в dev режиме)
        if (isDev) {
          console.log('Installing dependencies...');
          const pip = spawn(pythonCmd, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
            cwd: backendPath,
            shell: true
          });

          pip.stdout.on('data', (data) => console.log('pip:', data.toString()));
          pip.stderr.on('data', (data) => console.error('pip error:', data.toString()));

          pip.on('close', () => {
            launchBackend(pythonCmd, backendPath, resolve, reject);
          });
        } else {
          launchBackend(pythonCmd, backendPath, resolve, reject);
        }
      }
    });
  });
}

function launchBackend(pythonCmd, backendPath, resolve, reject) {
  // Запуск uvicorn сервера
  const uvicornArgs = [
    '-m', 'uvicorn',
    'app.main:app',
    '--host', '127.0.0.1',
    '--port', String(backendPort),
    '--log-level', 'info'
  ];

  backendProcess = spawn(pythonCmd, uvicornArgs, {
    cwd: backendPath,
    shell: true,
    env: { ...process.env }
  });

  backendProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log('Backend:', message);

    // Проверяем, запустился ли сервер
    if (message.includes('Uvicorn running') || message.includes('Application startup complete')) {
      console.log('Backend started successfully');
      resolve();
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('Backend error:', data.toString());
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
    reject(err);
  });

  backendProcess.on('close', (code) => {
    console.log('Backend process exited with code', code);
  });

  // Даем серверу время на запуск
  setTimeout(() => {
    resolve();
  }, 3000);
}

// Создание главного окна
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    title: 'Планировщик Ремонта',
    backgroundColor: '#1a1a2e',
    show: false
  });

  // Показываем окно когда оно готово
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // В режиме разработки загружаем localhost
  // В продакшене загружаем собранные файлы
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Инициализация приложения
app.whenReady().then(async () => {
  try {
    console.log('App is ready, starting backend...');
    await startBackend();
    console.log('Backend started, creating window...');
    createWindow();
  } catch (err) {
    console.error('Failed to start application:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Завершение работы
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
  }
});

// IPC обработчики
ipcMain.handle('get-backend-url', () => {
  return `http://127.0.0.1:${backendPort}`;
});
