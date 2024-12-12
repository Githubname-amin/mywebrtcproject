import { Button, Card, Layout, message, Table, Tabs, Upload } from "antd";
import "./index.less";
// import ShowBox from "./Components/showBox";

import {
  DeleteOutlined,
  DownloadOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { RcFile } from "antd/es/upload";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

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
  const [summaryLoadingFiles, setSummaryLoadingFiles] = useState(new Set()); // 正在加载摘要的文件集合
  const [detailedSummaryLoadingFiles, setDetailedSummaryLoadingFiles] =
    useState(new Set()); // 正在加载详细摘要的文件集合

  // 获取上传视频中已经转录的个数
  const getSelectedTranscribedFilesCount = () => {
    return uploadedFiles.filter((f) => f.status === "done").length;
  };
  // 检查是否有转录结果的函数
  const checkTranscription = () => {
    if (!currentFile?.transcription || currentFile.transcription.length === 0) {
      message.warning("需等待视频/音频完成转录");
      return false;
    }
    return true;
  };

  // 用来生成总结
  const handleSummary = async () => {
    if (!checkTranscription()) return;
    if (!currentFile) return;

    const fileId = currentFile.id;
    if (summaryLoadingFiles.has(fileId)) {
      message.warning("该文件正在生成总结");
      return;
    }
    const text = currentFile.transcription
      .map((item: any) => item.text)
      .join(" ");
    try {
      setSummaryLoadingFiles((prev) => new Set([...prev, fileId]));

      //找到当前操作文件在总数据集的位置
      const fileRef = uploadedFiles.find((item: any) => item.id === fileId);
      if (!fileRef) return;

      // 开始更改数据集里的数据
      fileRef.detailedSummary = "";
      // 强制更新 uploadedFiles
      setUploadedFiles([...uploadedFiles]);

      // 生成总结请求
      const response = await fetch("http://localhost:6688/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });
      if (!response.ok) {
        throw new Error("生成总结失败");
      }

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder("utf-8");
      // console.log("生成总结成功", decoder, reader);
      let summaryText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        summaryText += chunk;
        // 直接更新文件引用中的内容
        fileRef.detailedSummary = summaryText;
        // 变更currentFile
        setCurrentFile({ ...currentFile, detailedSummary: summaryText });
        // 强制更新 uploadedFiles
        setUploadedFiles([...uploadedFiles]);
      }
    } catch (error) {
      console.log("总结失败", error);
      message.error("总结失败" + error.message);
    } finally {
      setDetailedSummaryLoadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // 导出总结
  const handleExportSummary = async (summaryText, type = "summary") => {
    if (!checkTranscription()) return;
    if (!currentFile) return;
    if (!summaryText) {
      message.warning("请先完成视频/音频总结");
      return;
    }
    if (typeof summaryText !== "string") {
      message.warning("总结格式错误");
      return;
    }
    try {
      const response = await fetch("http://localhost:6688/api/export/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: summaryText, type }),
      });
      if (!response.ok) {
        throw new Error("总结导出失败");
      }
      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_${currentFile.name}_${Date.now()
        .toString()
        .slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      message.success("总结导出成功");
    } catch (error) {
      console.log("总结导出失败", error);
      message.error("总结导出失败" + error.message);
    }
  };
  // 修改内容展示组件
  const SummaryContent = ({ fileId, content, isLoading }: any) => {
    const containerId = `summary-content-${fileId}`;

    // 直接使用传入的 content，不再使用本地状态
    return (
      <div key={fileId} id={containerId} className="markdown-content">
        <ReactMarkdown>{content || ""}</ReactMarkdown>
      </div>
    );
  };
  // DOM
  const transcriptionColumns = [
    {
      title: "时间点",
      dataIndex: "time",
      key: "time",
      width: "30%",
      render: (_, record) => {
        return (
          <Button
            type="link"
            onClick={() => {
              handleTimeClick(record.start);
            }}
            style={{ padding: 0 }}
          >
            [{formatTimeFn(record.start)} - {formatTimeFn(record.end)}]
          </Button>
        );
      },
    },
    {
      title: "内容",
      dataIndex: "text",
      key: "text",
    },
  ];
  const tabItems = [
    {
      key: "1",
      label: "转录结果",
      children: (
        <>
          <div
            onClick={() => {
              console.log("当前日志", currentFile);
            }}
          >
            查看数据
          </div>
          <div>
            {selectedFiles.length > 0 && (
              <span>
                已选择 {getSelectedTranscribedFilesCount()} 个转录文件
              </span>
            )}
          </div>
          <div>
            <Button.Group size="small">
              <Button
                onClick={() => handleExport("vtt")}
                icon={<DownloadOutlined />}
                disabled={!currentFile?.transcription}
              >
                VTT
              </Button>
              <Button
                onClick={() => handleExport("srt")}
                icon={<DownloadOutlined />}
                disabled={!currentFile?.transcription}
              >
                SRT
              </Button>
              <Button
                onClick={() => handleExport("txt")}
                icon={<DownloadOutlined />}
                disabled={!currentFile?.transcription}
              >
                TXT
              </Button>
            </Button.Group>
          </div>
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
    {
      key: "2",
      label: "简单总结",
      children: (
        <div>
          {currentFile && (
            <div
              onClick={() => {
                console.log("查看总结", currentFile, uploadedFiles);
              }}
            >
              <span>当前文件： {currentFile.name}</span>
            </div>
          )}
          <div>
            <Button
              loading={detailedSummaryLoadingFiles.has(currentFile?.id)}
              onClick={handleSummary}
              disabled={
                !currentFile?.transcription ||
                detailedSummaryLoadingFiles.has(currentFile?.id)
              }
            >
              生成总结
            </Button>
            <Button
              onClick={() => {
                handleExportSummary(currentFile.detailedSummary, "summary");
              }}
              icon={<DownloadOutlined />}
              disabled={!currentFile?.detailedSummary}
            >
              导出总结
            </Button>
          </div>
          {!currentFile ? (
            <div>
              <p>请在上方选择要查看总结的文件</p>
            </div>
          ) : !currentFile.transcription ? (
            <div>
              <p>当前文件未转录</p>
            </div>
          ) : !currentFile.detailedSummary ? (
            <div>
              <p>当前文件未生成总结</p>
            </div>
          ) : (
            <SummaryContent
              fileId={currentFile.id}
              content={currentFile.detailedSummary}
              // isLoading={summaryLoadingFiles.has(currentFile.id)}
              isLoading={false}
            />
          )}
        </div>
      ),
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
      summary: "",
      detailedSummary: "",
      mindmapData: null,
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
            console.log("转录成功开始写入", data, abortTranscribing);

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

            // 转录完成了,设置当前预览的对象
            if (currentFile?.id === fileId) {
              setCurrentFile((prev) => ({
                ...prev,
                status: "done",
                transcription: data.transcription,
              }));
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
    console.log("打印时间点", record, mediaRef.current);
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
        .padStart(2, "0")}:${Number(
        seconds.toString().padStart(2, "0")
      ).toFixed(2)}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${Number(
      seconds.toString().padStart(2, "0")
    ).toFixed(2)}`;
  };

  // 下载字幕
  const handleExport = (type: string) => {
    // 检查是否选定了文件且文件已转录完成
    if (
      currentFile &&
      currentFile.transcription &&
      currentFile.status === "done"
    ) {
      // 获取字幕数据对象
      const subtitles = currentFile.transcription;

      let content = "";

      if (type === "srt") {
        // 转换为 SRT 格式
        content = subtitles
          .map((sub, index) => {
            const start = formatTime(sub.start);
            const end = formatTime(sub.end);
            return `${index + 1}\n${start} --> ${end}\n${sub.text}\n`;
          })
          .join("\n");
      } else if (type === "vtt") {
        // 转换为 VTT 格式
        content =
          "WEBVTT\n\n" +
          subtitles
            .map((sub) => {
              const start = formatTime(sub.start);
              const end = formatTime(sub.end);
              return `${start} --> ${end}\n${sub.text}\n`;
            })
            .join("\n");
      } else if (type === "txt") {
        content = subtitles
          .map((sub) => {
            const start = formatTime(sub.start);
            const end = formatTime(sub.end);
            return `[${start} - ${end}] ${sub.text}`;
          })
          .join("\n");
      } else {
        console.error("Unsupported format");
        return;
      }

      // 创建下载的 Blob 对象
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentFile.name}.${type}`;
      link.click();

      // 释放 URL 对象
      URL.revokeObjectURL(url);
    } else {
      console.error("No valid file or transcription available");
    }
  };

  // 格式化时间函数 (hh:mm:ss,ms)
  const formatTime = (seconds: any) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = seconds % 1;
    return date.toISOString().substr(11, 8) + `,${Math.floor(ms * 1000)}`;
  };

  return (
    <>
      <Layout style={{ minHeight: "90vh", background: "#f0f2f5" }}>
        <div className="AIAndVideoPage">
          {/* 用来操作上传视频，开始转录制 */}
          <div className="actionTop">
            {/* 展示视频组件 */}
            {/* <Card style={{ width: 800, height: 400 }}> */}
            <Card className="showVideo">
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
            {/* 用来上传视频 */}
            <div className="upload">
              <Card className="uploadCardOne">
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
              <Card className="uploadCardTwo">
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
            <Card className="showBottomCard">
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
