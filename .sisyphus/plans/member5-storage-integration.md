# 成员5：数据存储与主控集成（Days 2-4）

## TL;DR
> **Summary**: 实现成员5的三个核心模块——LocalStorage（localStorage封装）、IndexedDBStorage（IndexedDB封装）、ShadowingApp（main.js主控集成类），完成英语影子跟读应用的数据持久化和模块编排。
> **Deliverables**:
> - `src/storage/LocalStorage.js` — 用户设置、练习记录、音频元数据的 localStorage 存取
> - `src/storage/IndexedDBStorage.js` — 音频 Blob 的 IndexedDB 存取
> - `js/main.js` — ShadowingApp 主控类（完整结构，其他模块按接口规范占位）
> **Effort**: Short（3个文件，明确接口，无外部依赖）
> **Parallel**: YES — 2 waves（Wave 1: 两个storage模块并行；Wave 2: main.js）
> **Critical Path**: LocalStorage.js → main.js（main.js 使用了 LocalStorage + IndexedDBStorage 的接口）

## Context
### Original Request
> 成员5完成 Days 2-4 任务：实现 LocalStorage、IndexedDBStorage、ShadowingApp（main.js）。不要求集成测试（其他成员任务未完成）。

### Interview Summary
- **音频缓存策略（方案B）**：LocalStorage 存元数据（id、name、duration、indexedDBKey），实际音频 Blob 由 IndexedDBStorage 管理
- **主控集成策略**：main.js 写完整 ShadowingApp 类结构，import 所有模块。其他成员模块（AudioManager、SpeechRecognizer、PronunciationScorer）按接口规范写好调用占位，等他们实现后自然生效
- **不要求集成测试**，但每个模块提供内建验证方法

### Metis Review
（直接推进，未完成 Metis 咨询 — 任务已明确，无需额外澄清）

## Work Objectives
### Core Objective
实现成员5的3个模块，使应用具备本地数据持久化能力和完整的主控编排骨架。

### Deliverables
1. `src/storage/LocalStorage.js` — 完整的 localStorage 封装
2. `src/storage/IndexedDBStorage.js` — 完整的 IndexedDB 封装
3. `js/main.js` — 完整的 ShadowingApp 主控类

### Definition of Done（可验证条件）
- LocalStorage：调用所有方法后 localStorage 中有正确的键值对
- IndexedDBStorage：save/get/delete Blob 后 IndexedDB 数据一致
- main.js：页面加载后 ShadowingApp 初始化完成，无控制台错误，UI组件挂载到正确DOM节点

### Must Have
- ES6 class 语法，export default / export class
- 严格遵循 `src/types/interfaces.js` 中的数据结构（PracticeRecord、UserSettings、ScoreResult）
- 所有时间单位统一为「秒」
- 所有音频数据统一为 Blob
- 错误处理（localStorage 满、IndexedDB 不可用、模块缺失）

### Must NOT Have
- ❌ 不修改 `src/types/interfaces.js` 中的接口定义
- ❌ 不直接操作其他模块的内部数据
- ❌ 不引入外部 npm 包或框架依赖
- ❌ 不实现集成测试（其他成员模块未完成）

## Verification Strategy
> ZERO HUMAN INTERVENTION — 所有验证通过浏览器控制台执行。
- **Test decision**: 无正式测试框架（纯浏览器端），采用内建验证方法
- **QA policy**: 每个模块提供 `_runSelfTest()` 方法，在浏览器控制台可独立调用验证
- **Evidence**: 控制台日志 + localStorage/IndexedDB 浏览器开发者工具检查

## Execution Strategy
### Parallel Execution Waves

**Wave 1（独立并行）**：
1. `src/storage/LocalStorage.js` — 无外部依赖，仅使用浏览器 localStorage API
2. `src/storage/IndexedDBStorage.js` — 无外部依赖，仅使用浏览器 IndexedDB API

**Wave 2（依赖 Wave 1）**：
3. `js/main.js` — ShadowingApp 类，import 并使用 storage 模块 + 其他成员模块桩

