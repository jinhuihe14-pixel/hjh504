# 便利店智能订货预测平台 - 技术架构文档

## 1. 技术选型

### 1.1 前端技术栈
| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | React 18 | 主流前端框架，组件化开发 |
| 构建工具 | Vite | 快速构建，开发体验好 |
| 语言 | JavaScript | 简洁高效，快速迭代 |
| UI组件库 | 原生CSS + 自定义组件 | 保持设计独特性，不依赖通用组件库 |
| 图表库 | ECharts | 功能强大的可视化图表库 |
| 路由 | React Router v6 | 单页应用路由管理 |
| 状态管理 | React Context + useState | 轻量状态管理 |
| HTTP请求 | Fetch API | 原生API，无需额外依赖 |

### 1.2 后端技术栈
| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | FastAPI | 高性能Python Web框架，自动生成API文档 |
| 数据处理 | Pandas / NumPy | 数据处理与数值计算 |
| 机器学习 | scikit-learn / statsmodels | 时序预测模型 |
| 数据格式 | CSV | 轻量级数据存储 |
| 模型持久化 | joblib | 模型保存与加载 |

### 1.3 整体架构
- 前后端分离架构
- 后端提供RESTful API
- 前端单页应用(SPA)
- 数据模拟与真实API平滑切换

---

## 2. 前端架构

### 2.1 目录结构
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx          # 应用入口
│   ├── App.jsx           # 根组件
│   ├── pages/            # 页面组件
│   │   ├── Dashboard.jsx      # 数据总览仪表盘
│   │   ├── Forecast.jsx       # 销量预测
│   │   ├── Orders.jsx         # 智能订货建议
│   │   ├── WasteAnalysis.jsx  # 损耗分析
│   │   ├── WeeklyReport.jsx   # 周报分析
│   │   ├── Stores.jsx         # 门店管理
│   │   └── Products.jsx       # 商品管理
│   ├── components/       # 通用组件
│   │   ├── Layout.jsx         # 布局组件（侧边栏+内容区）
│   │   ├── Sidebar.jsx        # 侧边导航
│   │   ├── StatCard.jsx       # 数据统计卡片
│   │   ├── LineChart.jsx      # 折线图封装
│   │   ├── BarChart.jsx       # 柱状图封装
│   │   ├── PieChart.jsx       # 饼图封装
│   │   ├── DataTable.jsx      # 数据表格
│   │   └── FilterBar.jsx      # 筛选栏
│   ├── api/              # API接口
│   │   ├── index.js           # API配置
│   │   ├── stores.js          # 门店接口
│   │   ├── products.js        # 商品接口
│   │   ├── forecast.js        # 预测接口
│   │   ├── orders.js          # 订货接口
│   │   ├── waste.js           # 损耗接口
│   │   └── dashboard.js       # 仪表盘接口
│   ├── utils/            # 工具函数
│   │   ├── format.js          # 格式化工具
│   │   └── constants.js       # 常量配置
│   └── styles/           # 样式文件
│       ├── global.css         # 全局样式
│       └── variables.css      # CSS变量
├── package.json
└── vite.config.js
```

### 2.2 核心页面设计

#### 2.2.1 数据总览仪表盘 (Dashboard)
- 顶部：7个核心指标卡片，横向排列
- 中部左：近30天销量趋势图（分品类多折线）
- 中部右：品类销售占比饼图
- 下部左：各门店销售对比柱状图
- 下部右：损耗趋势折线图

#### 2.2.2 销量预测 (Forecast)
- 顶部筛选栏：门店选择、品类选择、SKU搜索
- 主图表区：历史+预测销量对比折线图
- 数据表格：未来7天每日预测明细
- 侧边信息：影响因素标签、预测准确率

#### 2.2.3 智能订货建议 (Orders)
- 门店/品类切换标签
- 订货建议数据表格（分页）
- 短保商品特殊高亮标记
- 汇总统计卡片

#### 2.2.4 损耗分析 (WasteAnalysis)
- 损耗概览指标卡片
- 高损耗商品排行榜
- 品类损耗率对比图
- 损耗趋势图
- 优化建议列表

#### 2.2.5 周报分析 (WeeklyReport)
- 本周数据总览
- 预测准确率对比
- 销量预测 vs 实际销量
- 模型迭代记录
- 改进建议

---

## 3. 后端架构

### 3.1 目录结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI入口
│   ├── api/                 # API路由层
│   │   ├── __init__.py
│   │   ├── stores.py
│   │   ├── products.py
│   │   ├── forecast.py
│   │   ├── orders.py
│   │   ├── waste.py
│   │   └── dashboard.py
│   ├── services/            # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── data_service.py
│   │   ├── order_recommendation.py
│   │   └── waste_analysis.py
│   ├── ml/                  # 机器学习层
│   │   ├── __init__.py
│   │   └── forecast_model.py
│   └── models/              # 数据模型
│       ├── __init__.py
│       └── schemas.py
├── data/                    # 数据目录
│   ├── historical_sales_data.csv
│   ├── feature_engineered_data.csv
│   ├── store_info.csv
│   ├── sku_info.csv
│   └── models/              # 训练好的模型
├── data_generator.py        # 数据生成器
├── feature_engineering.py   # 特征工程
└── requirements.txt
```

