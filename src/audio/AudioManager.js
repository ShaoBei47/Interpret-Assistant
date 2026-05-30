/**
 * @file src/audio/AudioManager.js
 * @description 音频管理模块 — 播放控制、录音、音频可视化
 * 成员1 音频与播放控制 (Web Audio API)
 *
 * 职责：
 *   - 音频播放控制（播放/暂停/停止/跳转）
 *   - 播放进度追踪（getCurrentTime / getDuration）
 *   - 音频录制（MediaRecorder API → Blob）
 *   - 音频可视化（AnalyserNode 波形/频谱数据）
 *
 * 技术方案：
 *   - 使用 HTML5 Audio 元素进行播放（兼容性好、格式支持广）
 *   - 通过 AudioContext + MediaElementSourceNode 连接 AnalyserNode 实现可视化
 *   - 使用 MediaRecorder API + getUserMedia 实现录音
 */

export class AudioManager {
    constructor() {
        this._audioContext = null;
        this._audioElement = null;
        this._sourceNode = null;
        this._analyserNode = null;
        this._gainNode = null;
        this._isConnected = false;

        this._mediaRecorder = null;
        this._mediaStream = null;
        this._recordedChunks = [];
        this._isRecording = false;

        this._isPlaying = false;
        this._currentUrl = '';
        this._timeUpdateInterval = null;

        this._onTimeUpdate = null;
        this._onEnded = null;
        this._onPlay = null;
        this._onPause = null;
    }

    // ==================== 内部初始化 ====================

    /**
     * 确保 AudioContext 已创建并处于运行状态
     * @returns {AudioContext}
     */
    _ensureAudioContext() {
        if (!this._audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this._audioContext = new AudioCtx();
        }
        if (this._audioContext.state === 'suspended') {
            this._audioContext.resume();
        }
        return this._audioContext;
    }

    /**
     * 确保 Audio 元素已创建并绑定事件
     * @returns {HTMLAudioElement}
     */
    _ensureAudioElement() {
        if (!this._audioElement) {
            this._audioElement = new Audio();
            this._audioElement.crossOrigin = 'anonymous';
            this._audioElement.preload = 'auto';

            this._audioElement.addEventListener('ended', () => {
                this._isPlaying = false;
                this._stopTimeUpdatePolling();
                if (this._onEnded) this._onEnded();
            });

            this._audioElement.addEventListener('play', () => {
                this._isPlaying = true;
                if (this._onPlay) this._onPlay();
            });

            this._audioElement.addEventListener('pause', () => {
                this._isPlaying = false;
                if (this._onPause) this._onPause();
            });
        }
        return this._audioElement;
    }

    /**
     * 将 Audio 元素连接到 AudioContext 分析链路（仅执行一次）
     * 链路：source → analyser → gain → destination
     */
    _connectAnalyser() {
        if (this._isConnected) return;

        try {
            const ctx = this._ensureAudioContext();
            const audio = this._ensureAudioElement();

            this._sourceNode = ctx.createMediaElementSource(audio);
            this._analyserNode = ctx.createAnalyser();
            this._analyserNode.fftSize = 2048;
            this._gainNode = ctx.createGain();

            this._sourceNode.connect(this._analyserNode);
            this._analyserNode.connect(this._gainNode);
            this._gainNode.connect(ctx.destination);

            this._isConnected = true;
        } catch (e) {
            console.error('[AudioManager] 连接分析节点失败:', e.message);
        }
    }

    // ==================== 播放控制 ====================

    /**
     * 播放指定URL的音频
     * @param {string} url - 音频文件URL
     * @returns {Promise<void>}
     */
    async playAudio(url) {
        const audio = this._ensureAudioElement();

        if (this._currentUrl !== url) {
            audio.src = url;
            this._currentUrl = url;
            audio.load();
        } else if (audio.ended) {
            audio.currentTime = 0;
        }

        try {
            this._connectAnalyser();
            await audio.play();
            this._startTimeUpdatePolling();
        } catch (e) {
            console.error('[AudioManager] 播放失败:', e.message);
            throw e;
        }
    }

    /**
     * 暂停当前播放
     */
    pauseAudio() {
        const audio = this._ensureAudioElement();
        audio.pause();
        this._stopTimeUpdatePolling();
    }

    /**
     * 停止播放并重置进度到起点
     */
    stopAudio() {
        const audio = this._ensureAudioElement();
        audio.pause();
        audio.currentTime = 0;
        this._isPlaying = false;
        this._stopTimeUpdatePolling();
    }

    /**
     * 获取当前播放时间
     * @returns {number} 当前时间（秒）
     */
    getCurrentTime() {
        if (!this._audioElement) return 0;
        const t = this._audioElement.currentTime;
        return isFinite(t) ? t : 0;
    }

    /**
     * 获取音频总时长
     * @returns {number} 总时长（秒）
     */
    getDuration() {
        if (!this._audioElement) return 0;
        const d = this._audioElement.duration;
        return isFinite(d) ? d : 0;
    }

