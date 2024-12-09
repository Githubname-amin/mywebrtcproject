import { Button, Card, Layout, message, Upload } from "antd";
import "./index.less";
// import ShowVideo from "./Components/showVideo";

import { UploadOutlined } from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import { useRef, useState } from "react";

const AIAndVideo = () => {
  // data-----------------------------
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [mediaUrl, setMediaUrl] = useState(null);
  const mediaRef = useRef(null);

  // Function===================================
  // 用来上传文件
  const handleUpload = async (file: RcFile) => {
    // 先检查文件上传的是音频还是视频
    console.log("查看上传的文件", file);
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    if (!isVideo && !isAudio) {
      message.error("只能上传视频或音频文件");
      return;
    }
    // 检查文件是否已经存在
    const isExist = uploadedFiles.some((f) => f.name === file.name);
    if (isExist) {
      message.warning("文件已存在");
      return false;
    }

    // 保存文件
    const url = URL.createObjectURL(file);
    const newFile = {
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      url: url,
      type: isVideo ? "video" : "audio",
      file: file,
      status: "waiting",
    };
    setUploadedFiles((prev) => [...prev, newFile]);
    // 如果是第一个文件，动设置为当前预览文件
    if (uploadedFiles.length === 0) {
      // setCurrentFile(newFile);
      setMediaUrl({ url, type: isVideo ? "video" : "audio" });
    }
    return false; // 阻止自动上传
  };
  return (
    <>
      <Layout style={{ minHeight: "90vh", background: "#f0f2f5" }}>
        <div className="AIAndVideoPage">
          {/* 用来操作上传视频，开始转录制 */}
          <div className="actionTop">
            <div className="showVideo">
              {/* 展示视频组件 */}
              <Card style={{ width: 800, height: 400 }}>
                {/* <ShowVideo></ShowVideo> */}
                <div className="video-container">
                  {mediaUrl ? (
                    <>
                      <video
                        ref={mediaRef}
                        src={mediaUrl.url}
                        controls
                        className="video-player"
                      />
                    </>
                  ) : (
                    ""
                  )}
                </div>
              </Card>
            </div>
            {/* 用来上传视频 */}
            <div className="upload">
              <Card style={{ width: 400, height: 400 }}>
                <div className="upload-section">
                  <Upload
                    beforeUpload={handleUpload}
                    accept="video/*,audio/*"
                    showUploadList={false}
                    multiple={true}
                    directory={false}
                  >
                    <Button icon={<UploadOutlined />}>上传本地文件</Button>
                  </Upload>
                </div>
              </Card>
            </div>
          </div>
          {/* 用来展示效果 */}
          <div className="showBottom"></div>
        </div>
      </Layout>
    </>
  );
};
export default AIAndVideo;
