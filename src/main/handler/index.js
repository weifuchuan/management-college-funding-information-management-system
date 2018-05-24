import XLSX from 'xlsx'
import path from "path"
import {db, ddb} from 'src/main/db';
import {GET_CLASSES_RETURN, ADD_EXCEL_FILE_RETURN, SAVE_TABLE_RETURN} from 'src/common/channel';
import {observable} from 'mobx';
import sql from 'sql';

sql.setDialect('sqlite');
const store = new Map();
const LAST_TABLE_DATA = "lastTableData";
const numberRegExp = /^[0-9]{1,8}(\.[0-9]+)?$/;
const intRegExp = /^[0-9]+$/;

export function getClasses(e) {
  const classes = ddb.get("classes").value();
  const tables = ddb.get("tables").value();
  e.sender.send(GET_CLASSES_RETURN, {classes, tables});
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
      if (!numberRegExp.test(row[key])) {
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
      if (intRegExp.test(row[c])) {
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
  const createSql = table.create().ifNotExists().toString();
  try {
    db.run(createSql);
    ddb.get("tables").push(name).write();
    if (theClass !== '未分类')
      ddb.get("classes").find(c => c.name === theClass).push(name).write();
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
}