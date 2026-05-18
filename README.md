# Interpret-Assistant

英语口译小组作业

## 项目结构（纯前端）

```
shadowing-web/
├── src/
│   ├── audio/            # 音频处理模块
│   ├── speech/           # 语音识别模块
│   ├── scoring/          # 评分算法模块
│   ├── ui/               # UI组件模块
│   ├── storage/          # 本地存储模块
│   ├── types/            # 类型定义
│   └── index.html        # 主页面
├── css/                  # 样式文件
├── js/                   # JavaScript文件
└── assets/               # 音频等资源
```

## 核心接口定义（纯浏览器API）

### 1. 音频处理模块（Web Audio API）

```typescript
// audio/AudioManager.ts
export class AudioManager {
  private audioContext: AudioContext;
  private mediaRecorder: MediaRecorder | null = null;

  // 播放控制
  playAudio(url: string): Promise<void>;
  pauseAudio(): void;
  stopAudio(): void;
  getCurrentTime(): number;
  getDuration(): number;

  // 录音控制（使用MediaRecorder API）
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  isRecording(): boolean;

  // 音频可视化
  getAnalyserNode(): AnalyserNode;
  getWaveformData(): number[];
}
```

### 2. 语音识别模块（Web Speech API）

```typescript
// speech/SpeechRecognizer.ts
export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;

  constructor(language: string = 'en-US');

  // 实时识别
  startRecognition(): void;
  stopRecognition(): void;

  // 识别回调
  onResult(callback: (transcript: string, confidence: number) => void): void;
  onError(callback: (error: string) => void): void;

  // 批量识别（从Blob）
  recognizeFromBlob(blob: Blob): Promise<{transcript: string, confidence: number}>;
}
```

### 3. 评分算法模块（JavaScript实现）

```typescript
// scoring/PronunciationScorer.ts
export class PronunciationScorer {
  // 文本相似度计算
  calculateTextSimilarity(original: string, user: string): number;

  // 语音特征分析
  analyzeAudioFeatures(blob: Blob): Promise<{
    duration: number;
    volume: number;
    pace: number; // 语速
  }>;

  // 综合评分
  scorePronunciation(
    originalTranscript: string,
    userTranscript: string,
    userAudioBlob: Blob
  ): Promise<{
    overall: number;
    textScore: number;
    audioScore: number;
    feedback: string[];
  }>;
}
```

### 4. UI组件模块（原生JavaScript）

```javascript
// ui/AudioPlayer.js
export class AudioPlayer {
  constructor(container: HTMLElement, audioUrl: string);

  // 播放控制
  play(): void;
  pause(): void;
  stop(): void;

  // 进度控制
  seekTo(time: number): void;
  getCurrentTime(): number;

  // 事件监听
  onTimeUpdate(callback: (time: number) => void): void;
  onEnded(callback: () => void): void;
}
```

```javascript
// ui/RecordingButton.js
export class RecordingButton {
  constructor(container: HTMLElement);

  // 录音控制
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;

  // 状态管理
  isRecording(): boolean;
  getRecordingTime(): number;

  // 事件监听
  onRecordingStart(callback: () => void): void;
  onRecordingStop(callback: (audioBlob: Blob) => void): void;
}
```

```javascript
// ui/TranscriptDisplay.js
export class TranscriptDisplay {
  constructor(container: HTMLElement, transcript: string);

  // 文本显示
  setTranscript(text: string): void;

  // 高亮同步
  highlightWord(wordIndex: number): void;
  highlightSentence(sentenceIndex: number): void;

  // 滚动控制
  scrollToCurrent(): void;
}
```

### 5. 本地存储模块（localStorage + IndexedDB）

```javascript
// storage/LocalStorage.js
export class LocalStorage {
  // 用户设置
  saveUserSettings(settings: UserSettings): void;
  getUserSettings(): UserSettings;

  // 学习记录
  savePracticeRecord(record: PracticeRecord): void;
  getPracticeRecords(): PracticeRecord[];

  // 音频缓存
  cacheAudioFile(id: string, blob: Blob): Promise<void>;
  getCachedAudioFile(id: string): Promise<Blob | null>;
}
```

```javascript
// storage/IndexedDBStorage.js
export class IndexedDBStorage {
  // 用于存储较大的音频文件
  saveAudioBlob(id: string, blob: Blob): Promise<void>;
  getAudioBlob(id: string): Promise<Blob | null>;
  deleteAudioBlob(id: string): Promise<void>;
}
```

### 6. 主应用集成（原生JavaScript）

```javascript
// index.html + main.js
class ShadowingApp {
  constructor() {
    this.audioManager = new AudioManager();
    this.speechRecognizer = new SpeechRecognizer();
    this.scorer = new PronunciationScorer();
    this.storage = new LocalStorage();
  }

  // 初始化应用
  async init(): Promise<void>;

  // 开始练习
  async startPractice(audioUrl: string, transcript: string): Promise<void>;

  // 结束练习并评分
  async endPractice(): Promise<void>;

  // 获取学习进度
  getProgress(): {
    totalSessions: number;
    averageScore: number;
    lastPractice: Date;
  };
}
```

## 5人小组任务分配（纯网页版）

