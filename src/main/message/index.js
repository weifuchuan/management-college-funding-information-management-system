import {ipcMain} from "electron"
import {GET_CLASSES, ADD_EXCEL_FILE, SAVE_TABLE} from 'src/common/channel'
import {getClasses, addExcelFile, saveTable} from "src/main/handler"

ipcMain.on(GET_CLASSES, getClasses);
ipcMain.on(ADD_EXCEL_FILE, addExcelFile);
ipcMain.on(SAVE_TABLE, saveTable);