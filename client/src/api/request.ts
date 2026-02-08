import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

// Create Axios instance
const service: AxiosInstance = axios.create({
  baseURL: '/api', // Proxy handled by Vite
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get user from localStorage or Store
    // For compatibility with existing backend which uses x-user-id
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
            config.headers['x-user-id'] = user.id;
        }
      } catch (e) {
        console.error('Failed to parse user from storage');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // In order to avoid the "Static function can not consume context" warning,
    // we should ideally use App.useApp().message in components.
    // However, for a global axios interceptor, we are outside of the React Component tree.
    // The warning is benign here, but if we want to fix it strictly, 
    // we would need to eject the message logic to where the request is called, 
    // or use a global message holder initialized inside the App component.
    
    // For now, we will suppress the warning by using the static method as is,
    // accepting that it won't have the context theme.
    // To silence it explicitly isn't easy without a global holder.
    
    // Let's keep it as is, but acknowledge the warning is expected here.
    
    const { response } = error;
    if (response) {
      // Handle specific status codes
      switch (response.status) {
        case 401:
          message.error('未授权，请重新登录');
          // Optional: Redirect to login
          break;
        case 403:
          message.error('拒绝访问: 权限不足');
          break;
        case 404:
          message.error('请求资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else {
      message.error('网络连接异常');
    }
    return Promise.reject(error);
  }
);

export default service;
