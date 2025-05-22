<template>
    <div class="no-permission-container">
      <div class="no-permission-content">
        <div class="illustration">
          <el-icon :size="100" color="#F56C6C">
            <Warning />
          </el-icon>
        </div>
        <h1 class="title">403 无权限访问</h1>
        <p class="description">抱歉，您没有权限访问该页面</p>
        <div class="action">
          <el-button type="primary" @click="goBack">返回上一页</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { Warning } from '@element-plus/icons-vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const goBack = () => {
    router.go(-1)
  }
  
  const goHome = () => {
    router.push('/')
  }
  </script>
  
  <style lang="scss" scoped>
  .no-permission-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f7fa;
    
    .no-permission-content {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      
      .illustration {
        margin-bottom: 24px;
      }
      
      .title {
        font-size: 24px;
        color: #303133;
        margin-bottom: 16px;
      }
      
      .description {
        font-size: 16px;
        color: #606266;
        margin-bottom: 24px;
      }
      
      .action {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
    }
  }
  </style>