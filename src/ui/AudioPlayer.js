export class AudioPlayer {
    /**
     * @param {HTMLElement} container - 挂载的DOM容器
     * @param {string} audioUrl - 初始音频地址
     */
    constructor(container, audioUrl = '') {
        this.container = container;
        this.audioUrl = audioUrl;
        this._currentTime = 0;
        this._duration = 0;
        this._isPlaying = false;
        this._onTimeUpdate = null;
        this._onEnded = null;
        this._progressInterval = null;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="audio-player-ui">
                <button class="player-btn play-btn" title="播放/暂停">▶</button>
                <div class="player-progress">
                    <input type="range" class="progress-slider" min="0" max="100" value="0" step="0.1">
                    <span class="player-time">00:00 / 00:00</span>
                </div>
                <button class="player-btn stop-btn" title="停止">■</button>
            </div>
        `;

        this._playBtn = this.container.querySelector('.play-btn');
        this._stopBtn = this.container.querySelector('.stop-btn');
        this._slider = this.container.querySelector('.progress-slider');
        this._timeDisplay = this.container.querySelector('.player-time');

        this._playBtn.addEventListener('click', () => this._handlePlayPause());
        this._stopBtn.addEventListener('click', () => this.stop());
        this._slider.addEventListener('input', () => this._handleSeek());
    }

    // --- 内部UI更新 ---

    _updateTimeDisplay() {
        const cur = this._formatTime(this._currentTime);
        const dur = this._formatTime(this._duration);
        this._timeDisplay.textContent = `${cur} / ${dur}`;

        if (this._duration > 0) {
            const pct = (this._currentTime / this._duration) * 100;
            this._slider.value = pct;
        }
    }

    _formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    _handlePlayPause() {
        if (this._isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    _handleSeek() {
        const pct = parseFloat(this._slider.value);
        if (this._duration > 0) {
            const time = (pct / 100) * this._duration;
            this.seekTo(time);
        }
    }

    // --- 定时轮询进度（由主应用驱动或内建轮询） ---
    _startProgressPolling() {
        this._stopProgressPolling();
        // 每200ms触发 onTimeUpdate，主应用可借此读取真实进度
        this._progressInterval = setInterval(() => {
            if (this._onTimeUpdate && this._isPlaying) {
                this._onTimeUpdate(this._currentTime);
            }
        }, 200);
    }

    _stopProgressPolling() {
        if (this._progressInterval) {
            clearInterval(this._progressInterval);
            this._progressInterval = null;
        }
    }

    // --- 暴露给主应用的接口 ---

    /**
     * 由主应用调用，同步真实播放进度到UI
     * @param {number} currentTime - 秒
     * @param {number} duration - 秒
     */
    syncProgress(currentTime, duration) {
        this._currentTime = currentTime;
        this._duration = duration;
        this._updateTimeDisplay();
    }

    play() {
        this._isPlaying = true;
        this._playBtn.textContent = '⏸';
        this._playBtn.classList.add('playing');
        this._startProgressPolling();
    }

    pause() {
        this._isPlaying = false;
        this._playBtn.textContent = '▶';
        this._playBtn.classList.remove('playing');
        this._stopProgressPolling();
    }

    stop() {
        this._isPlaying = false;
        this._currentTime = 0;
        this._playBtn.textContent = '▶';
        this._playBtn.classList.remove('playing');
        this._stopProgressPolling();
        this._updateTimeDisplay();
        if (this._onEnded) this._onEnded();
    }

    seekTo(time) {
        this._currentTime = time;
        this._updateTimeDisplay();
    }

    getCurrentTime() { return this._currentTime; }

    // 事件回调注册
    onTimeUpdate(callback) { this._onTimeUpdate = callback; }
    onEnded(callback) { this._onEnded = callback; }
}
