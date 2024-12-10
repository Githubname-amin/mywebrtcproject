// 工具函数
// 节流函数
export const myThrottle = (fn: any, delay: number) => {
  let lastTime = 0;
  return (...args: any) => {
    const now = new Date().getTime();
    if (now - lastTime >= delay) {
      fn(...args);
      lastTime = now;
    }
  };
};
