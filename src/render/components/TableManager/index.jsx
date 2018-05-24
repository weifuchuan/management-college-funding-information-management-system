import React from "react"
import {observer} from "mobx-react"
import {observable} from 'mobx'
import {Button, Icon, Layout, Menu} from "antd";
import ScrollArea from "react-scrollbar";
import {Route, Control} from "react-keeper"
import AddTable from "./AddTable";

const {Sider, Content} = Layout;
const {SubMenu} = Menu;

const store = window.store;

export default observer(class TableManager extends React.Component {

  constructor(props) {
    super(props);

    this.selfState = observable.object({
      currentTable: "",
    });

    this.selectTable = table => {
      this.selfState.currentTable = table;
    };
  }

  render() {
    return (
      <Layout>
        <Sider width={200} style={{background: '#fff'}}>
          <div style={{display: "flex", flexDirection: "column", height: '100%', backgroundColor: "#001529"}}>
            <ScrollArea
              style={{flex: 1}}
            >
              <Menu
                mode="inline"
                style={{borderRight: 0}}
                theme={"dark"}
              >
                {
                  store.classes.map((item) => {
                    return (
                      <SubMenu key={item.name} title={<span>{item.name}</span>}>
                        {
                          item.tables.map((subc) => {
                            return (
                              <Menu.Item key={subc} onClick={this.selectTable}>{subc}</Menu.Item>
                            )
                          })
                        }
                      </SubMenu>
                    )
                  })
                }
                <SubMenu
                  key={"[未分类]"}
                  title={<span>[未分类]</span>}
                >
                  {
                    store.otherTables.map(t => (
                      <Menu.Item key={t} onClick={this.selectTable}>{t}</Menu.Item>
                    ))
                  }
                </SubMenu>
              </Menu>
            </ScrollArea>
            <Button style={{backgroundColor: "#121b4b"}} type={"primary"} onClick={() => {
              Control.go("/manager/add-table")
            }}>新增表格</Button>
            <Button style={{backgroundColor: "#121b4b"}} type={"primary"} onClick={() => {
            }}>分类管理</Button>
          </div>
        </Sider>
        <Layout>
          <Content style={{background: '#fff', padding: 24, margin: 0, minHeight: 280, display: "flex"}}>
            <Route cache path={"/add-table"} component={AddTable}/>
          </Content>
        </Layout>
      </Layout>
    );
  }
})