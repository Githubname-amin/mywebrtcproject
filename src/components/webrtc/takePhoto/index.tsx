import { useState, useEffect } from "react";
import { Button, Image, Radio, RadioChangeEvent, Select } from "antd";
import "./index.less";
const takePhoto = () => {
  // 可设置默认视频流
  const [imgSrc, setImgSrc] = useState<string>();
  const [imgAction, setImgAction] = useState<number>(1);
  const [originalImgSrc, setOriginalImgSrc] = useState<string>();
  const [originalImgSize, setOriginalImgSize] = useState<number>();
  // 设备信息
  const [deviceData, setDeviceData] = useState<MediaDeviceInfo[]>([]);

  // 获取设备信息
  const getDeviceFn = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("当前设备", devices);
    setDeviceData(devices.filter((device) => device.kind === "videoinput"));
  };

  // 获取本地视频流
  const getLocalStream = async (options: MediaStreamConstraints) => {
    console.log("当前", options);
    const stream = await window.navigator.mediaDevices.getUserMedia(options);
    console.log("当前设备列表", stream);
    playLocalStream(stream);
  };

  // 播放本地视频流
  const playLocalStream = (stream: MediaStream) => {
    const videoEl = document.getElementById("localVideo") as HTMLVideoElement;
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {});
  };

  // 拍照
  const handleTakePhoto = () => {
    const videoEl = document.getElementById("localVideo") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    setImgSrc(canvas.toDataURL("image/jpeg"));
    setOriginalImgSrc(canvas.toDataURL("image/jpeg"));
    //得到当前图片大小
    const nowSize = getNowImgByte(canvas.toDataURL("image/jpeg"));
    setOriginalImgSize(nowSize);
    // 得到了不同时期按下拍照后的图片，支持后续选中，然后处理它
  };

  // 图片处理
  const handleImgAction = (e: RadioChangeEvent) => {
    // 记录当前操作方法
    setImgAction(e.target.value);
  };

  useEffect(() => {
    // 获取设备信息
    getDeviceFn();
    getLocalStream({
      audio: false,
      video: true,
      // video: { facingMode: { exact: 'environment' } },
      // video: { facingMode: { exact: 'user' } },
    });
    return () => {};
  }, []);
  useEffect(() => {
    if (!imgSrc) return;

    const applyImageProcessing = () => {
      switch (imgAction) {
        case 1:
          setImgSrc(originalImgSrc); // 显示原图
          break;
        case 2:
          compressImage();
          break;
        case 3:
          adjustSaturation();
          break;
        case 4:
          adjustBrightness();
          break;
        default:
          break;
      }
    };

    // canvas.toDataURL("image/jpeg") 返回一个包含图片数据的 Base64 编码的字符串，
    // 这个字符串包含了一些额外的元数据（如数据类型前缀 data:image/jpeg;base64,），所以其大小会比 Blob.size 略大。
    const compressImage = (mimeType = "image/jpeg", quality = 0.2) => {
      // 图片压缩处理逻辑
      if (!originalImgSrc) {
        console.log("未拿到图片");
        return;
      }
      const img = new window.Image();
      img.src = originalImgSrc as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        let imageData = canvas?.toDataURL(mimeType, quality);
        console.log("canvas图片压缩", imageData);
        setImgSrc(imageData);
      };
    };

    const adjustSaturation = () => {
      // 调整饱和度处理逻辑
      const img = new window.Image();
      img.src = originalImgSrc as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ) as any;
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray + 1.5 * (data[i] - gray);
          data[i + 1] = gray + 1.5 * (data[i + 1] - gray);
          data[i + 2] = gray + 1.5 * (data[i + 2] - gray);
        }
        ctx?.putImageData(imageData, 0, 0);
        setImgSrc(canvas.toDataURL());
      };
    };

    const adjustBrightness = (brightness = 1.2) => {
      // 调整亮度处理逻辑
      if (!originalImgSrc) {
        console.log("未拿到图片");
        return;
      }
      const img = new window.Image();
      img.src = originalImgSrc as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ) as ImageData;
        const data = imageData.data;

        // 调整每个像素的亮度
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * brightness; // Red
          data[i + 1] = data[i + 1] * brightness; // Green
          data[i + 2] = data[i + 2] * brightness; // Blue
        }

        // 将处理后的数据放回画布
        ctx?.putImageData(imageData, 0, 0);
        const brightenedImgSrc = canvas.toDataURL("image/png");
        setImgSrc(brightenedImgSrc);

        // 计算调整后的图像大小
        const brightenedImgSize = getNowImgByte(brightenedImgSrc);
        console.log(`Brightened image size: ${brightenedImgSize} bytes`);
      };
    };

    applyImageProcessing();
  }, [imgAction, originalImgSrc]);

  const getNowImgByte = (imageData: string, mimeType = "image/jpeg") => {
    // 计算 Data URL 的字节大小
    const base64Data = imageData.split(",")[1];
    const byteString = atob(base64Data);
    // 计算 Data URL 的大小
    const dataUrlSize = byteString.length;
    console.log(`Data URL size: ${dataUrlSize} bytes`);

    const buffer = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
      view[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: mimeType });
    const dataSize = blob.size;
    console.log(`Compressed image size: ${dataSize} bytes`);
    return dataSize;
  };

  const pictureBox = () => {
    return (
      <>
        <div className="pictureBox">
          <div className="pictureBoxheader">
            <Image width={400} src={imgSrc} />
          </div>
          {imgSrc && (
            <div className="pictureBoxButtom">
              <Radio.Group
                name="radiogroup"
                onChange={handleImgAction}
                defaultValue={imgAction}
              >
                <Radio value={1}>原图</Radio>
                <Radio value={2}>图片压缩</Radio>
                <Radio value={3}>饱和度</Radio>
                <Radio value={4}>调整图片亮度</Radio>
              </Radio.Group>
            </div>
          )}
          {imgSrc && imgAction === 2 && (
            <div>
              <div>原图大小(image/jpeg):{originalImgSize} kB</div>
              <div>操作后大小:{getNowImgByte(imgSrc)} kB</div>
            </div>
          )}
        </div>
      </>
    );
  };

  // 改变设备
  const handleDeviceChange = (deviceId: string) => {
    console.log("变更", deviceId);
    getLocalStream({
      audio: false,
      video: {
        deviceId: { exact: deviceId },
      },
    });
  };
  return (
    <>
      <span className="readme">
        拍照、图片处理、and 其他有意思操作。如果不能看到摄像头授权，请先参照
        <a href="https://blog.csdn.net/weixin_45408862/article/details/107865462">
          这里
        </a>
        进行配置操作
      </span>
      <div className="totalBox">
        {/* 左边拍摄按钮 and 实时展示视频流 */}
        <div className="leftBox">
          <video
            className="videoBox"
            id="localVideo"
            autoPlay
            playsInline
            muted
          ></video>
          <div className="changeBox">
            <div className="changeDevice">
              <span>切换设备:</span>
              <Select
                showSearch
                placeholder="选择设备"
                onChange={(deviceId: string) => {
                  handleDeviceChange(deviceId);
                }}
                options={(deviceData ?? []).map((item) => {
                  return {
                    value: item.deviceId,
                    label: item.label,
                  };
                })}
              />
            </div>
            <div className="changeDevice">
              {/* <span>切换方向</span> */}
            </div>
          </div>
          <Button type="primary" size="large" onClick={handleTakePhoto}>
            拍照
          </Button>
        </div>
        {/* 右边展示拍照图片处理操作 */}
        <div className="rightBox">{pictureBox()}</div>
      </div>
    </>
  );
};
export default takePhoto;
