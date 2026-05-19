# 📘 Interpret-Assistant 项目交接文档Day1

## 负责人：成员4（UI/UX & 接口定义，Day1:搭骨架，接口定义）

***

## 项目结构：

```
Interpret-Assiatant/
├── src/
│   ├── audio/            # 👉 成员1 (音频)
│   │   └── AudioManager.js
│   ├── speech/           # 👉 成员2 (识别)
│   │   └── SpeechRecognizer.js
│   ├── scoring/          # 👉 成员3 (算法)
│   │   └── PronunciationScorer.js
│   ├── ui/               # 👉 成员4 (UI)
│   │   ├── AudioPlayer.js
│   │   ├── RecordingButton.js
│   │   └── TranscriptDisplay.js
│   ├── storage/          # 👉 成员5 (存储)
│   │   ├── LocalStorage.js
│   │   └── IndexedDBStorage.js
│   ├── types/            # 👉 成员4 (Day 1：全局接口与类型定义)
│   │   └── interfaces.js # (或 .d.ts，用于规范全组开发)
│   └── index.html        # 👉 成员4/成员5 (基础结构成员4写，成员5负责最终集成引入)
├── css/                  # 👉 成员4 (UI)
│   └── style.css
├── js/                   # 👉 成员5 (主控逻辑)
│   └── main.js           # (包含 ShadowingApp 类)
└── assets/               # 共享资源
    └── audio/
```

***

## ✅ 我已完成的工作（Day 1）

本阶段的核心目标是：**定义全局接口规范 + 搭建UI模块骨架 + 提供基础页面结构**，确保其他成员可以并行开发。

***

### 1️⃣ 全局接口与数据结构定义（已完成）

📁 文件位置：`src/types/interfaces.js`

我已通过 **JSDoc** 形式定义了全局数据结构，作为全组开发“契约”。所有成员必须严格遵守这些数据格式。

#### ✅ 已定义结构：

- `PracticeRecord`（成员5使用：学习记录存储）
- `UserSettings`（成员5使用：用户配置）
- `ScoreResult`（成员3使用：评分返回结果）

#### ⚠️ 约定说明

##### 1. 评分结果格式（必须遵守）

```js
{
  overall: number,      // 0-100
  textScore: number,
  audioScore: number,
  feedback: string[]
}
```

##### 2. 全局数据规范

- ⏱ 时间类型：统一使用 `Date` 对象
- 🎧 音频数据：统一使用 `Blob`

***

##### 3. 模块接口补充约定（强制）

```js
/**
 * 【AudioManager】
 * - getCurrentTime(): number（单位：秒）
 * - getDuration(): number（单位：秒）
 * - stopRecording(): Promise<Blob>
 *
 * 【SpeechRecognizer】
 * - onResult(callback)
 *   callback参数必须为：
 *   (transcript: string, confidence: number)
 *
 * - recognizeFromBlob(blob)
 *   返回：
 *   Promise<{ transcript: string, confidence: number }>
 *
 * 【通用约定】
 * - 所有时间单位统一为“秒”
 * - 所有音频数据统一为 Blob
 */
```

***

### 2️⃣ UI组件模块骨架（已完成）

📁 目录：`src/ui/`

我已经完成了 **3个核心UI组件类的骨架定义 + 基础事件机制**，并暴露接口供主应用调用。

***

#### 🎧 AudioPlayer.js（音频播放器UI）

✔ 已完成：

- 类结构定义
- 基础 render 方法（占位UI）
- 播放控制接口（play / pause / stop / seekTo）
- 事件注册接口（onTimeUpdate / onEnded）

📌 当前状态：

- ❗ 仅UI占位，未实现真实DOM控制（Day2完成）

📌 给成员1（音频模块）的对接方式：

- 你负责真实播放逻辑（AudioManager）
- UI组件只负责“展示状态”
- 主控（成员5）会连接你和我

***

#### 🎙 RecordingButton.js（录音按钮）

✔ 已完成：

- 按钮UI渲染
- 点击切换录音状态
- 内部UI状态管理
- 回调机制：
  - `onRecordingStart`
  - `onRecordingStop`

📌 当前状态：

- UI逻辑完整 ✅
- ❗ 未接入真实录音（成员2负责）

📌 给成员2的说明：

- 你只需要在 main.js 里监听：
  ```js
  recordingButton.onRecordingStart(() => {...})
  recordingButton.onRecordingStop(() => {...})
  ```

***

#### 📄 TranscriptDisplay.js（文本展示）

✔ 已完成：

