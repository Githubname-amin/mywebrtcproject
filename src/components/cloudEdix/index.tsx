import { useState, useEffect } from "react";
import {
  Form,
  Radio,
  message,
  Input,
  Button,
  Switch,
  Select,
} from "antd";
import "./index.less";
import { checkCode, getConfig, reloadAIBot, updateConfig } from "../../server";
import { LogViewer } from "@patternfly/react-log-viewer";

export type TModelType =
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "gpt-4-turbo"
  | "wenxin"
  | "xunfei"
  | "glm-4"
  | "claude-3-haiku"
  | "moonshot";

export type TTextToImage = "dall-e-2" | "dall-e-3";

export interface FormType {
  model: TModelType;
  text_to_image: TTextToImage;
  open_ai_api_key?: string;
}

export interface IConfig {
  status: string;
  data: {
    channel_type: string;
    model: TModelType;
    open_ai_api_key: string;
    claude_api_key: string;
    text_to_image: TTextToImage;
    voice_to_text: string;
    text_to_voice: string;
    proxy: string;
    hot_reload: boolean;
    single_chat_prefix: string[];
    single_chat_reply_prefix: string;
    group_chat_prefix: string[];
    group_name_white_list: string[];
    image_create_prefix: string[];
    speech_recognition: boolean;
    group_speech_recognition: boolean;
    voice_reply_voice: boolean;
    conversation_max_tokens: number;
    expires_in_seconds: number;
    character_desc: string;
    temperature: number;
    subscribe_msg: string;
    use_linkai: boolean;
    linkai_api_key: string;
    linkai_app_code: string;
  };
}

