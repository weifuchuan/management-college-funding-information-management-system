import React from "react"
import {observer} from "mobx-react"
import {observable} from 'mobx'
import {Button, Icon, Layout, Menu} from "antd";

const {Sider, Content} = Layout;
const {SubMenu} = Menu;
import {ipcRenderer} from 'electron'
import {GET_CLASSES, GET_CLASSES_RETURN} from "src/common/channel"
import ScrollArea from "react-scrollbar";
import {Route,Control} from "react-keeper"
import AddTable from "./AddTable";

export default observer(class TableManager extends React.Component {

  constructor(props) {
    super(props);

    this.selfState = observable.object({
      classes: [/* {name: "国家资助", subClasses: ["国家奖学金", "国家助学金"]} */],
      currentClass: "",
    });

    this.selectSubClass = subClass => {
      this.selfState.currentClass = subClass;
    };
  }

  render() {
    return (
      <Layout>
        <Sider width={200} style={{background: '#fff'}}>
          <div style={{display: "flex", flexDirection: "column", height: '100%', backgroundColor: "#001529"}}>
            <ScrollArea
              style={{flex:1}}
            >
              <Menu
                mode="inline"
                style={{borderRight: 0}}
                theme={"dark"}
              >
                {
                  this.selfState.classes.map((item) => {
                    return (
                      <SubMenu key={item.name} title={<span>{item.name}</span>}>
                        {
                          item.subClasses.map((subc) => {
                            return (
                              <Menu.Item key={subc} onClick={this.selectSubClass}>{subc}</Menu.Item>
                            )
                          })
                        }
                      </SubMenu>
                    )
                  })
                }
              </Menu>
            </ScrollArea>
            <Button style={{backgroundColor:"#121b4b"}}  type={"primary"} onClick={() => {
              Control.go("/manager/add-table")
            }}>新增表格</Button>
            <Button style={{backgroundColor:"#121b4b"}} type={"primary"} onClick={() => {
            }}>分类管理</Button>
          </div>
        </Sider>
        <Layout>
          <Content style={{background: '#fff', padding: 24, margin: 0, minHeight: 280, display:"flex"}}>
            <Route cache path={"/add-table"} component={AddTable} />
          </Content>
        </Layout>
      </Layout>
    );
  }

  componentDidMount() {
    ipcRenderer.send(GET_CLASSES);
    ipcRenderer.on(GET_CLASSES_RETURN, (event, data) => {
      this.selfState.classes = observable.array(data);
    });
  }

})