### 成员1：音频与播放控制（Web Audio API）
**具体任务：**
- 实现 AudioManager 类
- 使用 AudioContext 播放音频
- 实现进度条和时间显示
- 音频缓冲和加载优化
- 音频可视化（波形图）

**技术重点：** Web Audio API、HTML5 Audio

### 成员2：语音识别与录音（Web Speech API + MediaRecorder）
**具体任务：**
- 实现 SpeechRecognizer 类
- 使用 MediaRecorder 录音
- 实现实时语音转文字
- 浏览器权限处理（麦克风）
- 录音数据处理

**技术重点：** Web Speech API、MediaRecorder API、getUserMedia

### 成员3：评分算法与分析
**具体任务：**
- 实现 PronunciationScorer 类
- 文本相似度算法（编辑距离）
- 语音特征分析（语速、音量）
- 综合评分算法
- 反馈生成逻辑

**技术重点：** JavaScript算法、文本处理、音频分析

### 成员4：UI界面与交互设计
**具体任务：**
- 实现 AudioPlayer、RecordingButton、TranscriptDisplay 组件
- 响应式布局（PC、平板、手机）
- 界面样式设计
- 交互流程和用户体验
- 视觉反馈设计

**技术重点：** HTML/CSS、响应式设计、UI/UX

### 成员5：数据存储与集成
**具体任务：**
- 实现 LocalStorage 和 IndexedDBStorage
- 学习进度记录
- 用户设置保存
- 音频文件缓存
- 主应用集成 ShadowingApp

**技术重点：** localStorage、IndexedDB、应用集成

## 整合方案

### 1. 接口先行开发
**步骤：**
1. 成员4先定义所有接口（1天）
2. 每个成员基于接口实现自己的模块（3天）
3. 成员5进行集成测试（1天）
4. 全员联调优化（1天）

### 2. 统一技术栈

```html
<!-- index.html 结构 -->
<!DOCTYPE html>
<html>
<head>
    <title>英语影子跟读</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <!-- 音频播放器 -->
        <!-- 录音按钮 -->
        <!-- 文本显示区 -->
        <!-- 评分结果 -->
    </div>
    <script src="js/main.js"></script>
</body>
</html>
```

### 3. 代码风格统一

```javascript
// 所有模块使用相同代码风格：
class ModuleName {
    constructor(options = {}) {
        // 初始化
    }

    // 公共方法
    公共方法名() {
        // 实现
    }

    // 私有方法
    _privateMethod() {
        // 实现
    }
}
```

### 4. 浏览器兼容性

```javascript
// 兼容性检查
const isWebSpeechSupported = 'SpeechRecognition' in window;
const isMediaRecorderSupported = 'MediaRecorder' in window;

if (!isWebSpeechSupported) {
    alert('您的浏览器不支持语音识别功能');
}
```

### 5. 测试策略

```javascript
// 每个模块的测试
describe('AudioManager', () => {
    test('should play audio', async () => {
        // 测试播放功能
    });

    test('should record audio', async () => {
        // 测试录音功能
    });
});
```

## 技术栈选择

**必需技术：**
- HTML5：结构
- CSS3：样式（Flexbox/Grid布局）
- JavaScript (ES6+)：逻辑
- TypeScript：类型安全（可选）

**浏览器API：**
- Web Audio API：音频播放和处理
- MediaRecorder API：录音
- Web Speech API：语音识别
- localStorage：简单存储
- IndexedDB：大量数据存储

**可选框架：**
- 轻量级：原生JavaScript
- 中等复杂度：Vue.js（简单易学）
- 复杂应用：React（生态丰富）

这种设计确保：
- 纯网页：无需安装，浏览器即可运行
- 跨平台：支持所有现代浏览器
- 易于开发：每个模块独立，接口清晰
- 易于整合：基于接口，集成简单

## 纯网页应用方案总结

### 核心特点
- 纯前端：无需后端服务器，浏览器直接运行
- 浏览器API：使用Web Audio API、MediaRecorder API、Web Speech API
- 无需安装：打开HTML文件即可使用
- 跨平台：支持所有现代浏览器

### 5人任务分配

| 成员 | 模块 | 具体实现 | 技术栈 |
|------|------|----------|--------|
| 成员1 | 音频播放 | AudioManager类，播放控制，进度条 | Web Audio API |
| 成员2 | 语音识别 | SpeechRecognizer类，录音功能 | Web Speech API + MediaRecorder |
| 成员3 | 评分算法 | PronunciationScorer类，发音评分 | JavaScript算法 |
| 成员4 | UI界面 | AudioPlayer、RecordingButton组件 | HTML/CSS/JS |
| 成员5 | 数据存储 | LocalStorage、主应用集成 | localStorage + IndexedDB |

### 开发流程
1. 第1天：定义接口（成员4）
2. 第2-4天：并行开发（全员）
3. 第5天：集成测试（成员5主导）
4. 第6-7天：联调优化（全员）

### 最终输出
一个index.html文件，包含：
- 音频播放器（带进度条）
- 录音按钮（带录音时长显示）
- 文本同步显示（当前句子高亮）
- 评分结果展示（分数和反馈）
- 学习进度记录（本地保存）