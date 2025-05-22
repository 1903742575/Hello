// 获取本周的开始和结束日期
export function getWeekRange(date) {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 周一作为一周的开始
    const start = new Date(date.setDate(diff))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return [start, end]
  }
  
  // 获取本月的开始和结束日期
  export function getMonthRange(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    
    return [start, end]
  }