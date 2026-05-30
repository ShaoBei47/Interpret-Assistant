/**
 * @file js/main.js
 * @description ShadowingApp 主控集成类 — 英语影子跟读应用的核心编排模块
 * 成员5 主控集成 (Days 2-4)
 *
 * 数据流：用户操作 → UI 事件 → main.js 处理 → 逻辑模块 → 存储/UI 更新
 *
 * 模块依赖关系：
 *   - storage/: 成员5实现 ✅（已就绪）
 *   - ui/: 成员4骨架 ✅（有有效导出）
 *   - audio/, speech/, scoring/: 其他成员并行开发中
 *     （使用动态 import()，模块未实现时不阻塞加载）
 */

// === UI 组件静态导入（成员4，有有效导出） ===
import { AudioPlayer } from '../src/ui/AudioPlayer.js';
import { RecordingButton } from '../src/ui/RecordingButton.js';
import { TranscriptDisplay } from '../src/ui/TranscriptDisplay.js';

// === 存储模块静态导入（成员5，已完成） ===
import { LocalStorage } from '../src/storage/LocalStorage.js';
import { IndexedDBStorage } from '../src/storage/IndexedDBStorage.js';

export class ShadowingApp {
    static EXERCISES = [];

    constructor() {
        // === 存储模块（成员5，完整可用） ===
        this.storage = new LocalStorage();
        this.indexedDB = new IndexedDBStorage();

        // === 其他成员模块（初始为 null，init 时 try-catch 实例化） ===
        this.audioManager = null;       // 成员1
        this.speechRecognizer = null;
        this.scorer = null;              // 成员3

        // === UI 组件（init 时挂载） ===
        this.audioPlayer = null;
        this.recordingButton = null;
        this.transcriptDisplay = null;

        // === 练习状态 ===
        this.currentAudioUrl = '';
        this.currentTranscript = '';
        this.isPracticeActive = false;
        this.lastRecordedBlob = null;
        this._lastUserTranscript = '';
        this._endPracticeTimer = null;
        this._transcriptVisible = false;
        this.userSettings = null;
    }