const cloudEdix = () => {
  const [form] = Form.useForm();
  const [model, setModel] = useState<TModelType>("gpt-4");
  const [textToImage, setTextToImage] = useState<TTextToImage>("dall-e-2");
  const [useFulltext, setUseFullText] = useState<boolean>(false);
  const [actionCode, setActionCode] = useState<number>(0);
  const [pageFlag, setPageFlag] = useState<boolean>(false);
  const [logPre, setLogpre] = useState<string | null>();
  const [configData, setConfigData] = useState<any>({});
  const [initialConfig, setInitialConfig] = useState<any>({});

  const [messageApi, contextHolder] = message.useMessage();

  const options = [
    { label: "列表输入", value: false },
    { label: "富文本", value: true },
  ];

  const handleChange = () => {
    setUseFullText(!useFulltext);
  };

  function cleanObject(obj: any) {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "object") {
          cleanObject(obj[key]);
        }
        if (obj[key] === null || obj[key] === undefined) {
          delete obj[key];
        }
      });
    }
    return obj;
  }

  const checkCodeAction = async () => {
    const result = await checkCode(actionCode + "");
    if (result.status === "success") {
      const getConfigResult: IConfig = await getConfig();
      console.log(getConfigResult, "获取配置");
      if (getConfigResult.status === "success") {
        setModel(getConfigResult?.data?.model);
        setTextToImage(getConfigResult?.data?.text_to_image);
        setConfigData(getConfigResult?.data);
        setInitialConfig(getConfigResult?.data);
        setPageFlag(true);
        form.setFieldsValue(getConfigResult?.data);
      }
    }
  };

  const actionCodeChange = async (e: any) => {
    const { value } = e.target;
    if (/^\d*$/.test(value)) {
      setActionCode(value);
    }
  };

  const onSubmit = async (e: any) => {
    const param = cleanObject(e);
    console.log("提交参数", param);

    // 检查是否有变化
    if (JSON.stringify(param) === JSON.stringify(initialConfig)) {
      messageApi.open({
        type: "info",
        content: "没有变化，不需要提交",
      });
      return;
    }

    const result = await updateConfig(param);
    if (result?.status === "success") {
      messageApi.open({
        type: "success",
        content: "成功",
      });
    } else {
      messageApi.open({
        type: "error",
        content: "更新配置失败",
      });
      console.log("更新配置失败", result?.message);
      return;
    }
  };

  const reloadServer = async () => {
    const result = await reloadAIBot();
    if (result.status === "success") {
      setLogpre(result.data);
    } else {
      messageApi.open({
        type: "error",
        content: "This is an error message",
      });
      return;
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      const getConfigResult: IConfig = await getConfig();
      if (getConfigResult.status === "success") {
        setModel(getConfigResult?.data?.model);
        setTextToImage(getConfigResult?.data?.text_to_image);
        setConfigData(getConfigResult?.data);
        form.setFieldsValue(getConfigResult?.data);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div>
      {contextHolder}
      <div className="indexForm">
        {!pageFlag ? (
          <>
            <Input onChange={actionCodeChange} value={actionCode}></Input>
            <Button type="primary" onClick={checkCodeAction}>
              校验
            </Button>
          </>
        ) : (
          <div className="formAndAction">
            <Form
              form={form}
              style={{ width: 800 }}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 14 }}
              initialValues={{ model: model, text_to_image: textToImage }}
              onFinish={onSubmit}
              layout="horizontal"
            >
              <div>
                详情可点击：
                <a
                  href="https://github.com/zhayujie/chatgpt-on-wechat/blob/master/config.py"
                  target="_blank"
                >
                  👉这里
                </a>
              </div>
              <Form.Item>
                <Radio.Group
                  options={options}
                  onChange={handleChange}
                  value={useFulltext}
                  optionType="button"
                />
              </Form.Item>
              {!useFulltext ? (
                <>
                  <Form.Item label="模型选择" name="model">
                    <Radio.Group>
                      <Radio.Button value="gpt-4">gpt-4</Radio.Button>
                      <Radio.Button value="gpt-3.5-turbo">
                        gpt-3.5-turbo
                      </Radio.Button>
                      <Radio.Button value="gpt-4-turbo">
                        gpt-4-turbo
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="设置 openAI的Key" name="open_ai_api_key">
                    <Input></Input>
                  </Form.Item>
                  <Form.Item label="设置图片生成模型" name="text_to_image">
                    <Radio.Group>
                      <Radio.Button value="dall-e-2">dall-e-2</Radio.Button>
                      <Radio.Button value="dall-e-3">dall-e-3</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="渠道类型" name="channel_type">
                    <Input defaultValue={configData.channel_type}></Input>
                  </Form.Item>
                  <Form.Item label="Claude API Key" name="claude_api_key">
                    <Input defaultValue={configData.claude_api_key}></Input>
                  </Form.Item>
                  <Form.Item label="语音转文本" name="voice_to_text">
                    <Input defaultValue={configData.voice_to_text}></Input>
                  </Form.Item>
                  <Form.Item label="文本转语音" name="text_to_voice">
                    <Input defaultValue={configData.text_to_voice}></Input>
                  </Form.Item>
                  <Form.Item label="代理" name="proxy">
                    <Input defaultValue={configData.proxy}></Input>
                  </Form.Item>
                  <Form.Item
                    label="热重载"
                    name="hot_reload"
                    valuePropName="checked"
                  >
                    <Switch defaultChecked={configData.hot_reload}></Switch>
                  </Form.Item>
                  <Form.Item label="单聊前缀" name="single_chat_prefix">
                    <Select
                      mode="tags"
                      defaultValue={configData.single_chat_prefix}
                    ></Select>
                  </Form.Item>
                  <Form.Item
                    label="单聊回复前缀"
                    name="single_chat_reply_prefix"
                  >
                    <Input
                      defaultValue={configData.single_chat_reply_prefix}
                    ></Input>
                  </Form.Item>
                  <Form.Item label="群聊前缀" name="group_chat_prefix">
                    <Select
                      mode="tags"
                      defaultValue={configData.group_chat_prefix}
                    ></Select>
                  </Form.Item>
                  <Form.Item label="群名白名单" name="group_name_white_list">
                    <Select
                      mode="tags"
                      defaultValue={configData.group_name_white_list}
                    ></Select>
                  </Form.Item>
                  <Form.Item label="图像创建前缀" name="image_create_prefix">
                    <Switch
                      defaultChecked={configData.image_create_prefix}
                    ></Switch>
                  </Form.Item>
                  <Form.Item
                    label="语音识别 "
                    name="speech_recognition "
                    valuePropName="checked "
                  >
                    <Switch
                      defaultChecked={configData.speech_recognition}
                    ></Switch>
                  </Form.Item>
                  <Form.Item
                    label="群语音识别 "
                    name="group_speech_recognition "
                    valuePropName="checked "
                  >
                    <Switch
                      defaultChecked={configData.group_speech_recognition}
                    ></Switch>
                  </Form.Item>
                  <Form.Item
                    label="语音回复语音 "
                    name="voice_reply_voice "
                    valuePropName="checked "
                  >
                    <Switch
                      defaultChecked={configData.voice_reply_voice}
                    ></Switch>
                  </Form.Item>
                  <Form.Item
                    label="对话最大 tokens "
                    name="conversation_max_tokens "
                  >
                    <Switch
                      defaultChecked={configData.conversation_max_tokens}
                    ></Switch>
                  </Form.Item>
                  <Form.Item label="过期时间（秒） " name="expires_in_seconds ">
                    <Switch
                      defaultChecked={configData.expires_in_seconds}
                    ></Switch>
                  </Form.Item>
                  <Form.Item label="角色描述 " name="character_desc ">
                    <Input.TextArea
                      defaultValue={configData.character_desc}
                      autoSize={{ minRows: 3, maxRows: 5 }}
                    ></Input.TextArea>
                  </Form.Item>
                  <Form.Item label="温度 " name="temperature">
                    <Switch defaultChecked={configData.temperature}></Switch>
                  </Form.Item>
                  <Form.Item label="订阅消息 " name="subscribe_msg ">
                    <Input.TextArea
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      defaultValue={configData.subscribe_msg}
                    ></Input.TextArea>
                  </Form.Item>
                  <Form.Item
                    label="使用 LinkAI "
                    name="use_linkai "
                    valuePropName="checked "
                  >
                    <Switch defaultChecked={configData.use_linkai}></Switch>
                  </Form.Item>
                  <Form.Item label="LinkAI API Key " name="linkai_api_key ">
                    <Input defaultValue={configData.linkai_api_key}></Input>
                  </Form.Item>
                  <Form.Item label="LinkAI App Code " name="linkai_app_code ">
                    <Input defaultValue={configData.linkai_app_code}></Input>
                  </Form.Item>
                </>
              ) : (
                <></>
              )}
              <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
                <Button type="primary" htmlType="submit">
                  提交
                </Button>
              </Form.Item>
            </Form>
            <Button onClick={reloadServer}>重新部署机器人</Button>
            <div className="log">
              <LogViewer
                hasLineNumbers={true}
                height={600}
                data={logPre}
                theme="light"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default cloudEdix;
