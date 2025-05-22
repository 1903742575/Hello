<template>
  <div class="login-container">
    <div class="login-background"></div>
    <div class="login-content">
      <div class="login-illustration">
        <img src="https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg"
          alt="Login Illustration">
      </div>
      <div class="login-box">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">欢迎登录</h2>
          <p class="login-subtitle">管理系统</p>
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" clearable prefix-icon="User" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" clearable prefix-icon="Lock"
                show-password />
            </el-form-item>
            <div class="button-container">
              <el-button type="primary" @click="handleLogin" :loading="isSubmitting" round>
                登录
              </el-button>
            </div>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

const loginForm = reactive({
  username: 'admin',
  password: '123456',
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
};

const loginFormRef = ref();
const isSubmitting = ref(false);

const handleLogin = () => {
  loginFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;

    isSubmitting.value = true;
    try {
      const response = await login(loginForm);
      const { code, message, data } = response;
      console.log(code, message, data);

      if (code === 200) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('username', data.username);
        localStorage.setItem('menus', JSON.stringify(data.menus));
        ElMessage.success('登录成功');
        if (!data.menus.length) {
          router.push("/403");
        } else {
          router.push(data.menus[0].path);
        }
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录出错');
    } finally {
      isSubmitting.value = false;
    }
  });
};
</script>

<style scoped>
/* 移除默认阴影和悬停阴影 */
:deep(.el-card) {
  box-shadow: none !important;
}

:deep(.el-card:hover) {
  box-shadow: none !important;
}

.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://plus.unsplash.com/premium_photo-1680807869780-e0876a6f3cd5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Nob29sfGVufDB8fDB8fHww');
  background-size: cover;
  background-position: center;
  filter: brightness(0.6);
  z-index: 0;
}

.login-content {
  display: flex;
  width: 900px;
  height: 500px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1;
}

.login-illustration {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  padding: 20px;
}

.login-illustration img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.login-box {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.login-card {
  width: 100%;
  border: none;
  background-color: transparent;
}

.login-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.login-subtitle {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-form-item :deep(.el-form-item__label) {
  font-weight: 500;
  color: #555;
  padding-bottom: 4px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.el-button {
  font-size: 16px;
  height: 42px;
  width: 100%;
  max-width: 200px;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    width: 90%;
    height: auto;
  }

  .login-illustration {
    display: none;
  }

  .login-box {
    padding: 30px 20px;
  }
}
</style>