    /**
     * 初始化应用 — 挂载 UI、实例化模块、绑定事件
     * @returns {Promise<void>}
     */
    async init() {
        console.log('[ShadowingApp] 正在初始化...');

        // 1. 获取 DOM 容器
        const transcriptContainer = document.getElementById('transcript-container');
        const recordingContainer = document.getElementById('recording-control');
        const audioPlayerContainer = document.getElementById('audio-player-control');
        this._scorePanel = document.getElementById('score-result-panel');
        this._scoreDetails = document.getElementById('score-details');
        this._statusBar = document.getElementById('status-bar');

        if (!transcriptContainer || !recordingContainer || !audioPlayerContainer) {
            console.error('[ShadowingApp] 关键 DOM 容器缺失，请检查 index.html');
            return;
        }

        // 2. 实例化 UI 组件
        this.transcriptDisplay = new TranscriptDisplay(transcriptContainer);
        this.recordingButton = new RecordingButton(recordingContainer);
        this.audioPlayer = new AudioPlayer(audioPlayerContainer);

        // 3. 动态加载其他成员模块（使用 import() 而非静态 import）
        //    空文件/未实现时不阻塞整个应用加载
        try {
            const audioMod = await import('../src/audio/AudioManager.js');
            this.audioManager = new audioMod.AudioManager();
            console.log('[ShadowingApp] AudioManager 已就绪');
        } catch (e) {
            console.warn('[ShadowingApp] AudioManager 未就绪 — 音频播放功能暂不可用');
        }

        try {
            const speechMod = await import('../src/speech/SpeechRecognizer.js');
            this.speechRecognizer = new speechMod.SpeechRecognizer();
            console.log('[ShadowingApp] SpeechRecognizer 已就绪');
        } catch (e) {
            console.warn('[ShadowingApp] SpeechRecognizer 未就绪 — 语音识别功能暂不可用');
        }

        try {
            const scorerMod = await import('../src/scoring/PronunciationScorer.js');
            this.scorer = new scorerMod.PronunciationScorer();
            console.log('[ShadowingApp] PronunciationScorer 已就绪');
        } catch (e) {
            console.warn('[ShadowingApp] PronunciationScorer 未就绪 — 评分功能暂不可用');
        }

        // 4. 注册逻辑模块事件（连接 AudioManager → UI + 捕获识别结果）
        if (this.audioManager) {
            this.audioManager.onTimeUpdate((time) => {
                this.audioPlayer.syncProgress(time, this.audioManager.getDuration());
                this._handleTimeUpdate(time);
            });
            this.audioManager.onEnded(() => this._handleAudioEnded());
        }

        if (this.speechRecognizer) {
            this.speechRecognizer.onResult((transcript) => {
                this._lastUserTranscript = transcript;
            });
        }

        // 5. 绑定 UI 事件 → 内部处理函数
        this.recordingButton.onRecordingStart(() => this._handleRecordingStart());
        this.recordingButton.onRecordingStop(() => this._handleRecordingStop());
        this.audioPlayer.onTimeUpdate((time) => this._handleTimeUpdate(time));
        this.audioPlayer.onEnded(() => this._handleAudioEnded());
        this.audioPlayer.onSpeedChange((rate) => {
            if (this.audioManager) {
                this.audioManager.setPlaybackRate(rate);
            }
        });
        this.audioPlayer.onSeek((time) => {
            if (this.audioManager) {
                this.audioManager.seekTo(time);
            }
        });
        this.audioPlayer.onPlay(() => {
            if (this.isPracticeActive && this.currentAudioUrl && this.audioManager) {
                this.audioManager.playAudio(this.currentAudioUrl).catch(console.warn);
            }
        });
        this.audioPlayer.onPause(() => {
            this.audioManager?.pauseAudio();
        });

        // 6. 加载用户设置
        this.userSettings = this.storage.getUserSettings();
        console.log('[ShadowingApp] 用户设置已加载:', this.userSettings);

        // 7. 初始化上传功能
        this._initUploadSection();

        // 9. 绑定原文切换按钮
        document.getElementById('toggle-transcript-btn')
            ?.addEventListener('click', () => this._toggleTranscript());

        // 10. 更新状态栏
        this._updateStatus('就绪 — Ready');

        console.log('[ShadowingApp] 初始化完成 ✅');
    }

    /**
     * 开始练习 — 设置原文、开始播放
     * @param {string} audioUrl - 练习音频 URL
     * @param {string} transcript - 练习原文文本
     */
    async startPractice(audioUrl, transcript) {
        console.log('[ShadowingApp] 开始练习:', { audioUrl, transcript });

        this.currentAudioUrl = audioUrl;
        this.currentTranscript = transcript;
        this.lastRecordedBlob = null;
        this._lastUserTranscript = '';
        this.isPracticeActive = true;

        // 原文可选：有原文时显示并默认模糊，无原文时隐藏原文区域
        const transcriptContainer = document.getElementById('transcript-container');
        const toggleBtn = document.getElementById('toggle-transcript-btn');
        if (transcript) {
            this.transcriptDisplay.setTranscript(transcript);
            this._setTranscriptVisible(false);
            if (transcriptContainer) transcriptContainer.classList.remove('hidden');
            if (toggleBtn) toggleBtn.style.display = '';
        } else {
            if (transcriptContainer) transcriptContainer.classList.add('hidden');
            if (toggleBtn) toggleBtn.style.display = 'none';
        }

        // 播放音频
        if (this.audioManager) {
            try {
                await this.audioManager.playAudio(audioUrl);
            } catch (e) {
                console.warn('[ShadowingApp] 播放失败:', e.message);
            }
        }

        // 自动开始录音 + 语音识别（跟读时同步进行）
        if (this.audioManager) {
            try {
                await this.audioManager.startRecording();
                this.recordingButton.syncState(true);
            } catch (e) {
                console.warn('[ShadowingApp] 自动录音失败:', e.message);
            }
        }
        if (this.speechRecognizer) {
            try {
                this.speechRecognizer.startRecognition();
            } catch (e) {
                console.warn('[ShadowingApp] 自动语音识别失败:', e.message);
            }
        }

        // 同步 AudioPlayer UI 状态（显示为播放中）
        this.audioPlayer.play();

        // 隐藏之前的评分结果
        if (this._scorePanel) {
            this._scorePanel.classList.add('hidden');
        }

        this._updateStatus('跟读中... — Shadowing');
    }

