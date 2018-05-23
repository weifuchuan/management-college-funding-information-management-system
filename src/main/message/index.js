import {ipcMain} from "electron"
import {GET_CLASSES,ADD_EXCEL_FILE} from 'src/common/channel'
import {getClasses,addExcelFile} from "src/main/handler"

ipcMain.on(GET_CLASSES, getClasses);
ipcMain.on(ADD_EXCEL_FILE, addExcelFile);