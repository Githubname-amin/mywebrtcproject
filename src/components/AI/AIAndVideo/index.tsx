import { Button, Card, Layout, message, Table, Upload } from "antd";
import "./index.less";
// import ShowVideo from "./Components/showVideo";

import {
  DeleteOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import { useRef, useState } from "react";

const AIAndVideo = () => {
  // data-----------------------------
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState([]); // 存储选中的文件
  const [mediaUrl, setMediaUrl] = useState(null);
  const mediaRef = useRef(null);
  const [currentFile, setCurrentFile] = useState(null); // 当前预览的文件

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
      setCurrentFile(newFile);
      setMediaUrl({ url, type: isVideo ? "video" : "audio" });
    }
    return false; // 阻止自动上传
  };

  // 删除文件
  const handleFileDelete = (fileId: any) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 删除选中的文件
  const handleDeleteSelectedFiles = () => {
    setUploadedFiles((prev) =>
      prev.filter((f) => !selectedFiles.includes(f.id))
    );
    setSelectedFiles([]); // 清空选中的文件
    // 如果删除的是当前预览文件，自动展示下一个文件
    if (currentFile && selectedFiles.includes(currentFile.id)) {
      const remainingFiles = uploadedFiles.filter(
        (file) => !selectedFiles.includes(file.id)
      );
      const nextFile = remainingFiles[0];
      if (nextFile) {
        setCurrentFile(nextFile);
        setMediaUrl({ url: nextFile.url, type: nextFile.type });
      } else {
        setCurrentFile(null);
        setMediaUrl(null);
      }
    }
  };

  // 预览
  const handleFilePreview = (file: any) => {
    const currentFileRef = uploadedFiles.find((f) => f.id === file.id);
    setCurrentFile(currentFileRef);
    setMediaUrl({ url: file.url, type: file.type });
  };
  // 处理文件选择
  const handleFileSelect = (fileIds: any) => {
    setSelectedFiles(fileIds);
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
              <Card style={{ width: 400, height: 100 }}>
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
                  <Button
                    className="deleteBtn"
                    style={{ width: 100 }}
                    icon={<UploadOutlined />}
                    onClick={() => handleDeleteSelectedFiles(selectedFiles)}
                  >
                    删除选中
                  </Button>
                  <Button
                    className="transcriptBtn"
                    style={{ width: 100 }}
                    icon={<UploadOutlined />}
                  >
                    转录选中
                  </Button>

                  {/* <div className="upload-tips">支持多个视频和音频文件格式</div> */}
                </div>
              </Card>
              <Card style={{ width: 400, height: 280 }}>
                <div>
                  <Table
                    dataSource={uploadedFiles}
                    rowSelection={{
                      selectedRowKeys: selectedFiles,
                      onChange: handleFileSelect,
                      preserveSelectedRowKeys: true,
                    }}
                    rowKey="id"
                    size="small"
                    columns={[
                      {
                        title: "文件名",
                        dataIndex: "name",
                        key: "name",
                        width: "70%",
                      },
                      {
                        title: "类型",
                        dataIndex: "type",
                        key: "type",
                        render: (type) => (type === "video" ? "视频" : "音频"),
                      },
                      {
                        title: "状态",
                        dataIndex: "status",
                        key: "status",
                        render: (status) => {
                          switch (status) {
                            case "waiting":
                              return "等待转录";
                            case "transcribing":
                              return (
                                <>
                                  <SyncOutlined spin /> 转录中
                                </>
                              );
                            case "done":
                              return (
                                <span style={{ color: "#52c41a" }}>已完成</span>
                              );
                            case "error":
                              return (
                                <span style={{ color: "#ff4d4f" }}>失败</span>
                              );
                            case "interrupted":
                              return (
                                <span style={{ color: "#faad14" }}>
                                  转录中断
                                </span>
                              );
                            default:
                              return status;
                          }
                        },
                      },
                      {
                        title: "操作",
                        dataIndex: "action",
                        key: "action",
                        render: (_, record) => (
                          <Button
                            type="text"
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDelete(record.id);
                            }}
                            icon={<DeleteOutlined />}
                            disabled={record.status === "transcribing"}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ]}
                    onRow={(record) => ({
                      onClick: () => handleFilePreview(record),
                      style: {
                        cursor: "pointer",
                        background:
                          currentFile?.id === record.id ? "#e6f7ff" : "inherit",
                      },
                    })}
                    pagination={false}
                  ></Table>
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