    /**
     * 结束练习 — 停止录音/播放、评分、保存记录
     * @returns {Promise<void>}
     */
    async endPractice() {
        if (!this.isPracticeActive) return;
        console.log('[ShadowingApp] 结束练习');

        // 清除延迟停止定时器（防止 manual + auto 重复触发）
        if (this._endPracticeTimer) {
            clearTimeout(this._endPracticeTimer);
            this._endPracticeTimer = null;
        }

        // 停止播放
        if (this.audioManager) {
            try {
                this.audioManager.stopAudio();
            } catch (e) {
                console.warn('[ShadowingApp] 停止播放失败:', e.message);
            }
        }

        // 停止语音识别
        if (this.speechRecognizer) {
            try {
                this.speechRecognizer.stopRecognition();
                const final = this.speechRecognizer.getFinalTranscript();
                if (final) this._lastUserTranscript = final;
            } catch (e) {
                console.warn('[ShadowingApp] 停止识别失败:', e.message);
            }
        }

        // 停止录音并获取 Blob（自动模式下录音仍在进行，需在此处停止）
        if (this.audioManager && !this.lastRecordedBlob) {
            try {
                this.lastRecordedBlob = await this.audioManager.stopRecording();
            } catch (e) {
                console.warn('[ShadowingApp] 停止录音失败:', e.message);
            }
        }

        // 评分
        let result = null;
        if (this.scorer && this.lastRecordedBlob) {
            try {
                if (this.currentTranscript) {
                    const userTranscript = this._lastUserTranscript || '';
                    result = await this.scorer.scorePronunciation(
                        this.currentTranscript,
                        userTranscript,
                        this.lastRecordedBlob
                    );
                } else {
                    // 无原文：仅基于音频特征评分（语速、音量）
                    result = await this.scorer.scorePronunciation('', '', this.lastRecordedBlob);
                    result.overall = result.audioScore;
                    result.textScore = null;
                }
                console.log('[ShadowingApp] 评分结果:', result);
                this._displayScore(result);
            } catch (e) {
                console.warn('[ShadowingApp] 评分失败:', e.message);
            }
        }

        // 保存练习记录
        try {
            this.storage.savePracticeRecord({
                id: 'practice-' + Date.now(),
                date: new Date(),
                audioId: this.currentAudioUrl,
                overallScore: result?.overall || 0,
                details: result || { textScore: 0, audioScore: 0, feedback: ['评分功能暂不可用'] }
            });
        } catch (e) {
            console.warn('[ShadowingApp] 保存练习记录失败:', e.message);
        }

        // 复位 UI 状态
        this.recordingButton.syncState(false);
        this.audioPlayer.stop();

        this.isPracticeActive = false;
        this._updateStatus('练习完成 — Practice Complete');
    }

    /**
     * 获取学习进度统计
     * @returns {{ totalSessions: number, averageScore: number, lastPractice: Date|null }}
     */
    getProgress() {
        const records = this.storage.getPracticeRecords();
        const total = records.length;
        const avgScore = total > 0
            ? Number((records.reduce((sum, r) => sum + r.overallScore, 0) / total).toFixed(1))
            : 0;
        const lastPractice = total > 0 ? records[records.length - 1].date : null;

        return {
            totalSessions: total,
            averageScore: avgScore,
            lastPractice: lastPractice
        };
    }

    // ==================== 内部事件处理 ====================

