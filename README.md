# Three.js 学习项目 - 丰富场景

这是一个功能完整的 Three.js 学习项目，包含多种几何体、材质、纹理和动画效果，使用 pnpm 作为包管理工具。

## 启动项目

```bash
# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器
pnpm dev
```

启动后，在浏览器中打开显示的地址（通常是 http://localhost:5173）

## 交互控制

- **鼠标左键拖拽** - 旋转视角
- **鼠标滚轮** - 缩放场景
- **鼠标右键拖拽** - 平移视角

## 项目结构

```
threejs/
├── src/
│   └── main.js       # Three.js 主代码（丰富场景）
├── index.html        # HTML 入口文件
├── package.json      # 项目配置
└── README.md         # 项目说明
```

## 场景包含的元素

### 1. 多种几何体
- **立方体 (Cube)** - 带棋盘纹理，旋转动画
- **球体 (Sphere)** - 金属材质，带弹跳动画
- **圆锥体 (Cone)** - 发光材质，旋转动画
- **圆柱体 (Cylinder)** - 粗糙材质，三轴旋转
- **圆环 (Torus)** - 光滑材质，复杂旋转
- **八面体 (Octahedron)** - 半透明材质，浮动动画

### 2. 材质系统
- **标准材质 (MeshStandardMaterial)** - 支持金属度和粗糙度
- **纹理映射** - 程序生成的棋盘纹理
- **发光材质** - emissive 属性创建自发光效果
- **半透明材质** - transparent 和 opacity 实现透明度
- **金属/粗糙度** - metalness 和 roughness 参数调节

### 3. 光照系统
- **环境光 (AmbientLight)** - 提供基础照明
- **方向光 (DirectionalLight)** - 模拟太阳光，投射阴影
- **点光源 (PointLight)** - 两个彩色点光源，圆周运动

### 4. 动画效果
- **旋转动画** - 不同速度的多轴旋转
- **弹跳动画** - 使用 sin 函数实现上下弹跳
- **浮动动画** - 平滑的上下浮动效果
- **光源动画** - 点光源沿圆形路径移动

### 5. 特殊效果
- **粒子系统** - 500个粒子营造空间氛围
- **雾效 (Fog)** - 增加场景深度感
- **软阴影** - PCFSoftShadowMap 实现柔和阴影
- **网格辅助线** - 帮助理解3D空间

### 6. 鼠标控制
- **OrbitControls** - 专业的相机控制系统
- **阻尼效果** - 平滑的惯性运动
- **缩放限制** - 限制最小/最大观察距离

## Three.js 核心概念

### 三大核心组件
1. **场景 (Scene)** - 所有 3D 对象的容器
2. **相机 (Camera)** - 定义观察视角
3. **渲染器 (Renderer)** - 将场景渲染到页面上

### 几何体 (Geometry)
定义物体的形状（顶点、面等）

### 材质 (Material)
定义物体的外观（颜色、纹理、光照反应等）

### 网格 (Mesh)
几何体 + 材质 = 可渲染的3D对象

## 学习建议

### 初级
1. 修改 `src/main.js:82-168` 中各个几何体的颜色
2. 调整 `src/main.js:93` 中的旋转速度参数
3. 改变 `src/main.js:16` 相机的初始位置
4. 尝试修改材质的 `metalness` 和 `roughness` 值

### 中级
1. 添加新的几何体（试试 DodecahedronGeometry）
2. 创建自己的程序生成纹理
3. 添加更多点光源并设置不同颜色
4. 实现物体之间的碰撞检测

### 高级
1. 加载外部 3D 模型（使用 GLTFLoader）
2. 添加后期处理效果（Bloom、SSAO 等）
3. 实现物体拾取和点击交互
4. 优化性能（使用 InstancedMesh）

## 代码结构说明

代码按功能模块清晰分块：
- 第 5-7 行：场景设置
- 第 9-17 行：相机配置
- 第 19-25 行：渲染器设置
- 第 27-32 行：OrbitControls
- 第 34-58 行：光照系统
- 第 60-76 行：纹理创建
- 第 78-168 行：几何体创建
- 第 170-185 行：地面和辅助线
- 第 187-206 行：粒子系统
- 第 216-262 行：动画循环

## 其他命令

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 下一步学习资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [Three.js 示例库](https://threejs.org/examples/)
- [Three.js Journey](https://threejs-journey.com/) - 优秀的付费课程
- [Discover Three.js](https://discoverthreejs.com/) - 免费在线书籍

## 常见问题

**Q: 为什么我看不到阴影？**
A: 需要同时设置：1) renderer.shadowMap.enabled = true; 2) 光源的 castShadow = true; 3) 物体的 castShadow 或 receiveShadow = true

**Q: OrbitControls 不工作？**
A: 确保在动画循环中调用 controls.update()

**Q: 如何提高性能？**
A: 减少粒子数量、降低阴影贴图分辨率、减少几何体的分段数

## 技术栈

- Three.js 0.182.0 - 3D 图形库
- Vite 7.3.0 - 构建工具
- ES6+ - 现代 JavaScript

祝学习愉快！
