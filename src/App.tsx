import "./App.css";
import { useState, useEffect } from "react";
import { Layout, Menu, MenuProps } from "antd";
import { HomeOutlined, PlayCircleOutlined } from "@ant-design/icons";
import Index from "./components/index";

type MenuItem = Required<MenuProps>["items"][number];
type MenuCurrent = "index" | "webrtc";
const items1: MenuItem[] = [
  {
    label: "主页",
    key: "index",
    icon: <HomeOutlined />,
  },
  {
    label: "音视频相关",
    key: "webrtc",
    icon: <PlayCircleOutlined />,
    children: [
      { label: "拍照", key: "takePhoto" },
      { label: "录制", key: "transcribe" },
    ],
  },
];
const headerStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  height: 64,
  paddingInline: 48,
  lineHeight: "64px",
  backgroundColor: "#4096ff",
};
const contentStyle: React.CSSProperties = {
  textAlign: "center",
  minHeight: 120,
  lineHeight: "120px",
  backgroundColor: "#fff",
};
function App() {
  const [current, setCurrent] = useState<MenuCurrent>("index");
  const { Header, Content } = Layout;

  const handleMenuClick = (e: any) => {
    setCurrent(e.key);
  };
  useEffect(() => {
    console.log("?", current);
    return () => {};
  }, [current]);

  return (
    <div className="mainBox">
      <Layout>
        <Header style={headerStyle}>
          <div className="demo-logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[current]}
            onClick={handleMenuClick}
            defaultSelectedKeys={["2"]}
            items={items1}
            style={{ flex: 1, minWidth: 0 }}
          />
        </Header>
        <Content style={contentStyle}>
          <div className="content">{current === "index" && <Index />}</div>
        </Content>
      </Layout>
    </div>
  );
}

export default App;
