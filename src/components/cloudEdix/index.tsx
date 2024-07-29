import { useState } from "react";
import { Form, Radio, message, Input, Button, Collapse, Card } from "antd";
import "./index.less";
import { checkCode, reloadAIBot } from "../../server";
import { LogViewer } from "@patternfly/react-log-viewer";

type TModelTyoe =
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "gpt-4-turbo"
  | "wenxin"
  | "xunfei"
  | "glm-4"
  | "claude-3-haiku"
  | "moonshot";

type TTextToImage = "dall-e-2" | "dall-e-3";
interface FormType {
  model: TModelTyoe;
  text_to_image: TTextToImage;
  open_ai_api_key?: string;
}

const cloudEdix = () => {
  //@ts-ignore
  const [model, setModel] = useState<TModelTyoe>("gpt-4");
  //@ts-ignore
  const [textToImage, setTextToImage] = useState<TTextToImage>("dall-e-2");
  const [useFulltext, setUseFullText] = useState<boolean>(false);
  const [actionCode, setActionCode] = useState<number>(0);
  const [pageFlag, setPageFlag] = useState<boolean>(false);
  const [logPre, setLogpre] = useState<string | null>();

  const [messageApi, contextHolder] = message.useMessage();

  const options = [
    { label: "列表输入", value: false },
    { label: "富文本", value: true },
  ];
  const { Panel } = Collapse;

  const handleChange = () => {
    setUseFullText(!useFulltext);
  };
  function cleanObject(obj: any) {
    // Check if obj is an object and not null
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        // Recur for nested objects
        if (typeof obj[key] === "object") {
          cleanObject(obj[key]);
        }
        // Delete key if value is null or undefined
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
      setPageFlag(true);
    }
  };

  const actionCodeChange = async (e: any) => {
    console.log(typeof e.target.value);
    const { value } = e.target;
    // 使用正则表达式来限制输入值只能是数字
    if (/^\d*$/.test(value)) {
      setActionCode(value);
    }
  };

  const onSubmit = async (e: FormType) => {
    const param = cleanObject(e);
    console.log("去冲后数据", param);
  };

  const reloadServer = async () => {
    const result = await reloadAIBot();
    console.log("打印", result);
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
              style={{ width: 800 }}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 14 }}
              initialValues={{ model: "gpt-4", text_to_image: "dall-e-2" }}
              onFinish={onSubmit}
              layout="horizontal"
            >
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
                    <Radio.Group value={model}>
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
                    <Radio.Group value={textToImage}>
                      <Radio.Button value="dall-e-2">dall-e-2</Radio.Button>
                      <Radio.Button value="dall-e-3">dall-e-3</Radio.Button>
                    </Radio.Group>
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
              {/* <Card title="日志查看器"> */}
              {/* <Collapse>
                    <Panel header="日志内容" key="1">
                    
                    </Panel>
                  </Collapse> */}
              {/* <pre>{logPre}</pre> */}
              {/* </Card> */}
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
