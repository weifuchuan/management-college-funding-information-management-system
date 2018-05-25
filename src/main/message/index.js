import {
  ipcMain
} from "electron"
import {
  GET_CLASSES,
  ADD_EXCEL_FILE,
  SAVE_TABLE,
  SAVE_CLASS_CHANGE,
  GET_TABLE_DATA,
  SAVE_TABLE_NAME_CHANGE
} from 'src/common/channel'
import {
  getClasses,
  addExcelFile,
  saveTable,
  saveClassChange,
  getTableData,
  saveTableNameChange
} from "src/main/handler"

ipcMain.on(GET_CLASSES, getClasses);
ipcMain.on(ADD_EXCEL_FILE, addExcelFile);
ipcMain.on(SAVE_TABLE, saveTable);
ipcMain.on(SAVE_CLASS_CHANGE, saveClassChange);
ipcMain.on(GET_TABLE_DATA, getTableData); 
ipcMain.on(SAVE_TABLE_NAME_CHANGE, saveTableNameChange); 