- 文本设置接口 `setTranscript`
- 基础渲染逻辑

📌 预留功能（Day2实现）：

- 单词高亮 `highlightWord`
- 句子高亮 `highlightSentence`
- 自动滚动 `scrollToCurrent`

📌 给成员3/5说明：

- 文本内容由你们传入
- 高亮控制由主控调用我提供的方法

***

### 3️⃣ 页面结构（已完成）

📁 文件：`src/index.html`

我已提供完整页面骨架，并划分清晰的挂载点：

#### 🧩 DOM结构说明：

| 区域    | ID                      | 用途                |
| ----- | ----------------------- | ----------------- |
| 文本显示区 | `#transcript-container` | TranscriptDisplay |
| 录音按钮  | `#recording-control`    | RecordingButton   |
| 播放器   | `#audio-player-control` | AudioPlayer       |
| 评分结果  | `#score-result-panel`   | 成员3输出             |
| 状态栏   | `#status-bar`           | 可扩展               |

📌 所有组件均通过 JS 挂载（不要直接写死HTML）

***

## 🔌 模块对接说明（重点）

### 👉 成员1（AudioManager）

你提供：

```js
playAudio(url)
pauseAudio()
getCurrentTime()
```

主应用会：

- 调你接口
- 同步更新我的 AudioPlayer UI

***

### ）

### 👉 成员2（SpeechRecognizer + 录音

你提供：

```js
startRecording()
stopRecording() -> Blob
```

对接方式：

- RecordingButton 触发
- main.js 调用你逻辑

***

### 👉 成员3（评分算法）

你提供：

```js
scorePronunciation(...) => ScoreResult
```

⚠️ 必须符合接口定义！

***

### 👉 成员5（主控集成）

你是核心连接人：

你需要：

1. 创建所有模块实例
2. 绑定 UI 和逻辑：
   ```js
   recordingButton.onRecordingStart(() => audioManager.startRecording())
   ```
3. 控制数据流：
   ```
   用户操作 → UI → main.js → 逻辑模块 → UI更新
   ```

***

## 🚧 当前未完成部分（Day2任务）→ ✅ 已完成

### UI增强

- ✅ 播放器真实UI（进度条、时间显示）
- ✅ 录音动画（麦克风脉冲）
- ✅ 文本逐词高亮

### 交互优化

- ✅ 自动滚动
- ✅ 响应式布局（移动端适配）

***

## ✅ Day2 完成记录

### 1️⃣ AudioPlayer.js（播放器UI）

📁 文件位置：`src/ui/AudioPlayer.js`

**已完成：**

- 真实DOM渲染：播放/暂停按钮 + 进度条(range) + 时间显示(00:00 / 00:00)
- 按钮交互：点击切换播放/暂停，停止按钮重置进度
- 进度条拖拽：拖动slider触发seekTo，同步跳转
- 内建轮询：每200ms触发 onTimeUpdate 回调，主应用可借此读取真实进度
- `syncProgress(currentTime, duration)`：供主应用将 AudioManager 的真实进度同步到UI
- `onPlay` / `onPause` / `onSeek` / `onTimeUpdate` / `onEnded` 回调：主应用通过回调感知用户操作

**对接方式不变：**

- 主应用通过 `audioPlayer.onPlay(() => audioManager.playAudio(url))` 等监听用户操作
- 主应用调用 `audioPlayer.syncProgress(cur, dur)` 更新UI显示

***

### 2️⃣ RecordingButton.js（录音按钮）

📁 文件位置：`src/ui/RecordingButton.js`

**已完成：**

- SVG麦克风图标内嵌（`record-icon`），录音时图标变白
- 脉冲动画：录音中红色波纹扩散 `pulse-ring` 动画（CSS `@keyframes`）
- 录音时长计数器：按钮旁实时显示 `MM:SS`，200ms刷新
- `reset()`：录音完成后主应用调用，重置UI到初始状态

**对接方式不变：**

- `onRecordingStart` / `onRecordingStop` 回调机制保持不变
- 成员2在 main.js 中监听按钮事件调用自己的录音逻辑

***

### 3️⃣ TranscriptDisplay.js（文本展示）

📁 文件位置：`src/ui/TranscriptDisplay.js`

**已完成：**

