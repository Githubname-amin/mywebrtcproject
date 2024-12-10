import { Button, Card, Layout, message, Table, Tabs, Upload } from "antd";
import "./index.less";
// import ShowBox from "./Components/showBox";

import {
  DeleteOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import { useRef, useState } from "react";

const AIAndVideo = () => {
  // data-----------------------------
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]); // 存储选中的文件
  const [mediaUrl, setMediaUrl] = useState(null);
  const mediaRef = useRef(null);
  const [currentFile, setCurrentFile] = useState(null); // 当前预览的文件
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [abortTranscribing, setAbortTranscribing] = useState(false); // 停止转录状态
  const [isTranscribingLoading, setIsTranscribingLoading] = useState(false);

  const tabItems = [
    {
      key: "1",
      label: "转录结果",
      children: (
        <>
          <div>
            {!currentFile ? (
              <div>请上传文件</div>
            ) : (
              <div>
                {currentFile && (
                  <div>
                    <span>当前名称:{currentFile.name}</span>
                  </div>
                )}
                {!currentFile.transcription ? (
                  <div>未转录</div>
                ) : (
                  <Table
                    dataSource={currentFile.transcription.map(
                      (item: any, index: any) => ({
                        ...item,
                        key: index,
                      })
                    )}
                    columns={transcriptionColumns}
                  />
                )}
              </div>
            )}
          </div>
        </>
      ),
    },
  ];

  // DOM
  const transcriptionColumns = [
    {
      title: "时间点",
      dataIndex: "time",
      key: "time",
      width: "30%",
      render: (_, record) => {
        <Button
          type="link"
          onClick={() => {
            handleTimeClick(record);
          }}
          style={{ padding: 0 }}
        >
          [{formatTimeFn(record.start)} - {formatTimeFn(record.end)}]
        </Button>;
      },
    },
  ];

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
      transcription: null,
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

  // 转录函数
  const handleTranscript = async () => {
    setIsTranscribingLoading(true);
    setTimeout(() => {
      setIsTranscribingLoading(false);
    }, 500);
    if (!currentFile) return;
    if (isTranscribing) {
      // 转录中触发这个函数，则发起停止请求
      setIsTranscribing(false);
      setAbortTranscribing(true);
      try {
        const response = await fetch(
          "http://localhost:6688/api/stop-transcribe",
          {
            method: "POST",
          }
        );
        console.log("停止转录响应", response);
      } catch (error) {
        console.log("停止转录失败", error);
        message.error("停止转录失败" + error);
      } finally {
        setAbortTranscribing(false);
      }
      return;
    } else {
      // 非转录中触发这个函数，则发起转录请求
      if (selectedFiles.length === 0) {
        message.error("请选择要转录的文件");
        return;
      }
      setIsTranscribing(true);
      setAbortTranscribing(false);
      message.loading("转录中...");
      try {
        for (const fileId of selectedFiles) {
          // 检查是否已经请求终端
          if (abortTranscribing) {
            // 只将当前在转的文件状态改为终端
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.status === "transcribing"
                  ? { ...f, status: "interrupted" }
                  : f
              )
            );
            break;
          }
          const file = uploadedFiles.find((f) => f.id === selectedFiles[0]);
          if (!file) continue; // 如果文件不存在，则跳过
          if (file.status === "done") {
            message.info(`文件-${file.name}已转录,跳过此文件`);
            continue;
          }
          // 考虑是续传的状态怎么办

          // 在文件源中更新文件状态
          setUploadedFiles((prev) =>
            prev.map((f) => {
              if (f.id === fileId) {
                f.status = "transcribing";
                return f;
              }
              return f;
            })
          );

          try {
            const formData = new FormData();
            formData.append("file", file.file, file.name);
            const response = await fetch("http://localhost:6688/api/upload", {
              method: "POST",
              body: formData,
            });
            const data = await response.json();
            console.log(`文件-${file.name}转录成功`, data, response);
            if (response.status === 499) {
              // 特定的响应码表达本条转录的结果为中断的情况,只更新当前文件的状态
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, status: "interrupted" } : f
                )
              );
              break; // 中断后续文件的转录
            }
            // 如果不ok

            if (!response.ok) {
              throw new Error(`转录失败: ${file.name}`);
            }

            // 确定转录完成
            if (!abortTranscribing) {
              setUploadedFiles((prev) => {
                const newFiles = prev.map((f) =>
                  f.id === fileId
                    ? {
                        ...f,
                        status: "done",
                        transcription: data.transcription,
                      }
                    : f
                );
                return newFiles;
              });
            }
          } catch (error) {
            // 确定没有终端请求
            if (!abortTranscribing) {
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId ? { ...f, status: "error" } : f
                )
              );
              console.log(`文件-${file.name}转录失败`, error);
              message.error(`文件-${file.name}转录失败: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log("转录失败", error);
        message.error("转录失败" + error);
      } finally {
        setIsTranscribing(false);
        setAbortTranscribing(false);
        message.destroy();
      }
    }
  };

  // 用来跳转对应的时间点
  const handleTimeClick = (record: any) => {
    console.log("打印时间点", record);
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = record;
    mediaRef.current.play();
  };

  // 用来做时间格式化
  const formatTimeFn = (time: any) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
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
                    onClick={() => handleDeleteSelectedFiles()}
                  >
                    删除选中
                  </Button>
                  <Button
                    className="transcriptBtn"
                    style={{ width: 100 }}
                    icon={<UploadOutlined />}
                    onClick={handleTranscript}
                    danger={isTranscribing}
                    loading={isTranscribingLoading}
                  >
                    {isTranscribing ? "停止转入" : "开始转录"}
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
          <div className="showBottom">
            <Card style={{ width: 1200, height: 600 }}>
              {/* <ShowBox></ShowBox> */}
              <Card className="feature-card">
                <Tabs items={tabItems} />
              </Card>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
};
export default AIAndVideo;
