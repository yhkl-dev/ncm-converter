# NCM Converter 扩展

一个 Chrome 浏览器扩展，用于将NCM文件转换为标准音频格式（MP3、FLAC 等）。

## 功能特性

- 🎵 **支持多种格式转换** - 支持 MP3、FLAC、OGG、M4A、WAV 等音频格式
- 🔐 **安全的本地解密** - 所有解密操作都在本地进行，无需上传到服务器
- 🌐 **国际化支持** - 支持中文和英文界面
- 📊 **实时转换进度** - 显示转换进度百分比
- 💾 **自动下载** - 转换完成后自动下载文件
- 📝 **元数据提取** - 保留音乐的标题、艺术家、专辑等信息

## 技术栈

- **框架**: Plasmo (React + TypeScript)
- **密码学**: crypto-js（AES-128-ECB 和 RC4 解密）
- **UI 框架**: React 18 + Tailwind CSS
- **构建工具**: Plasmo CLI + Webpack

## 核心算法

NCM 文件格式解密包含以下步骤：

1. **文件头验证** - 检查 NCM 文件魔数 `CTENFDAM`
2. **密钥解密** - 使用 AES-128-ECB 和 CORE_KEY 解密主密钥
3. **元数据解密** - 使用 AES-128-ECB 和 META_KEY 解密音乐元数据
4. **音频解密** - 使用基于 RC4 KSA 生成的掩码解密音频数据

## 项目结构

```
src/
├── popup.tsx                 # 主弹窗组件
├── popup.css                # 样式文件
├── utils/
│   └── ncmConverter.ts      # NCM 解密核心逻辑
└── i18n/
    ├── messages.ts          # 多语言翻译文本
    └── context.tsx          # i18n React Context
```

## 开发指南

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 开发模式

```bash
pnpm dev
# 或
npm run dev
```

然后在 Chrome 中：
1. 打开 `chrome://extensions/`
2. 启用「开发者模式」
3. 点击「加载未打包的扩展程序」
4. 选择 `build/chrome-mv3-dev` 文件夹

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

构建输出将在 `build/chrome-mv3-prod` 文件夹中。

## 使用方法

1. 点击扩展图标打开转换窗口
2. 点击「选择文件」按钮选择一个 .ncm 文件
3. 点击「开始转换」按钮
4. 等待转换完成，文件将自动下载

## 国际化

项目支持多语言，默认为中文。要添加新的语言：

1. 编辑 `src/i18n/messages.ts`
2. 在 `messages` 对象中添加新的语言字典
3. 更新 `Language` 类型以包含新的语言代码
