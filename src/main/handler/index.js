import XLSX from 'xlsx'
import path from "path"
import {db, ddb} from 'src/main/db';
import {GET_CLASSES_RETURN, ADD_EXCEL_FILE_RETURN} from 'src/common/channel';
import {observable} from 'mobx';

const store = observable.map(new Map());
const LAST_TABLE_DATA = "lastTableData";
const numberRegExp = /^[0-9]{1,8}(\.[0-9]+)?$/;
const intRegExp = /^[0-9]+$/;

export function getClasses(e) {
  const classes = ddb.get("classes").value();
  e.sender.send(GET_CLASSES_RETURN, classes);
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
  const columnOfNumber = [];
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
      columnOfNumber.push(key);
    }
  }
  data = data.map(row => {
    for (let c of columnOfNumber) {
      if (intRegExp.test(row[c])) {
        row[c] = Number.parseInt(row[c]);
      } else {
        row[c] = Number.parseFloat(row[c]);
      }
    }
    return row;
  });
  e.sender.send(ADD_EXCEL_FILE_RETURN, {data, name, columns});
  store.set(LAST_TABLE_DATA, {data, name, columns});
}