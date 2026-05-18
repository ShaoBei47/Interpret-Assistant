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
    constructor() {
        // === 存储模块（成员5，完整可用） ===
        this.storage = new LocalStorage();
        this.indexedDB = new IndexedDBStorage();

        // === 其他成员模块（初始为 null，init 时 try-catch 实例化） ===
        this.audioManager = null;       // 成员1
        this.speechRecognizer = null;    // 成员2
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

        // 4. 绑定 UI 事件 → 内部处理函数
        this.recordingButton.onRecordingStart(() => this._handleRecordingStart());
        this.recordingButton.onRecordingStop(() => this._handleRecordingStop());
        this.audioPlayer.onTimeUpdate((time) => this._handleTimeUpdate(time));
        this.audioPlayer.onEnded(() => this._handleAudioEnded());

        // 5. 加载用户设置
        this.userSettings = this.storage.getUserSettings();
        console.log('[ShadowingApp] 用户设置已加载:', this.userSettings);

        // 6. 更新状态栏
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
        this.isPracticeActive = true;

        // 显示原文
        this.transcriptDisplay.setTranscript(transcript);

        // 自动播放（如果设置启用）
        if (this.userSettings?.autoPlay && this.audioManager) {
            try {
                await this.audioManager.playAudio(audioUrl);
            } catch (e) {
                console.warn('[ShadowingApp] 自动播放失败:', e.message);
            }
        }

        // 隐藏之前的评分结果
        if (this._scorePanel) {
            this._scorePanel.classList.add('hidden');
        }

        this._updateStatus('练习中... — Practicing');
    }

    /**
     * 结束练习 — 停止录音/播放、评分、保存记录
     * @returns {Promise<void>}
     */
    async endPractice() {
        if (!this.isPracticeActive) return;
        console.log('[ShadowingApp] 结束练习');

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
            } catch (e) {
                console.warn('[ShadowingApp] 停止识别失败:', e.message);
            }
        }

        // 评分
        let result = null;
        if (this.scorer && this.lastRecordedBlob && this.currentTranscript) {
            try {
                const userTranscript = ''; // 待 SpeechRecognizer 实现后替换为真实识别结果
                result = await this.scorer.scorePronunciation(
                    this.currentTranscript,
                    userTranscript,
                    this.lastRecordedBlob
                );
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
    _handleRecordingStart() {
        console.log('[ShadowingApp] 录音开始');
        if (this.speechRecognizer) {
            try {
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
    _handleRecordingStop() {
        console.log('[ShadowingApp] 录音停止');
        if (this.speechRecognizer) {
            try {
                this.speechRecognizer.stopRecognition();
            } catch (e) {
                console.warn('[ShadowingApp] 停止语音识别失败:', e.message);
            }
        }

        // 如果录音按钮暴露了音频 Blob 获取方式，在此捕获
        // 当前 RecordingButton 未提供 getBlob 接口，需要成员2/4补充
        this._updateStatus('处理中... — Processing');

        // 自动结束练习
        this.endPractice();
    }

    /**
     * 处理播放进度更新
     * @param {number} time - 当前播放时间（秒）
     */
    _handleTimeUpdate(time) {
        if (this.transcriptDisplay) {
            try {
                this.transcriptDisplay.highlightWord(Math.floor(time));
                this.transcriptDisplay.scrollToCurrent();
            } catch (e) {
                // TranscriptDisplay 的高亮方法尚未实现，静默忽略
            }
        }
    }

    /**
     * 处理音频播放结束
     */
    _handleAudioEnded() {
        console.log('[ShadowingApp] 音频播放结束');
        if (this.isPracticeActive) {
            this.endPractice();
        }
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