- `_parseText()`：自动按句末标点(.!?)拆分为句子，每个单词包裹 `<span class="word" data-word-index="N">`
- 句子索引与单词全局索引的映射关系（`_sentences[i].startWord / endWord`）
- `highlightWord(wordIndex)`：精准高亮单个词（`.highlight-active`，黄色背景+蓝色outline），自动滚动到视口中央
- `highlightSentence(sentenceIndex)`：高亮整句（`.highlight`），自动清除旧高亮
- `scrollToCurrent()`：自动滚动到当前高亮的词或句子
- XSS 防护：`_escapeHtml()` 对所有文本做转义处理
- `setTranscript()` 重新设置文本时自动重建索引

**对接方式不变：**

- 成员3/5传入文本内容
- 主控调用高亮方法实现播放同步

***

### 4️⃣ style.css（响应式样式）

📁 文件位置：`css/style.css`

**已完成：**

- CSS 变量体系：主题色、背景、圆角、阴影、过渡时间
- 组件样式全覆盖：`.audio-player-ui` / `.record-btn` / `.transcript-box` / `.score-row` 等
- 录音脉冲动画：`@keyframes pulse-ring` 红色波纹扩散
- 高亮样式：`.word.highlight`（句子级淡黄）、`.word.highlight-active`（词级金色+蓝色outline）
- 三档响应式断点：
  - **PC**（>768px）：横向控件排列，max-width 800px居中
  - **平板**（≤768px）：控件纵向堆叠，减小间距
  - **手机**（≤480px）：进一步缩小按钮、字体、面板padding

***

### 对外接口兼容性

所有对外暴露的方法签名与 Day 1 定义完全一致，其他成员无需任何调整：

```
AudioPlayer:       play() / pause() / stop() / seekTo(time) / getCurrentTime()
                   onTimeUpdate(cb) / onEnded(cb) / syncProgress(cur, dur)

RecordingButton:   onRecordingStart(cb) / onRecordingStop(cb)
                   isRecording() / getRecordingTime() / reset()

TranscriptDisplay: setTranscript(text) / highlightWord(idx) / highlightSentence(idx) / scrollToCurrent()
```

***

## ⚠️ 开发规范（必须遵守）

### 1. 不允许：

- ❌ 修改接口定义
- ❌ 直接操作别人模块内部数据

### 2. 必须：

- ✅ 通过接口调用
- ✅ 返回统一数据结构
- ✅ 使用 ES6 class

***

## 🧪 测试建议

- 音频是否可播放
- 录音是否能返回 Blob
- 评分是否返回完整对象
- UI是否响应操作

***

## 📌 最终目标（Reminder）

最终页面必须包含：

- 🎧 音频播放器（可控制）
- 🎙 录音按钮（带状态）
- 📄 文本同步高亮
- 📊 评分结果展示
- 💾 本地学习记录

***

## 💬 最后说明

目前项目已经完成：

✅ 接口统一\
✅ UI骨架搭建\
✅ 页面结构定义

🚀 现在可以正式进入 **Day2并行开发阶段**

***

## ✅ 成员5 — Days 2\~4 并行开发完成

### 📋 完成内容

| 文件                                | 功能                                | 状态     |
| --------------------------------- | --------------------------------- | ------ |
| `src/storage/LocalStorage.js`     | 用户设置、练习记录读写、音频元数据缓存（localStorage） | ✅ 完整实现 |
| `src/storage/IndexedDBStorage.js` | 音频 Blob 持久化存储（IndexedDB）          | ✅ 完整实现 |
| `js/main.js`                      | ShadowingApp 主控集成类                | ✅ 完整实现 |
| `start.bat`                       | 本地开发服务器快捷启动（可选）                   | ✅ 辅助脚本 |

***

### 1️⃣ 存储模块 — LocalStorage

📁 `src/storage/LocalStorage.js`

#### 方法说明

| 方法                      | 参数                       | 返回值                     | 说明                                               |
| ----------------------- | ------------------------ | ----------------------- | ------------------------------------------------ |
| `saveUserSettings`      | `settings: UserSettings` | `void`                  | 保存用户配置（language, autoPlay）                       |
| `getUserSettings`       | —                        | `UserSettings`          | 读取配置，不存在返回默认 `{language:'en-US', autoPlay:true}` |
| `savePracticeRecord`    | `record: PracticeRecord` | `void`                  | 追加练习记录到数组                                        |
| `getPracticeRecords`    | —                        | `PracticeRecord[]`      | 返回全部记录，无数据时返回 `[]`                               |
| `cacheAudioFile`        | `id, blob`               | `Promise<void>`         | 提取时长 → 存元数据索引（**不存 Blob 本身**）                    |
| `getCachedAudioFile`    | `id`                     | `Promise<object\|null>` | 按 id 查询音频元数据                                     |
| `deleteCachedAudioFile` | `id`                     | `void`                  | 从索引中移除                                           |
| `clearAll`              | —                        | `void`                  | 清除所有 `ia_*` 存储（测试用）                              |

