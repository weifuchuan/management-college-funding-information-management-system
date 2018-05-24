export const GET_CLASSES = "getClasses"; //
export const GET_CLASSES_RETURN = "getClassesReturn"; // { classes:[], tables:[] }

export const ADD_EXCEL_FILE = "addExcelFile"; // filePath: String
export const ADD_EXCEL_FILE_RETURN = "addExcelFileReturn"; // {err?, data: TableData, name: TableName, columns: TableColumnNames}

export const SAVE_TABLE = "saveTable"; // name: String, theClass: String
export const SAVE_TABLE_RETURN = "saveTableReturn"; // {err?, createOk: Bool, insertOk: Bool}
