import XLSX from 'xlsx'
import path from "path"
import {db, ddb, saveDatabase} from 'src/main/db';
import {
  GET_CLASSES_RETURN,
  ADD_EXCEL_FILE_RETURN,
  SAVE_TABLE_RETURN,
  SAVE_CLASS_CHANGE_RETURN,
  GET_TABLE_DATA_RETURN,
  SAVE_TABLE_NAME_CHANGE_RETURN
} from 'src/common/channel';
import {observable} from 'mobx';
import sql from 'sql';
import LRU from "lru-cache"

const cache = LRU({
  max: 20,
  maxAge: 1000 * 60 * 10,
});

sql.setDialect('sqlite');
const store = new Map();
const LAST_TABLE_DATA = "lastTableData";
const numberRegExp = /^[0-9]{1,8}(\.[0-9]+)?$/;
const intRegExp = /^[0-9]+$/;

export function getClasses(e) {
  const classes = ddb.get("classes").value();
  const tables = ddb.get("tables").value();
  const specificTables = ddb.get("specificTables").value();
  e.sender.send(GET_CLASSES_RETURN, {classes, tables, specificTables});
}

export function addExcelFile(e, filePath) {
  const {name} = path.parse(filePath);
  const workbook = XLSX.readFile(filePath);
  let data = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);
  if (data.length === 0) {
    e.sender.send(ADD_EXCEL_FILE_RETURN, {err: "无数据或表格式不标准"});
    return;
  }
  const columns = [];
  const columnsOfNumber = new Set();
  for (let key in data[0]) {
    columns.push(key);
    let isNumber = true;
    for (let row of data) {
      if (!numberRegExp.test(row[key].trim())) {
        isNumber = false;
        break;
      }
    }
    if (isNumber) {
      columnsOfNumber.add(key);
    }
  }
  data = data.map(row => {
    for (let c of columnsOfNumber) {
      if (intRegExp.test(row[c].trim())) {
        row[c] = Number.parseInt(row[c]);
      } else {
        row[c] = Number.parseFloat(row[c]);
      }
    }
    return row;
  });
  e.sender.send(ADD_EXCEL_FILE_RETURN, {data, name, columns});
  store.set(LAST_TABLE_DATA, {data, name, columns, columnsOfNumber});
}

export function saveTable(e, name, theClass) {
  const {data, columns, columnsOfNumber} = store.get(LAST_TABLE_DATA);
  const table = sql.define({
    name,
    columns: columns.map(c => {
      return {
        name: c,
        dataType: columnsOfNumber.has(c) ? "REAL" : "TEXT",
      }
    }),
  });
  const createSql = table.create().toString();
  try {
    db.run(createSql);
    ddb.get("tables").push(name).write();
    if (theClass !== '未分类')
      ddb.get("classes").find(c => c.name === theClass).get('tables').push(name).write();
    getClasses(e);
    const insertSql = table.insert(data).toString();
    try {
      db.run(insertSql);
      e.sender.send(SAVE_TABLE_RETURN, {createOk: true, insertOk: true});
    } catch (err) {
      console.error(err);
      e.sender.send(SAVE_TABLE_RETURN, {err: "数据插入失败", createOk: true, insertOk: false});
    }
  } catch (err) {
    console.error(err);
    e.sender.send(SAVE_TABLE_RETURN, {err: "创建表失败: " + err.toString(), createOk: false});
  }
  saveDatabase();
}

export function saveClassChange(e, {classes}) {
  ddb.set("classes", classes).write();
  e.sender.send(SAVE_CLASS_CHANGE_RETURN, {ok: true});
}

export function getTableData(e, table) {
  const c = cache.get(`getTableData:${table}`);
  if (c) {
    e.sender.send(GET_TABLE_DATA_RETURN, c);
    return;
  }
  try {
    const result = db.exec(`select * from "${table}"`);
    if (result.length > 0) {
      const raw = result[0];
      const columns = raw["columns"];
      const values = raw["values"];
      const data = values.map(v => {
        const row = {};
        for (let i = 0; i < columns.length; i++) {
          row[columns[i]] = v[i];
        }
        return row;
      });
      cache.set(`getTableData:${table}`, {columns, data});
      e.sender.send(GET_TABLE_DATA_RETURN, {columns, data});
    } else {
      e.sender.send(GET_TABLE_DATA_RETURN, {err: "没有找到数据"});
    }
  } catch (err) {
    console.error(err);
    e.sender.send(GET_TABLE_DATA_RETURN, {err: err.toString()});
  }
}

export function saveTableNameChange(e, {classes, tables, oldName, newName}) {
  try {
    db.exec(`ALTER TABLE "${oldName.trim()}" RENAME TO "${newName.trim()}"`);
    ddb.set("classes", classes).write();
    ddb.set("tables", tables).write();
    e.sender.send(SAVE_TABLE_NAME_CHANGE_RETURN, {ok: true});
  } catch (err) {
    console.error(err);
    e.sender.send(SAVE_TABLE_NAME_CHANGE_RETURN, {ok: false, err: err.toString()});
  }
}

export function saveTableDataChange(e, {data, columns}) {

}