#### ⚠️ 音频缓存策略（重要）

**方案B（已采用）：**

- **localStorage**：仅存音频元数据索引 `{ id, name, duration, indexedDBKey, cachedAt }`
- **IndexedDB**：由 `IndexedDBStorage` 管理实际的 Blob 持久化
- 原因：localStorage 有 5MB 上限且只能存字符串，Blob 转为 base64 后体积膨胀严重

***

### 2️⃣ 存储模块 — IndexedDBStorage

📁 `src/storage/IndexedDBStorage.js`

#### 方法说明

| 方法                | 参数         | 返回值                   | 说明                    |
| ----------------- | ---------- | --------------------- | --------------------- |
| `saveAudioBlob`   | `id, blob` | `Promise<void>`       | 存入 `audio_blobs` 对象存储 |
| `getAudioBlob`    | `id`       | `Promise<Blob\|null>` | 读取 Blob，不存在返回 null    |
| `deleteAudioBlob` | `id`       | `Promise<void>`       | 删除指定记录                |
| `getAllAudioKeys` | —          | `Promise<string[]>`   | 获取所有已存 ID 列表          |

#### 数据库结构

```
数据库名: InterpretAssistantDB (v1)
对象存储: audio_blobs (keyPath: 'id')
记录格式: { id: string, blob: Blob, createdAt: number }
```

#### 错误处理

- ✅ `window.indexedDB` 可用性检测（不支持的浏览器给出提示）
- ✅ 所有操作 try-catch 包裹（操作失败不抛未捕获异常）
- ✅ 每次操作独立开闭连接（不持有长连接）

***

### 3️⃣ 主控集成 — ShadowingApp（核心）

📁 `js/main.js`

这是成员5最关键的输出，负责**编排所有模块**。类结构如下：

```js
export class ShadowingApp {
    constructor() // 初始化所有模块引用 + 状态
    async init()  // 挂载UI → 动态加载模块 → 绑定事件
    async startPractice(audioUrl, transcript)  // 开始练习
    async endPractice()  // 结束练习 → 评分 → 保存记录
    getProgress()  // 返回学习进度统计
}
```

#### 数据流设计

```
用户操作 → UI事件 → ShadowingApp 处理 → 逻辑模块 → 存储/UI更新

例：点击录音按钮 →
  RecordingButton 触发 onRecordingStart →
  ShadowingApp._handleRecordingStart() →
  speechRecognizer?.startRecognition() (成员2)
```

#### 事件绑定映射

| UI 组件           | 事件                 | main.js 处理函数            | 下游调用                                                    |
| --------------- | ------------------ | ----------------------- | ------------------------------------------------------- |
| RecordingButton | `onRecordingStart` | `_handleRecordingStart` | `speechRecognizer?.startRecognition()`                  |
| RecordingButton | `onRecordingStop`  | `_handleRecordingStop`  | `speechRecognizer?.stopRecognition()` → `endPractice()` |
| AudioPlayer     | `onTimeUpdate`     | `_handleTimeUpdate`     | `transcriptDisplay?.highlightWord()`                    |
| AudioPlayer     | `onEnded`          | `_handleAudioEnded`     | `endPractice()` (仅活跃练习时)                                |
| AudioPlayer     | `onPlay`           | *(待成员5对接)*             | `audioManager?.playAudio(url)`                          |
| AudioPlayer     | `onPause`          | *(待成员5对接)*             | `audioManager?.pauseAudio()`                            |
| AudioPlayer     | `onSeek`           | *(待成员5对接)*             | `audioManager?.seekTo(time)`                            |

> 注：`onPlay`/`onPause`/`onSeek` 为成员4 Day2 补充的回调，成员5需在 main.js 中补上对应的 `audioManager` 调用以完成完整的播放控制链路。同时需注册 `audioManager.onTimeUpdate` → `audioPlayer.syncProgress()` 以同步真实播放进度到 UI。

#### 动态加载（容错设计）

其他成员模块通过 **动态** **`import()`** 加载，而非静态 `import`：

```js
// 静态 import（仅限有有效导出的模块）
import { AudioPlayer } from '../src/ui/AudioPlayer.js';
import { LocalStorage } from '../src/storage/LocalStorage.js';

// 动态 import（模块未实现时不阻塞）
try {
    const mod = await import('../src/audio/AudioManager.js');
    this.audioManager = new mod.AudioManager();
} catch (e) {
    console.warn('AudioManager 未就绪 — 功能暂不可用');
}
```

