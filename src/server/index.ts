import axios from "axios";

const apiClient = axios.create({
  // baseURL: "http://localhost:3001",//本地调试
  baseURL: "http://43.157.25.191:3001",//线上
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const checkCode = async (code: string) => {
  try {
    const response = await apiClient.post("/cloud/checkCode", { code });
    return response.data;
  } catch (error) {
    console.error("GET request Code Error", error);
  }
};

export const reloadAIBot = async () => {
  try {
    const response = await apiClient.post("/cloud/reloadBot");
    return response.data;
  } catch (error) {
    console.error("Reload AI Bot Error", error);
  }
};
