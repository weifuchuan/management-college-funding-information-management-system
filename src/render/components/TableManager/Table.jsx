import React from "react";
import {observable, autorun} from "mobx";
import {observer} from "mobx-react";
import {Button, Input, Select, Tabs, message} from "antd";
import {ipcRenderer, remote} from "electron";
import {GET_TABLE_DATA, GET_TABLE_DATA_RETURN, SAVE_TABLE_NAME_CHANGE} from "src/common/channel";
import ModalLoading from "src/render/components/ModalLoading";
import ReactTable from "react-table";
import _ from "lodash";
import ScrollArea from "react-scrollbar";
import {Control} from "react-keeper";

const {TabPane} = Tabs;

const store = window.store;

export default observer(
  class Table extends React.Component {
    constructor(props) {
      super(props);

      this.selfState = observable.object({
        table: "",
        columns: [],
        data: [],
        handling: false,
        newTableName: '',
      });

      ipcRenderer.on(
        GET_TABLE_DATA_RETURN,
        _.debounce((e, {err, columns, data}) => {
          this.selfState.handling = false;
          if (err) {
            message.error(err);
            return;
          }
          this.selfState.columns = observable(columns);
          this.selfState.data = observable(data);
        }, 300)
      );

      autorun(() => {
        if (store.goTableState.forceUpdateTableComponent) {
          store.goTableState.forceUpdateTableComponent = false;
          if (
            (this.selfState.table = store.goTableState.shouldVisitTable) !== ""
          ) {
            this.selfState.handling = true;
            ipcRenderer.send(GET_TABLE_DATA, this.selfState.table);
          }
        }
      });

      this.changeTableName = () => {
        const oldName = this.selfState.table;
        const cls = store.tableToClass.get(oldName);
        if (cls) {
          const i = cls.tables.findIndex(t => t === oldName);
          cls.tables[i] = this.selfState.newTableName;
        }
        const i = store.tables.findIndex(t => t === oldName);
        store.tables[i] = this.selfState.newTableName;
        ipcRenderer.send(SAVE_TABLE_NAME_CHANGE, {classes: store.classes, tables: store.tables})
      };
    }

    render() {
      return (
        <div
          className={"full"}
          style={{display: "flex", flexDirection: "column"}}
        >
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <Input
              addonBefore={"表名"}
              addonAfter={(
                <Button disabled={
                  this.selfState.newTableName === this.selfState.table
                  || store.tables.findIndex((t) => t === this.selfState.newTableName) !== -1
                  || store.specificTables.findIndex((t) => t === this.selfState.newTableName) !== -1}
                        onClick={this.changeTableName}>
                  修改
                </Button>
              )}
              defaultValue="this.selfState.table"
              onInput={e => this.selfState.newTableName = e.target.value.trim()}
            />
          </div>
          <ReactTable
            data={this.selfState.data.slice()}
            columns={this.selfState.columns
              .slice()
              .map(col => ({Header: col, accessor: col}))}
            defaultPageSize={10}
          />
          <ModalLoading loading={this.selfState.handling} title={"处理中..."}/>
        </div>
      );
    }

    componentDidMount() {
      if ((this.selfState.table = store.goTableState.shouldVisitTable) !== "") {
        this.selfState.handling = true;
        ipcRenderer.send(GET_TABLE_DATA, this.selfState.table);
      }
    }
  }
);