### Dependency Matrix

| Task | Blocks | Blocked By |
|------|--------|------------|
| 1. LocalStorage.js | — | — |
| 2. IndexedDBStorage.js | — | — |
| 3. main.js (ShadowingApp) | — | 1, 2（使用了 storage 接口，但可先写调用占位） |

### Agent Dispatch Summary
| Wave | 任务数 | 类别 |
|------|--------|------|
| 1 | 2 | storage 模块（独立） |
| 2 | 1 | 主控集成（依赖 Wave 1） |

## TODOs

- [ ] 1. 实现 `src/storage/LocalStorage.js` — localStorage 封装

  **What to do**:
  1. 创建一个 `LocalStorage` 类，使用 `export class LocalStorage {}` 导出
  2. **构造函数**：定义存储键名常量 `KEYS = { SETTINGS: 'ia_settings', RECORDS: 'ia_records', AUDIO_INDEX: 'ia_audio_index' }`
  3. **`saveUserSettings(settings)`**：`localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings))`，严格遵循 UserSettings 结构（`{ language: string, autoPlay: boolean }`）
  4. **`getUserSettings()`**：读取并 JSON.parse，若不存在则返回默认值 `{ language: 'en-US', autoPlay: true }`
  5. **`savePracticeRecord(record)`**：读取已有记录数组（JSON.parse），push 新记录，写回 localStorage。Record 必须包含 `{ id, date, audioId, overallScore, details }`
  6. **`getPracticeRecords()`**：返回 PracticeRecord[]，若不存在返回 `[]`
  7. **`cacheAudioFile(id, blob)`（async）**：将 Blob 转为 base64（使用 `FileReader.readAsDataURL` 包装为 Promise），提取 duration 信息（通过 `Audio` 元素获取），将元数据 `{ id, name, duration, indexedDBKey: id, cachedAt: Date.now() }` 存入 `ia_audio_index` 数组。注意：此方法只是一个"记录元数据+缓存的入口"，实际 Blob 持久化由 IndexedDBStorage 负责
  8. **`getCachedAudioFile(id)`（async）**：从 `ia_audio_index` 中查找元数据，若找到返回 `{ metadata: {...}, blobStoreMethod: 'IndexedDBStorage.saveAudioBlob' }`，若未找到返回 null。（注：实际 Blob 读取委托给 IndexedDBStorage）
  9. **`deleteCachedAudioFile(id)`**：从索引数组中移除条目
  10. **`clearAll()`**：清空所有 `ia_*` 前缀的键（测试用）
  11. **`_runSelfTest()`**：在浏览器控制台可调用，自动执行 save → get → verify 流程

  **Must NOT do**:
  - ❌ 不直接存储 Blob 到 localStorage（超过 5MB 限制）
  - ❌ 不使用 sessionStorage

  **References**:
  - 数据结构: `src/types/interfaces.js:7-31` — PracticeRecord、UserSettings 定义
  - 接口规范: `README.md:160-186` — LocalStorage 和 IndexedDBStorage 接口方法签名
  - 存储键名约定: 使用 `ia_` 前缀（Interpret-Assistant 缩写）避免与其他应用冲突

  **Acceptance Criteria**:
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/LocalStorage.js','utf8'); console.log(code.includes('class LocalStorage'));"` — 类定义存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/LocalStorage.js','utf8'); console.log(code.includes('saveUserSettings')&&code.includes('getUserSettings')&&code.includes('savePracticeRecord')&&code.includes('getPracticeRecords'));"` — 四个核心方法都存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/LocalStorage.js','utf8'); console.log(code.includes('cacheAudioFile')&&code.includes('getCachedAudioFile'));"` — 音频缓存方法存在

  **QA Scenarios**:
  ```
  Scenario: 本地存储完整读写流程
    Tool: 浏览器控制台代码验证（通过 node 语法检查 + 浏览器手动测试）
    Steps:
      1. 在浏览器中打开 index.html
      2. 在控制台执行: `localStorage.clear()` 清空
      3. 执行: `const ls = new LocalStorage()`
      4. 执行: `ls.saveUserSettings({ language: 'en-US', autoPlay: false })`
      5. 执行: `ls.getUserSettings()` → 预期返回 `{ language: 'en-US', autoPlay: false }`
      6. 执行: `ls.savePracticeRecord({ id: 'test-1', date: new Date(), audioId: 'audio-1', overallScore: 85, details: {} })`
      7. 执行: `ls.getPracticeRecords()` → 预期返回数组，长度 ≥ 1，第一条 id 为 'test-1'
    Expected: 所有 get 操作返回与 save 一致的数据
    Evidence: .sisyphus/evidence/task-1-localstorage.txt

  Scenario: 存储空状态
    Tool: 浏览器控制台
    Steps:
      1. 清除所有 ia_* 键
      2. 调用 `ls.getUserSettings()` → 应返回默认值
      3. 调用 `ls.getPracticeRecords()` → 应返回 []
    Expected: 优雅处理空状态
    Evidence: .sisyphus/evidence/task-1-localstorage-empty.txt
  ```

  **Commit**: YES | Message: `feat(storage): implement LocalStorage class for settings and records` | Files: [`src/storage/LocalStorage.js`]

---

- [ ] 2. 实现 `src/storage/IndexedDBStorage.js` — IndexedDB 封装

  **What to do**:
  1. 创建一个 `IndexedDBStorage` 类，`export class IndexedDBStorage {}`
  2. **构造函数**：接受参数 `dbName = 'InterpretAssistantDB'`、`version = 1`，初始化时打开数据库连接
  3. **`_openDB()`（内部方法）**：返回 Promise<IDBDatabase>。使用 `indexedDB.open(dbName, version)`，在 `onupgradeneeded` 中创建 `audio_blobs` 对象存储（keyPath: 'id'），不设置自动递增
  4. **`saveAudioBlob(id, blob)`（async）**：打开数据库，在 `audio_blobs` 中执行 put 操作（`{ id, blob, createdAt: Date.now() }`）
  5. **`getAudioBlob(id)`（async）**：通过 ID 从 `audio_blobs` 中 get，返回 Blob 或 null
  6. **`deleteAudioBlob(id)`（async）**：从 `audio_blobs` 中 delete 指定记录
  7. **`getAllAudioKeys()`（async）**：获取所有已存储的音频 ID 列表
  8. **`_runSelfTest()`**：在浏览器控制台可调用，自动执行 saveAudioBlob → getAudioBlob → deleteAudioBlob 的完整流程验证

  **错误处理**：
  - 所有 IndexedDB 操作包装在 try-catch 中，错误时 console.error + 返回 null/reject
  - 检测 `window.indexedDB` 是否存在，不存在时给出友好提示
  - 处理 `QuotaExceededError`（存储满的情况）

  **Must NOT do**:
  - ❌ 不存储非 Blob 数据（音频元数据由 LocalStorage 管理）
  - ❌ 不创建多个数据库连接（复用已有连接或每次操作后关闭）

  **References**:
  - 接口签名: `README.md:178-185` — IndexedDBStorage 的三个核心方法
  - IndexedDB MDN: 使用 `IDBRequest.onsuccess` / `onerror` 模式，包装为 Promise

  **Acceptance Criteria**:
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/IndexedDBStorage.js','utf8'); console.log(code.includes('class IndexedDBStorage'));"` — 类定义存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/IndexedDBStorage.js','utf8'); console.log(code.includes('saveAudioBlob')&&code.includes('getAudioBlob')&&code.includes('deleteAudioBlob'));"` — 三个核心方法都存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('src/storage/IndexedDBStorage.js','utf8'); console.log(code.includes('indexedDB'));"` — 使用 IndexedDB API

  **QA Scenarios**:
  ```
  Scenario: IndexedDB 完整读写删除流程
    Tool: 浏览器控制台
    Steps:
      1. 执行: `const idb = new IndexedDBStorage()`
      2. 创建一个测试 Blob: `const blob = new Blob(['test audio data'], { type: 'audio/webm' })`
      3. 执行: `await idb.saveAudioBlob('test-1', blob)`
      4. 执行: `const result = await idb.getAudioBlob('test-1')`
      5. 验证 result 是 Blob 实例且大小匹配
      6. 执行: `await idb.deleteAudioBlob('test-1')`
      7. 执行: `const deleted = await idb.getAudioBlob('test-1')`
    Expected: get 返回与 save 一致的 Blob，delete 后返回 null
    Evidence: .sisyphus/evidence/task-2-indexeddb.txt

  Scenario: 获取不存在的音频
    Tool: 浏览器控制台
    Steps:
      1. 执行: `const result = await idb.getAudioBlob('non-existent-id')`
    Expected: 返回 null（不抛异常）
    Evidence: .sisyphus/evidence/task-2-indexeddb-miss.txt
  ```

  **Commit**: YES | Message: `feat(storage): implement IndexedDBStorage class for audio blob storage` | Files: [`src/storage/IndexedDBStorage.js`]

