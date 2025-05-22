import axios from 'axios';
import router from '@/routes/index'; // 导入 Vue Router 实例
import { ElMessage } from 'element-plus'; // 导入 Element Plus 的消息提示组件

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8081/school', // 替换为你的后端接口地址
  timeout: 5000, // 请求超时时间
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('token', token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 假设后端返回的结构为 { code: number, msg: string, data: any }
    const { code, message} = response.data;
   
    if (code !== 200) {
      // 如果 code 不为 200，弹出错误提示，并抛出错误
      ElMessage.error(message || '请求失败');
      return Promise.reject({ code, message });
    }

    // 如果 code 为 200，返回数据部分
    return response.data;
  },
  (error) => {
    const { status, data } = error.response || {};
    console.log('完整错误响应:', { status, data }); // 打印日志

    if (status === 401) {
      // 清除本地存储的 token
      localStorage.removeItem('token');

      // 跳转到登录页面
      router.push('/login');

      // 提示用户登录已过期
      ElMessage.error(data?.message || '登录已过期，请重新登录');
      return Promise.reject(data || { code: 401, message: '请先登录' });
    }

    // 处理其他错误
    ElMessage.error(data?.message || '请求失败，请稍后重试');
    return Promise.reject(data || error.message);
  }
);

export default request;