    /**
     * 跳转到指定时间位置（秒）
     * @param {number} time - 目标时间
     */
    seekTo(time) {
        const audio = this._ensureAudioElement();
        if (isFinite(time) && time >= 0) {
            audio.currentTime = time;
        }
    }

    /**
     * 设置播放倍速
     * @param {number} rate - 倍速 (0.5 ~ 2.0)
     */
    setPlaybackRate(rate) {
        const audio = this._ensureAudioElement();
        audio.playbackRate = Math.max(0.25, Math.min(4, rate));
    }

    // ==================== 录音控制 ====================

    /**
     * 开始录音（请求麦克风权限并启动 MediaRecorder）
     * @returns {Promise<void>}
     */
    async startRecording() {
        try {
            this._mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this._recordedChunks = [];

            this._mediaRecorder = new MediaRecorder(this._mediaStream);

            this._mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this._recordedChunks.push(e.data);
                }
            };

            this._mediaRecorder.start(100);
            this._isRecording = true;

            console.log('[AudioManager] 录音已开始');
        } catch (e) {
            console.error('[AudioManager] 启动录音失败:', e.message);
            throw e;
        }
    }

    /**
     * 停止录音并返回录制的音频数据
     * @returns {Promise<Blob|null>} 录音音频 Blob（webm格式），未录音时返回 null
     */
    async stopRecording() {
        if (!this._mediaRecorder || !this._isRecording) {
            return null;
        }

        return new Promise((resolve) => {
            this._mediaRecorder.onstop = () => {
                const blob = new Blob(this._recordedChunks, { type: 'audio/webm' });
                this._recordedChunks = [];
                this._isRecording = false;

                if (this._mediaStream) {
                    this._mediaStream.getTracks().forEach(track => track.stop());
                    this._mediaStream = null;
                }

                console.log('[AudioManager] 录音已停止, Blob大小:', blob.size);
                resolve(blob);
            };

            this._mediaRecorder.stop();
        });
    }

    /**
     * 查询当前是否正在录音
     * @returns {boolean}
     */
    isRecording() {
        return this._isRecording;
    }

    // ==================== 音频可视化 ====================

    /**
     * 获取 AnalyserNode（供外部绘制波形/频谱图）
     * @returns {AnalyserNode}
     */
    getAnalyserNode() {
        this._connectAnalyser();
        return this._analyserNode;
    }

    /**
     * 获取当前波形数据（时域）
     * @returns {number[]} 0-255 范围的波形采样值数组
     */
    getWaveformData() {
        if (!this._analyserNode) return [];

        const bufferLength = this._analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this._analyserNode.getByteTimeDomainData(dataArray);

        return Array.from(dataArray);
    }

    /**
     * 获取当前频谱数据（频域）
     * @returns {number[]} 0-255 范围的频率强度数组
     */
    getFrequencyData() {
        if (!this._analyserNode) return [];

        const bufferLength = this._analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this._analyserNode.getByteFrequencyData(dataArray);

        return Array.from(dataArray);
    }

    // ==================== 进度轮询 ====================

    /**
     * 启动进度轮询，每200ms触发 onTimeUpdate 回调
     */
    _startTimeUpdatePolling() {
        this._stopTimeUpdatePolling();
        this._timeUpdateInterval = setInterval(() => {
            if (this._onTimeUpdate && this._isPlaying) {
                this._onTimeUpdate(this.getCurrentTime());
            }
        }, 200);
    }

    /**
     * 停止进度轮询
     */
    _stopTimeUpdatePolling() {
        if (this._timeUpdateInterval) {
            clearInterval(this._timeUpdateInterval);
            this._timeUpdateInterval = null;
        }
    }

    // ==================== 事件回调注册 ====================

    onTimeUpdate(callback) { this._onTimeUpdate = callback; }
    onEnded(callback) { this._onEnded = callback; }
    onPlay(callback) { this._onPlay = callback; }
    onPause(callback) { this._onPause = callback; }

    // ==================== 资源清理 ====================

    /**
     * 释放所有资源（AudioContext、MediaStream、Audio元素）
     * 在应用卸载时调用
     */
    destroy() {
        this.stopAudio();

        if (this._isRecording) {
            this.stopRecording();
        }

        if (this._sourceNode) {
            this._sourceNode.disconnect();
            this._sourceNode = null;
        }
        if (this._analyserNode) {
            this._analyserNode.disconnect();
            this._analyserNode = null;
        }
        if (this._gainNode) {
            this._gainNode.disconnect();
            this._gainNode = null;
        }

        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }

        if (this._audioElement) {
            this._audioElement.pause();
            this._audioElement.src = '';
            this._audioElement = null;
        }

        this._isConnected = false;
        this._currentUrl = '';
        console.log('[AudioManager] 资源已释放');
    }
}
