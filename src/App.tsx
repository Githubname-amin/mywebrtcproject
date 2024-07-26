import "./App.css";
import { useState } from "react";
import { Layout, Menu, MenuProps } from "antd";
import {
  HomeOutlined,
  PlayCircleOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { Routes, Route, useNavigate } from "react-router-dom";
import Index from "./components/index";
import NotFound from "./components/NotFound";
import TakePhoto from "./components/webrtc/takePhoto";
import Transcribe from "./components/webrtc/transcribe";
import CloudEdix from "./components/cloudEdix";

type MenuItem = Required<MenuProps>["items"][number];
type MenuCurrent = "index" | "webrtc" | "takePhoto" | "transcribe";
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
  {
    label: "配置",
    key: "cloudEdix",
    icon: <CloudServerOutlined />,
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
  backgroundColor: "#fff",
};
function App() {
  const [current, setCurrent] = useState<MenuCurrent>("index");
  const { Header, Content } = Layout;
  const navigate = useNavigate();

  const handleMenuClick = (e: any) => {
    console.log("当前路由", e);
    switch (e.key) {
      case "index":
        navigate("/");
        break;
      case "takePhoto":
        navigate("/takePhoto");
        break;
      case "transcribe":
        navigate("/transcribe");
        break;
      case "cloudEdix":
        navigate("/cloudEdix");
        break;
      default:
        break;
    }
    setCurrent(e.key);
  };

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
            defaultSelectedKeys={["index"]}
            items={items1}
            style={{ flex: 1, minWidth: 0 }}
          ></Menu>
        </Header>
        <Content style={contentStyle}>
          <div className="content">
            <Routes>
              {/* @ts-ignore */}
              <Route exact path="/" element={<Index />}></Route>
              <Route path="/takePhoto" element={<TakePhoto />}></Route>
              <Route path="/transcribe" element={<Transcribe />}></Route>
              <Route path="/cloudEdix" element={<CloudEdix />}></Route>
              {/* 兜底路由，匹配不到任何路由时显示 NotFound 组件 */}
              <Route path="*" element={<NotFound />}></Route>
            </Routes>
          </div>
        </Content>
      </Layout>
    </div>
  );
}

export default App;
