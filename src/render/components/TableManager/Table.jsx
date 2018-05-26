import React from "react";
import {observable, autorun} from "mobx";
import {observer} from "mobx-react";
import {Button, Input, Select, Tabs, message} from "antd";
import {ipcRenderer, remote} from "electron";
import {
  GET_TABLE_DATA,
  GET_TABLE_DATA_RETURN,
  SAVE_TABLE_NAME_CHANGE,
  SAVE_TABLE_NAME_CHANGE_RETURN,
  SAVE_TABLE_DATA_CHANGE,
  SAVE_TABLE_DATA_CHANGE_RETURN
} from "src/common/channel";
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
        editing: false,

        dataCopy: [],
        columnsCopy: [],
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

          this.selfState.dataCopy = observable(JSON.parse(JSON.stringify(data)));
          this.selfState.columnsCopy = observable(JSON.parse(JSON.stringify(columns)));
        }, 300)
      );

      autorun(() => {
        if (store.goTableState.forceUpdateTableComponent) {
          store.goTableState.forceUpdateTableComponent = false;
          if ((this.selfState.newTableName =
            this.selfState.table =
              store.goTableState.shouldVisitTable) !== "") {
            this.selfState.handling = true;
            ipcRenderer.send(GET_TABLE_DATA, this.selfState.table);
          }
        }
      });

      this.changeTableName = () => {
        if (this.selfState.table === ''
          || this.selfState.newTableName === ''
          || this.selfState.newTableName === this.selfState.table
          || store.tables.findIndex((t) => t === this.selfState.newTableName) !== -1
          || store.specificTables.findIndex((t) => t === this.selfState.newTableName) !== -1)
          return;
        if (window.confirm(`修改表名为"${this.selfState.newTableName}"？`)) {
          this.selfState.handling = true;
          ipcRenderer.send(SAVE_TABLE_NAME_CHANGE, {
            classes: JSON.parse(JSON.stringify(store.classes)),
            tables: JSON.parse(JSON.stringify(store.tables)),
            oldName: this.selfState.table,
            newName: this.selfState.newTableName,
          });
        }
      };

      ipcRenderer.on(SAVE_TABLE_NAME_CHANGE_RETURN, _.debounce((e, {ok, err}) => {
        this.selfState.handling = false;
        if (ok) {
          const oldName = this.selfState.table;
          const cls = store.tableToClass.get(oldName);
          if (cls) {
            const i = cls.tables.findIndex(t => t === oldName);
            cls.tables[i] = this.selfState.newTableName;
          }
          const i = store.tables.findIndex(t => t === oldName);
          this.selfState.table = store.tables[i] = this.selfState.newTableName;
          message.success("修改成功");
        } else {
          message.error(`修改失败：${err}`);
        }
      }, 500));

      this.clickEdit = () => {
        if (this.selfState.editing) {
          if (window.confirm("放弃更改？")) {
            this.selfState.editing = false;
          }
        } else {
          this.selfState.editing = true;
        }
      };

      this.saveTableChange = () => {
        this.selfState.handling = true;
        const data = JSON.parse(JSON.stringify(this.selfState.dataCopy));
        const columns = JSON.parse(JSON.stringify(this.selfState.columnsCopy));
        ipcRenderer.send(SAVE_TABLE_DATA_CHANGE, {data, columns});
      };

      ipcRenderer.on(SAVE_TABLE_DATA_CHANGE_RETURN, (e, {ok, err}) => {
        this.selfState.handling = false;
        if (ok) {
          message.success("更改保存成功");
        } else {
          message.error("保存失败：" + err);
        }
      })
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
                <a
                  style={{width: "100%"}}
                  onClick={this.changeTableName}
                >
                  修改表名
                </a>
              )}
              defaultValue={this.selfState.table}
              onInput={e => {
                this.selfState.newTableName = e.target.value.trim();
              }}
              value={this.selfState.newTableName}
            />
            <Button onClick={this.clickEdit}>{this.selfState.editing ? '放弃更改' : '编辑表格'}</Button>
            {this.selfState.editing ? <Button onClick={this.saveTableChange}>保存更改</Button> : null}
          </div>

          {
            !this.selfState.editing
              ? (
                <ReactTable
                  data={this.selfState.data.slice()}
                  columns={this.selfState.columns
                    .slice()
                    .map(col => ({Header: col, accessor: col}))}
                  defaultPageSize={10}
                />
              )
              : (
                <ReactTable
                  data={this.selfState.dataCopy.slice()}
                  columns={this.selfState.columnsCopy
                    .slice()
                    .map(col => ({
                      Header: col,
                      accessor: col,
                      Cell: (cellInfo) => {
                        return (
                          <div
                            style={{backgroundColor: "#fafafa"}}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => {
                              this.selfState.dataCopy[cellInfo.index][cellInfo.column.id]
                                = e.target.innerHTML;
                            }}
                            dangerouslySetInnerHTML={{
                              __html: this.selfState.dataCopy[cellInfo.index][cellInfo.column.id]
                            }}
                          />
                        );
                      },
                    }))}
                  defaultPageSize={10}
                />
              )
          }
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

const Table = ({data, columns}) => {
  return (
    <ReactTable
      data={data.slice()}
      columns={columns
        .slice()
        .map(col => ({Header: col, accessor: col}))}
      defaultPageSize={10}
    />
  )
};

const EditableTable = ({box}) => {
  return (
    <ReactTable
      data={box.data.slice()}
      columns={box.columns
        .slice()
        .map(col => ({
          Header: col,
          accessor: col,
          Cell: (cellInfo) => {
            return (
              <div
                style={{backgroundColor: "#fafafa"}}
                contentEditable
                suppressContentEditableWarning
                onBlur={e => {
                  box.data[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
                }}
                dangerouslySetInnerHTML={{
                  __html: box.data[cellInfo.index][cellInfo.column.id]
                }}
              />
            );
          },
        }))}
      defaultPageSize={10}
    />
  )
};