---

- [ ] 3. 实现 `js/main.js` — ShadowingApp 主控集成类

  **What to do**:
  1. **`import` 所有模块**：
  ```javascript
  import { AudioManager } from '../src/audio/AudioManager.js';
  import { SpeechRecognizer } from '../src/speech/SpeechRecognizer.js';
  import { PronunciationScorer } from '../src/scoring/PronunciationScorer.js';
  import { AudioPlayer } from '../src/ui/AudioPlayer.js';
  import { RecordingButton } from '../src/ui/RecordingButton.js';
  import { TranscriptDisplay } from '../src/ui/TranscriptDisplay.js';
  import { LocalStorage } from '../src/storage/LocalStorage.js';
  import { IndexedDBStorage } from '../src/storage/IndexedDBStorage.js';
  ```

  2. **`class ShadowingApp`** 构造函数：
  ```javascript
  constructor() {
    // 存储模块（自己的，完整实现）
    this.storage = new LocalStorage();
    this.indexedDB = new IndexedDBStorage();

    // 其他模块（待其他成员实现，目前为桩）
    this.audioManager = null;     // 成员1
    this.speechRecognizer = null;  // 成员2
    this.scorer = null;            // 成员3

    // UI组件（成员4，骨架就绪）
    this.audioPlayer = null;
    this.recordingButton = null;
    this.transcriptDisplay = null;

    // 状态
    this.currentAudioUrl = '';
    this.currentTranscript = '';
    this.isPracticeActive = false;
  }
  ```

  3. **`async init()`**：应用初始化
     - 获取 DOM 容器：`#transcript-container`、`#recording-control`、`#audio-player-control`、`#score-result-panel`、`#status-bar`
     - 实例化 UI 组件：
       - `this.transcriptDisplay = new TranscriptDisplay(container_transcript)`
       - `this.recordingButton = new RecordingButton(container_recording)`
       - `this.audioPlayer = new AudioPlayer(container_player)`
     - 尝试实例化其他模块（try-catch，模块未实现时不崩）：
       ```javascript
       try { this.audioManager = new AudioManager(); } catch(e) { console.warn('AudioManager not ready'); }
       try { this.speechRecognizer = new SpeechRecognizer(); } catch(e) { console.warn('SpeechRecognizer not ready'); }
       try { this.scorer = new PronunciationScorer(); } catch(e) { console.warn('PronunciationScorer not ready'); }
       ```
     - 绑定 UI 事件：
       ```javascript
       this.recordingButton.onRecordingStart(() => this._handleRecordingStart());
       this.recordingButton.onRecordingStop(() => this._handleRecordingStop());
       this.audioPlayer.onTimeUpdate((time) => this._handleTimeUpdate(time));
       this.audioPlayer.onEnded(() => this._handleAudioEnded());
       ```
     - 加载用户设置：`const settings = this.storage.getUserSettings()`
     - 更新状态栏：`this._updateStatus('就绪')`
     - 输出 `console.log('ShadowingApp initialized')`

  4. **`async startPractice(audioUrl, transcript)`**：开始练习
     - 设置：`this.currentAudioUrl = audioUrl; this.currentTranscript = transcript`
     - 显示原文：`this.transcriptDisplay.setTranscript(transcript)`
     - 播放音频（如果 audioManager 存在且 settings.autoPlay）
     - 标记：`this.isPracticeActive = true`
     - 隐藏旧的评分结果
     - `this._updateStatus('练习中...')`

  5. **`async endPractice()`**：结束练习并评分
     - 停止录音（检查 speechRecognizer）
     - 停止播放
     - 收集音频 Blob（从 RecordingButton 或从录音结果）
     - 如果有 scorer 且 Blob 存在，调用评分：
       ```javascript
       if (this.scorer && blob) {
         const result = await this.scorer.scorePronunciation(this.currentTranscript, userTranscript, blob);
         this._displayScore(result);
       }
       ```
     - 保存练习记录：
       ```javascript
       this.storage.savePracticeRecord({
         id: `practice-${Date.now()}`,
         date: new Date(),
         audioId: this.currentAudioUrl,
         overallScore: result?.overall || 0,
         details: result || {}
       });
       ```
     - 标记：`this.isPracticeActive = false`
     - `this._updateStatus('练习完成')`

  6. **`getProgress()`**：获取学习进度
     ```javascript
     const records = this.storage.getPracticeRecords();
     const total = records.length;
     const avgScore = total > 0 ? records.reduce((s, r) => s + r.overallScore, 0) / total : 0;
     const lastPractice = total > 0 ? records[records.length - 1].date : null;
     return { totalSessions: total, averageScore: avgScore, lastPractice };
     ```

  7. **内部方法**：
     - `_handleRecordingStart()`：开始录音（调用 speechRecognizer?.startRecording()）
     - `_handleRecordingStop()`：停止录音（调用 speechRecognizer?.stopRecording()）
     - `_handleTimeUpdate(time)`：同步高亮 `this.transcriptDisplay?.highlightWord(Math.floor(time))`
     - `_handleAudioEnded()`：自动触发评分流程
     - `_displayScore(result)`：将评分渲染到 `#score-details` 中
     - `_updateStatus(text)`：更新 `#status-bar` 的文本

  8. **`_runSelfTest()`**：在浏览器控制台可调用
     - 验证 DOM 容器存在
     - 验证 storage 模块可用
     - 验证 UI 组件已挂载
     - 报告各模块状态（就绪/未实现）

  **Must NOT do**:
  - ❌ 不要在其他成员模块未实现时报错崩溃（使用 try-catch + console.warn）
  - ❌ 不要直接操作 UI 组件内部 DOM（通过暴露的接口方法）
  - ❌ 不要修改 `index.html` 的 DOM 结构（使用已有挂载点）

  **References**:
  - ShadowingApp 接口: `README.md:188-216` — 类的完整接口签名
  - DOM 挂载点: `src/index.html:10-30` — #transcript-container、#recording-control 等
  - UI 组件接口: `src/ui/AudioPlayer.js:1-27`、`src/ui/RecordingButton.js:1-40`、`src/ui/TranscriptDisplay.js:1-30`
  - 存储接口: 本计划 Task 1、2 的输出
  - 数据结构: `src/types/interfaces.js:7-31` — PracticeRecord、UserSettings
  - 数据流约定: `UI_Integration_Guide.md:226-239` — 成员5是核心连接人

  **Acceptance Criteria**:
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('js/main.js','utf8'); console.log(code.includes('class ShadowingApp'));"` — 类定义存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('js/main.js','utf8'); console.log(code.includes('init')&&code.includes('startPractice')&&code.includes('endPractice')&&code.includes('getProgress'));"` — 四个核心方法都存在
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('js/main.js','utf8'); console.log(code.includes('import')&&code.includes('export'));"` — 使用了 ES6 模块
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('js/main.js','utf8'); console.log(code.includes('LocalStorage')&&code.includes('IndexedDBStorage'));"` — 导入了自己的 storage 模块
  - [ ] `node -e "const fs=require('fs'); const code=fs.readFileSync('js/main.js','utf8'); console.log(/try\s*\{[^}]*new\s+(AudioManager|SpeechRecognizer|PronunciationScorer)[^}]*\}\s*catch/.test(code));"` — 其他模块有 try-catch 保护

  **QA Scenarios**:
  ```
  Scenario: ShadowingApp 初始化
    Tool: 浏览器打开 index.html + 控制台
    Steps:
      1. 浏览器打开 index.html
      2. 控制台执行: `const app = new ShadowingApp()`
      3. 执行: `await app.init()`
      4. 验证: 无红色错误
      5. 验证: 控制台输出 "ShadowingApp initialized"
      6. 验证: 页面 #transcript-container、#recording-control、#audio-player-control 被挂载了 UI 组件
      7. 验证: localStorage 中可读默认 settings
    Expected: 应用初始化成功，UI 组件渲染到正确 DOM 节点
    Evidence: .sisyphus/evidence/task-3-init.txt

  Scenario: 练习流程骨架（无其他模块时的降级行为）
    Tool: 浏览器控制台
    Steps:
      1. 初始化 app
      2. 执行: `await app.startPractice('test.mp3', 'Hello world. This is a test.')`
      3. 验证: 无错误，transcript 显示在 TranscriptDisplay 中
      4. 执行: `await app.endPractice()`
      5. 验证: 保存了一条练习记录到 localStorage
      6. 执行: `app.getProgress()`
      7. 验证: 返回 { totalSessions: 1, averageScore: 0, lastPractice: Date }
    Expected: 所有方法在模块缺失时不崩，记录正确存储
    Evidence: .sisyphus/evidence/task-3-practice-flow.txt
  ```

  **Commit**: YES | Message: `feat(core): implement ShadowingApp main integration class` | Files: [`js/main.js`]