    /**
     * 处理录音开始事件
     */
    async _handleRecordingStart() {
        // 自动跟读模式下，录音已由 startPractice 自动启动，忽略手动点击
        if (this.audioManager?.isRecording()) {
            this.recordingButton.syncState(false);
            return;
        }
        console.log('[ShadowingApp] 录音开始');

        // 成员1：开始采集音频
        if (this.audioManager) {
            try {
                await this.audioManager.startRecording();
            } catch (e) {
                console.warn('[ShadowingApp] 启动录音失败:', e.message);
            }
        }

        // 成员2：开始语音识别
        if (this.speechRecognizer) {
            try {
                this._lastUserTranscript = '';
                this.speechRecognizer.startRecognition();
            } catch (e) {
                console.warn('[ShadowingApp] 启动语音识别失败:', e.message);
            }
        }

        this._updateStatus('录音中... — Recording');
    }

    /**
     * 处理录音停止事件
     */
    async _handleRecordingStop() {
        // 自动跟读模式下，录音由音频结束后的延迟自动停止，忽略手动
        if (this.isPracticeActive && this._endPracticeTimer) {
            this.recordingButton.syncState(true);
            return;
        }
        console.log('[ShadowingApp] 录音停止');

        // 成员1：停止录音并获取音频 Blob
        if (this.audioManager) {
            try {
                this.lastRecordedBlob = await this.audioManager.stopRecording();
            } catch (e) {
                console.warn('[ShadowingApp] 停止录音失败:', e.message);
            }
        }

        // 成员2：停止语音识别并获取最终转录文本
        if (this.speechRecognizer) {
            try {
                this.speechRecognizer.stopRecognition();
                const final = this.speechRecognizer.getFinalTranscript();
                if (final) this._lastUserTranscript = final;
            } catch (e) {
                console.warn('[ShadowingApp] 停止识别失败:', e.message);
            }
        }

        this._updateStatus('处理中... — Processing');

        // 自动结束练习
        await this.endPractice();
    }

    /**
     * 处理播放进度更新
     * @param {number} time - 当前播放时间（秒）
     */
    _handleTimeUpdate(time) {
        // 高亮跳动与音频不同步，已禁用
    }

    /**
     * 处理音频播放结束
     */
    _handleAudioEnded() {
        console.log('[ShadowingApp] 音频播放结束');
        if (this.isPracticeActive) {
            this._updateStatus('跟读结束，1.5秒后自动评分...');
            this._endPracticeTimer = setTimeout(() => {
                this._endPracticeTimer = null;
                this.endPractice();
            }, 1500);
        }
    }

    // ==================== 原文显示控制 ====================

    /**
     * 切换原文可见性（影子跟读模式默认隐藏，点击按钮可切换）
     * @param {boolean} visible
     */
    _setTranscriptVisible(visible) {
        this._transcriptVisible = visible;
        const container = document.getElementById('transcript-container');
        if (!container) return;
        container.classList.toggle('transcript-blurred', !visible);

        const btn = document.getElementById('toggle-transcript-btn');
        if (btn) btn.textContent = visible ? '隐藏原文' : '显示原文';
    }

    /**
     * 切换原文显示/隐藏（由按钮点击触发）
     */
    _toggleTranscript() {
        this._setTranscriptVisible(!this._transcriptVisible);
    }

    // ==================== Whisper 离线识别 ====================

    /**
     * 使用 Web Worker + Whisper 离线识别音频（不阻塞主线程）
     * @param {File} file - 用户选择的音频文件
     * @param {(pct: number|null, label: string) => void} onProgress
     * @returns {Promise<string>}
     */
    async _recognizeWithWhisper(file, onProgress) {
        onProgress?.(0, '启动识别引擎...');

        // 创建 Web Worker（ES Module Worker）
        const worker = new Worker(
            new URL('./whisper-worker.js', import.meta.url),
            { type: 'module' }
        );

        let text;
        try {
            text = await new Promise((resolve, reject) => {
                worker.onmessage = (e) => {
                    const msg = e.data;
                    if (msg.type === 'progress' && msg.status === 'download') {
                        const pct = Math.round((msg.loaded / msg.total) * 100);
                        onProgress?.(pct, `下载模型 ${pct}%`);
                    } else if (msg.type === 'init_done') {
                        onProgress?.(null, '解码音频...');
                        this._decodeAndTranscribe(file, worker, onProgress).catch(reject);
                    } else if (msg.type === 'result') {
                        resolve(msg.text);
                    } else if (msg.type === 'error') {
                        reject(new Error(msg.message));
                    }
                };
                worker.postMessage({ type: 'init' });
            });
        } finally {
            worker.terminate();
        }

        onProgress?.(100, '识别完成');
        return text;
    }

