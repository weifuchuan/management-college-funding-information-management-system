import SQL from "sql.js"
import {app} from "electron"
import fs from "fs"
import path from 'path';
import initSql from './sql'

const dbFilePath = path.join(__dirname, "db.sqlite");

let db;

try {
  fs.accessSync(dbFilePath, fs.R_OK | fs.W_OK);
  const data = fs.readFileSync(dbFilePath);
  db = new SQL.Database(data);
} catch (err) {
  console.log("create database");
  db = new SQL.Database();
  err = fs.writeFileSync(dbFilePath, new Buffer(db.export()));
  if (err) {
    console.error(err);
    app.exit(-1);
  }
}

db.run(initSql);

app.on("will-quit", () => {
  console.log("will quit, save database");
  try {
    fs.writeFileSync(dbFilePath, new Buffer(db.export()));
  } catch (err) {
    console.error(err);
  }
});

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const ddb = low(adapter);

ddb.defaults({
  classes: [/* {name: "国家资助", tables: ["国家奖学金", "国家助学金"]} */],
  tables: [/* "国家奖学金" */],


}).write();


export {db, ddb};