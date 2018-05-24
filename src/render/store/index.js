import {observable} from 'mobx'
import {ipcRenderer} from "electron";
import {GET_CLASSES, GET_CLASSES_RETURN} from "src/common/channel";
import _ from "lodash"

const store = observable({
  classes: [],
  tables: [],

  get otherTables() {
    return _.difference(this.tables, _.flatMap(this.classes, c => c.tables));
  }
});

ipcRenderer.send(GET_CLASSES);
ipcRenderer.on(GET_CLASSES_RETURN, (event, {classes, tables}) => {
  store.classes = observable.array(classes);
  store.tables = observable.array(tables);
});

window.store = store;