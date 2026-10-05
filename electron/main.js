const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;
let serverProcess;

function startServer() {
  // Jalankan Express backend sebagai proses Node terpisah di dalam Electron.
  // Di production build, ini menunjuk ke server/src/index.js yang sudah dibundel bersama app.
  serverProcess = require("child_process").fork(
    path.join(__dirname, "../server/src/index.js"),
    [],
    { env: { ...process.env, PORT: 4000 } }
  );

  serverProcess.on("error", (err) => {
    console.error("Gagal menjalankan server backend:", err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    // saat development: pakai Vite dev server (npm run dev di folder client)
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // saat production: load hasil build React (client/dist/index.html)
    mainWindow.loadFile(path.join(__dirname, "../client/dist/index.html"));
  }
}

app.whenReady().then(() => {
  startServer();
  // beri sedikit jeda supaya server backend siap sebelum window dibuka
  setTimeout(createWindow, 500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
