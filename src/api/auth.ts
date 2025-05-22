import request from './request';

// 登录接口
interface LoginResponse {
  code: number;
  message: string;
  data?: any; // 根据实际返回的数据结构调整
}

export const login = (data: { username: string; password: string }): Promise<LoginResponse> => {
    return request.post('/login', data); // 假设后端登录接口为 /login
  };