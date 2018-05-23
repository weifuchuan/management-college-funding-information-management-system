import React from 'react'
import {observable} from 'mobx'
import {observer} from 'mobx-react'
import {Button, Tabs} from "antd";
import {ipcRenderer, remote} from "electron"
import {ADD_EXCEL_FILE, ADD_EXCEL_FILE_RETURN} from "src/common/channel";
import ModalLoading from "src/render/components/ModalLoading"
import ReactTable from 'react-table'
import ScrollArea from "react-scrollbar";

const {TabPane} = Tabs;

export default observer(class AddTable extends React.Component {

  constructor(props) {
    super(props);

    this.dragFile = null;

    this.selfState = observable.object({
      selectedFile: "",
      handling: false,
      tableName: "",
      tableData: [],
      tableColumns: [],
    });

    this.addFile = () => {
      const {dialog} = remote;
      dialog.showOpenDialog({
        title: "选择EXCEL表格文件",
        buttonLabel: "确认",
        filters: [{name: "excel", extensions: ["xls", 'xlsx']}],
        properties: [
          'openFile',
        ]
      }, filePaths => {
        if (filePaths) {
          if (filePaths.length > 0) {
            this.selfState.selectedFile = filePaths[0];
          }
        }
      });
    };

    this.handle = () => {
      if (window.confirm("你想加入表格\"" + this.selfState.selectedFile + "\"吗？")) {
        ipcRenderer.send(ADD_EXCEL_FILE, this.selfState.selectedFile);
        this.selfState.handling = true;
      }
    };

    ipcRenderer.on(ADD_EXCEL_FILE_RETURN, (e, resp) => {
      this.selfState.handling = false;
      if (resp.err) {
        window.alert(resp.err);
        return;
      }
      const {data, name, columns} = resp;
      this.selfState.tableName = name;
      this.selfState.tableData = data;
      this.selfState.tableColumns = columns.map(column => ({Header: column, accessor: column}));
    });

    this.drop = () => {
      if (window.confirm("你想放弃文件\"" + this.selfState.selectedFile + "\"吗？")) {
        this.selfState.selectedFile = "";
      }
    };
  }

  render() {
    return (
      <div style={{
        flex: 1, display: "flex",
        width: '100%',
        height: '100%',
      }}>
        <Tabs defaultActiveKey="1" style={{
          flex: 1,
          width: '100%',
          height: '100%',
        }}>
          <TabPane tab="标准模式" key="1">
            <div style={Object.assign({}, styles.full, {display: "flex", flexDirection: "column"})}>
              <ScrollArea
                style={styles.full}
                smoothScrolling={true}
              >
                <div draggable={true} className={"border-of-drag-file"} style={{color: "#3d27ff"}}
                     ref={r => this.dragFile = r}
                     onClick={this.addFile}
                >
                  点击或拖动文件到此
                </div>
                {
                  this.selfState.selectedFile.length > 0
                    ? (
                      <div style={{display: "flex", width: "100%", flexDirection: "column"}}>
                        <div>
                          已选择：{this.selfState.selectedFile}
                        </div>
                        <div style={{width: "100%", display: "flex", justifyContent: "flex-end"}}>
                          <Button type="primary" onClick={this.handle} loading={this.selfState.handling}>加入</Button>
                          <Button style={{marginLeft: "1em"}} onClick={this.drop}>放弃</Button>
                        </div>
                      </div>
                    )
                    : null
                }

                <ReactTable
                  data={this.selfState.tableData.slice()}
                  columns={this.selfState.tableColumns.slice()}
                  defaultPageSize={10}
                />
              </ScrollArea>
            </div>
          </TabPane>
          <TabPane tab="特定模式" key="2">
            <div style={styles.full}>

            </div>
          </TabPane>
        </Tabs>

        <ModalLoading loading={this.selfState.handling} title={"处理中..."}/>
      </div>
    );
  }

  componentDidMount() {
    this.dragFile.ondragover = () => {
      return false;
    };
    this.dragFile.ondragleave = this.dragFile.ondragend = () => {
      return false;
    };
    this.dragFile.ondrop = (e) => {
      e.preventDefault();
      for (let f of e.dataTransfer.files) {
        const ps = f.path.split('.');
        if (ps.length > 0 && (ps[ps.length - 1].toLowerCase() === "xlsx" || ps[ps.length - 1].toLowerCase() === "xls")) {
          this.selfState.selectedFile = f.path;
        } else {
          alert("不是合法的EXCEL表格文件");
        }
        return;
      }
      return false;
    }
  }

})

const styles = {
  full: {
    width: "100%",
    height: "100%",
  }
};