    /**
     * 在主线程度解码音频并发送给 worker 推理
     */
    async _decodeAndTranscribe(file, worker, onProgress) {
        const arrayBuffer = await file.arrayBuffer();
        const sourceCtx = new (window.AudioContext || window.webkitAudioContext)();
        try {
            const audioBuffer = await sourceCtx.decodeAudioData(arrayBuffer);
            const duration = audioBuffer.duration;
            const targetRate = 16000;
            const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * targetRate), targetRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            source.start();
            const rendered = await offlineCtx.startRendering();
            const samples = rendered.getChannelData(0);

            onProgress?.(null, '识别中...');

            // 通过 transferable 传递（零拷贝）
            worker.postMessage(
                { type: 'transcribe', samples: samples.buffer },
                [samples.buffer]
            );
        } finally {
            sourceCtx.close();
        }
    }

    // ==================== 上传功能 ====================

    /**
     * 初始化上传面板 — 文件选择、识别、自定义练习
     */
    _initUploadSection() {
        const fileInput = document.getElementById('audio-file-input');
        const fileNameEl = document.getElementById('upload-file-name');
        const transcriptInput = document.getElementById('custom-transcript-input');
        const recognizeBtn = document.getElementById('recognize-audio-btn');
        const progressRow = document.getElementById('recognize-progress-row');
        const progressFill = document.getElementById('recognize-progress-fill');
        const progressLabel = document.getElementById('recognize-progress-label');
        const startBtn = document.getElementById('start-custom-practice-btn');
        if (!fileInput || !startBtn) return;

        let currentBlobUrl = '';
        let currentFile = null;

        function setProgress(pct, label, indeterminate) {
            if (progressRow) progressRow.style.display = '';
            if (progressFill) {
                progressFill.style.width = (pct ?? 0) + '%';
                progressFill.classList.toggle('indeterminate', !!indeterminate);
            }
            if (progressLabel) progressLabel.textContent = label ?? '';
        }
        function hideProgress() {
            if (progressRow) progressRow.style.display = 'none';
        }

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) return;
            if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = URL.createObjectURL(file);
            currentFile = file;
            fileNameEl.textContent = file.name;
            if (recognizeBtn) recognizeBtn.disabled = false;
            startBtn.disabled = false;
        });

        // Whisper 离线识别
        if (recognizeBtn) {
            recognizeBtn.addEventListener('click', async () => {
                if (!currentFile) return;
                recognizeBtn.disabled = true;
                recognizeBtn.textContent = '识别中...';
                setProgress(0, '加载模型...');

                try {
                    const text = await this._recognizeWithWhisper(currentFile, (pct, label) => {
                        setProgress(pct, label);
                    });
                    transcriptInput.value = text;
                    setProgress(100, '✅ 识别完成');
                    setTimeout(hideProgress, 3000);
                } catch (e) {
                    console.warn('[ShadowingApp] Whisper 识别失败:', e.message);
                    setProgress(0, '❌ 识别失败，请手动输入');
                    setTimeout(hideProgress, 5000);
                }

                recognizeBtn.disabled = false;
                recognizeBtn.textContent = '🎤 识别原文文本';
            });
        }

        startBtn.addEventListener('click', async () => {
            const transcript = transcriptInput.value.trim();
            if (!currentBlobUrl) {
                alert('请先上传音频');
                return;
            }
            startBtn.disabled = true;
            startBtn.textContent = '练习中...';
            try {
                await this.startPractice(currentBlobUrl, transcript);
            } finally {
                startBtn.disabled = false;
                startBtn.textContent = '开始练习';
            }
        });
    }

    // ==================== UI 更新方法 ====================

    /**
     * 显示评分结果到页面
     * @param {import('../../src/types/interfaces.js').ScoreResult} result
     */
    _displayScore(result) {
        if (!this._scoreDetails || !this._scorePanel) return;

        const feedbackHtml = result.feedback && result.feedback.length > 0
            ? '<ul class="feedback-list">' + result.feedback.map(f => '<li>' + f + '</li>').join('') + '</ul>'
            : '<p class="feedback-empty">暂无反馈</p>';

        this._scoreDetails.innerHTML = `
            <div class="score-overview">
                <div class="score-main">综合得分: ${result.overall}</div>
                <div class="score-breakdown">
                    <span>文本相似度: ${result.textScore}</span>
                    <span>发音特征: ${result.audioScore}</span>
                </div>
                <div class="score-feedback">
                    <h3>改进建议</h3>
                    ${feedbackHtml}
                </div>
            </div>
        `;

        this._scorePanel.classList.remove('hidden');
    }

    /**
     * 更新状态栏文本
     * @param {string} text - 状态文本
     */
    _updateStatus(text) {
        if (this._statusBar) {
            this._statusBar.textContent = text;
        }
    }

    // ==================== 自检方法 ====================

    /**
     * 在浏览器控制台执行自检 — 验证所有模块和 DOM 挂载状态
     */
    _runSelfTest() {
        console.group('[ShadowingApp 自检]');

        // 1. DOM 容器检查
        const domIds = ['transcript-container', 'recording-control', 'audio-player-control',
            'score-result-panel', 'score-details', 'status-bar'];
        domIds.forEach(id => {
            const el = document.getElementById(id);
            console.assert(el !== null, '❌ DOM 容器 #' + id + ' 不存在');
            if (el) console.log('✅ DOM #' + id);
        });

        // 2. 存储模块检查
        console.assert(this.storage instanceof LocalStorage, '❌ storage 未初始化');
        console.log('✅ LocalStorage:', this.storage ? '就绪' : '未就绪');
        console.assert(this.indexedDB instanceof IndexedDBStorage, '❌ indexedDB 未初始化');
        console.log('✅ IndexedDBStorage:', this.indexedDB ? '就绪' : '未就绪');

        // 3. UI 组件检查
        console.assert(this.transcriptDisplay !== null, '❌ transcriptDisplay 未初始化');
        console.log('✅ TranscriptDisplay:', this.transcriptDisplay ? '就绪' : '未就绪');
        console.assert(this.recordingButton !== null, '❌ recordingButton 未初始化');
        console.log('✅ RecordingButton:', this.recordingButton ? '就绪' : '未就绪');
        console.assert(this.audioPlayer !== null, '❌ audioPlayer 未初始化');
        console.log('✅ AudioPlayer:', this.audioPlayer ? '就绪' : '未就绪');

        // 4. 其他模块状态报告
        console.log('📦 AudioManager:', this.audioManager ? '就绪 ✅' : '未实现 ⏳');
        console.log('📦 SpeechRecognizer:', this.speechRecognizer ? '就绪 ✅' : '未实现 ⏳');
        console.log('📦 PronunciationScorer:', this.scorer ? '就绪 ✅' : '未实现 ⏳');

        // 5. 存储功能快速验证
        const before = this.storage.getPracticeRecords().length;
        this.storage.savePracticeRecord({
            id: 'self-test-' + Date.now(),
            date: new Date(),
            audioId: '__self_test__',
            overallScore: 100,
            details: { test: true }
        });
        const after = this.storage.getPracticeRecords().length;
        console.assert(after > before, '❌ 存储功能异常');
        console.log('✅ 存储功能:', '读写正常 (' + after + ' 条记录)');

        // 清理测试数据
        const cleanRecords = this.storage.getPracticeRecords().filter(r => r.audioId !== '__self_test__');
        try {
            localStorage.setItem('ia_records', JSON.stringify(cleanRecords));
        } catch (e) { /* ignore */ }

        console.log('🎉 ShadowingApp 自检完成');
        console.groupEnd();
    }
}

// ==================== 自动初始化 ====================

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new ShadowingApp();
        window.app.init().catch(err => {
            console.error('[ShadowingApp] 初始化异常:', err);
        });
    });
}