## Final Verification Wave（MANDATORY — 在所有实现任务之后执行）
- [ ] F1. 文件结构验证 — 确认所有3个文件存在且为非空
- [ ] F2. 语法检查 — 使用 node --check 或浏览器控制台检查无语法错误
- [ ] F3. 接口完整性验证 — 确认 LocalStorage 有 4+2 个方法、IndexedDBStorage 有 3 个方法、ShadowingApp 有 4 个核心方法
- [ ] F4. 集成兼容性验证 — 确认 main.js 的 import 路径正确匹配 src/ 目录结构
- [ ] F5. 代码规范审查 — ES6 class、JSDoc 注释、命名风格统一

## Commit Strategy
| # | Commit Message | Files |
|---|----------------|-------|
| 1 | `feat(storage): implement LocalStorage class for settings and records` | `src/storage/LocalStorage.js` |
| 2 | `feat(storage): implement IndexedDBStorage class for audio blob storage` | `src/storage/IndexedDBStorage.js` |
| 3 | `feat(core): implement ShadowingApp main integration class` | `js/main.js` |

**注**：可以三个文件完成后一次提交，也可以逐个提交。建议完成后一次提交以保持原子性。

## Success Criteria
1. ✅ LocalStorage.js — 完整实现 4 个数据方法 + 2 个音频缓存方法，通过语法检查和接口完整性验证
2. ✅ IndexedDBStorage.js — 完整实现 3 个核心方法，通过语法检查和接口完整性验证
3. ✅ main.js — ShadowingApp 类完整实现，4 个核心方法 + 内部事件处理 + try-catch 保护，通过语法检查
4. ✅ 浏览器打开 index.html 后 `new ShadowingApp().init()` 执行无报错
5. ✅ 所有模块使用 ES6 class + export，遵循 `src/types/interfaces.js` 定义的契约
