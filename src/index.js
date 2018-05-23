import {app, BrowserWindow} from 'electron';
import installExtension, {REACT_DEVELOPER_TOOLS} from 'electron-devtools-installer';
import {enableLiveReload} from 'electron-compile';
import * as Splashscreen from "@trodi/electron-splashscreen";

/*
 保留窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾收集时，窗口将自动关闭。
 */
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({strategy: 'react-hmr'});

const createWindow = async () => {
  // Create the browser window.
  // mainWindow = new BrowserWindow({
  //   width: 800,
  //   height: 600,
  // });

  mainWindow = Splashscreen.initSplashScreen({
    windowOpts: {
      width: 800,
      height: 600,
      title: "管理学院资助信息管理系统",
    },
    templateUrl: `${__dirname}/splash-screen.html`,
    splashScreenOpts: {
      width: 425,
      height: 325,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// Electron完成初始化并准备创建浏览器窗口时，将调用此方法。一些API只能在发生此事件后才能使用。
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// 在这个文件中，您可以包含应用程序的其他特定主流程代码。您也可以将它们放在单独的文件中并将它们导入到此处。

import "src/main/db"
import "src/main/message"