### 3.2 API接口设计

#### 3.2.1 门店接口
- `GET /api/stores` - 获取所有门店
- `GET /api/stores/{store_id}` - 获取门店详情

#### 3.2.2 商品接口
- `GET /api/products` - 获取商品列表
- `GET /api/products/{sku}` - 获取商品详情

#### 3.2.3 预测接口
- `GET /api/forecast/{store_id}/{sku}` - 获取单个SKU预测
- `POST /api/forecast/batch` - 批量预测

#### 3.2.4 订货接口
- `GET /api/orders/{store_id}` - 获取门店订货建议
- `GET /api/orders/category/{category}` - 按品类获取订货建议

#### 3.2.5 损耗接口
- `GET /api/waste/{store_id}` - 获取门店损耗分析
- `GET /api/waste/high-risk` - 获取高损耗商品列表

#### 3.2.6 仪表盘接口
- `GET /api/dashboard/summary` - 总览数据
- `GET /api/dashboard/weekly-report` - 周报数据

---

## 4. 设计规范

### 4.1 色彩系统
```css
--color-primary: #1e3a5f;       /* 深蓝主色 */
--color-primary-light: #2d5a87; /* 浅蓝 */
--color-accent: #10b981;        /* 清新绿 - 智能/新鲜 */
--color-accent-light: #34d399;
--color-warning: #f97316;       /* 警示橙 - 损耗预警 */
--color-warning-light: #fb923c;
--color-danger: #ef4444;        /* 危险红 */
--color-bg: #f8fafc;            /* 背景色 */
--color-bg-card: #ffffff;       /* 卡片背景 */
--color-text-primary: #1e293b;  /* 主文字 */
--color-text-secondary: #64748b;/* 次文字 */
--color-border: #e2e8f0;        /* 边框色 */
```

### 4.2 排版系统
- 主标题：24px / 600
- 副标题：18px / 600
- 正文：14px / 400
- 辅助文字：12px / 400
- 数据数字：等宽数字字体

### 4.3 间距系统
- 4px / 8px / 12px / 16px / 24px / 32px / 48px

### 4.4 圆角系统
- 小圆角：4px
- 中圆角：8px
- 大圆角：16px

### 4.5 阴影系统
- 卡片阴影：0 1px 3px rgba(0,0,0,0.1)
- 悬浮阴影：0 4px 12px rgba(0,0,0,0.15)

---

## 5. 数据模型

### 5.1 门店模型
- store_id: 门店ID
- name: 门店名称
- address: 地址
- area: 面积
- manager: 店长

### 5.2 商品模型
- sku: SKU编号
- name: 商品名称
- category: 品类
- shelf_life: 保质期（天）
- unit: 单位
- price: 单价

### 5.3 预测结果模型
- date: 日期
- forecast: 预测销量
- lower_bound: 预测下限
- upper_bound: 预测上限
- factors: 影响因素

### 5.4 订货建议模型
- sku: SKU编号
- name: 商品名称
- category: 品类
- current_stock: 当前库存
- in_transit: 在途库存
- forecast_7d: 7天预测销量
- suggested_order: 建议订货量
- safety_factor: 安全系数
- turnover_days: 周转天数
- is_short_life: 是否短保

---

## 6. 部署方案

### 6.1 开发环境
- 前端：Vite开发服务器 (端口 5173)
- 后端：Uvicorn开发服务器 (端口 8001)
- 前后端通过代理解决跨域

### 6.2 生产环境
- 前端：构建为静态文件，Nginx托管
- 后端：Gunicorn + Uvicorn部署
- Nginx反向代理