**好处**：其他成员文件为空时，main.js 正常运行，仅对应功能降级。等他们实现后**无需修改 main.js** 即可自动生效。

#### 自动初始化

```js
// index.html 加载后自动执行（无需手动调用）
window.addEventListener('DOMContentLoaded', () => {
    window.app = new ShadowingApp();
    window.app.init();
});
```

***

### 🔗 对其他成员的对接说明

#### 👉 给成员1（AudioManager）

ShadowingApp 已通过动态 import 加载你的模块。你只需：

1. 在 `src/audio/AudioManager.js` 中实现并导出 `AudioManager` 类
2. 实现 `playAudio(url)`、`pauseAudio()`、`stopAudio()` 等方法
3. **main.js 不需改任何代码**，你的模块会被自动发现和使用

```js
// 你只要这样导出，main.js 自动生效
export class AudioManager {
    playAudio(url) { /* 你的实现 */ }
    pauseAudio() { /* 你的实现 */ }
    // ...
}
```

#### 👉 给成员2（SpeechRecognizer）

同理，实现并导出 `SpeechRecognizer` 类即可：

```js
export class SpeechRecognizer {
    startRecognition() { /* ... */ }
    stopRecognition() { /* ... */ }
    // ...
}
```

额外说明：当前 `_handleRecordingStop` 无法获取录音 Blob（RecordingButton 未暴露 getBlob），需要你补齐主控中的录音数据链路。

#### 👉 给成员3（PronunciationScorer）

```js
export class PronunciationScorer {
    scorePronunciation(originalTranscript, userTranscript, userAudioBlob) {
        // 返回 ScoreResult 格式
    }
}
```

⚠️ 必须遵守 `src/types/interfaces.js` 中 `ScoreResult` 的结构！

***

### 🧪 自检方法

在浏览器控制台可执行以下测试：

```js
// 完整自检（所有模块状态诊断）
window.app._runSelfTest();

// 单独测试存储
const ls = new LocalStorage();
ls.saveUserSettings({ language: 'zh-CN', autoPlay: false });
console.log(ls.getUserSettings());

await new IndexedDBStorage()._runSelfTest();
```

***

### 🚧 当前状态总结 → ✅ 全员完成

```
✅ 成员1（已完成）:
   └── src/audio/AudioManager.js              — 播放控制 / 录音 / 音频可视化

✅ 成员2（已完成）:
   └── src/speech/SpeechRecognizer.js         — 实时识别 / 批量识别 / 自动重启

✅ 成员3（已完成）:
   └── src/scoring/PronunciationScorer.js     — 文本相似度 / 音频特征 / 综合评分

✅ 成员4（已完成 Day1 + Day2）:
   ├── src/types/interfaces.js                — 全局接口约定（含各模块完整 API）
   ├── src/ui/AudioPlayer.js                  — 播放器 UI（按钮/进度条/时间/回调）
   ├── src/ui/RecordingButton.js              — 录音按钮（SVG图标/脉冲动画/时长）
   ├── src/ui/TranscriptDisplay.js            — 文本展示（分词/分句/高亮/滚动）
   ├── src/index.html                         — 页面结构（含波形可视化区域）
   └── css/style.css                          — 响应式样式（PC/平板/手机）

✅ 成员5（已完成）:
   ├── src/storage/LocalStorage.js            — 设置/记录/元数据缓存
   ├── src/storage/IndexedDBStorage.js        — 音频 Blob 持久化
   └── js/main.js                             — ShadowingApp 主控集成
```

---

## ✅ 成员4 — Day2 最终补充（全部模块实现后）

其他成员模块全部实现后，成员4完成以下收尾工作：

| 变更 | 文件 | 说明 |
|------|------|------|
| 接口文档更新 | `src/types/interfaces.js` | 补全所有模块已实现方法的完整 API 文档 |
| 评分面板样式对齐 | `css/style.css` | 新增 `.score-overview` / `.score-main` / `.score-breakdown` / `.feedback-list` 等，与 main.js `_displayScore()` 实际 DOM 对齐 |
| 波形可视化区域 | `src/index.html` + `css/style.css` | 新增 `#waveform-container` + `#waveform-canvas`，供 main.js 使用 AudioManager.getWaveformData() 绘制波形 |
| 交接文档更新 | `UI_Integration_Guide.md` | 更新全员完成状态 |

