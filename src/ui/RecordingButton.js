export class RecordingButton {
    constructor(container) {
        this.container = container;
        this.recording = false;
        this._recordingStartTime = 0;
        this._durationInterval = null;
        this._onRecordingStart = null;
        this._onRecordingStop = null;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div>
                <button class="record-btn" title="开始/停止录音">
                    <svg class="record-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/>
                        <path d="M18 10v1a6 6 0 01-12 0v-1" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
                        <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <span class="record-duration">00:00</span>
                <span class="record-label"></span>
            </div>
        `;

        this._btn = this.container.querySelector('.record-btn');
        this._durationEl = this.container.querySelector('.record-duration');
        this._labelEl = this.container.querySelector('.record-label');

        this._btn.addEventListener('click', () => this.toggleRecording());
    }

    toggleRecording() {
        if (this.recording) {
            this._stopRecording();
        } else {
            this._startRecording();
        }
    }

    _startRecording() {
        this.recording = true;
        this._recordingStartTime = Date.now();
        this._btn.classList.add('recording-active');
        if (this._labelEl) this._labelEl.textContent = '录音中';
        this._updateDuration();
        this._durationInterval = setInterval(() => this._updateDuration(), 200);
        if (this._onRecordingStart) this._onRecordingStart();
    }

    _stopRecording() {
        this.recording = false;
        this._btn.classList.remove('recording-active');
        if (this._labelEl) this._labelEl.textContent = '';
        clearInterval(this._durationInterval);
        this._durationInterval = null;
        if (this._onRecordingStop) this._onRecordingStop();
    }

    _updateDuration() {
        const elapsed = Math.floor((Date.now() - this._recordingStartTime) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        this._durationEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // --- 暴露给主应用的接口 ---

    isRecording() { return this.recording; }

    getRecordingTime() {
        if (!this.recording) return 0;
        return Math.floor((Date.now() - this._recordingStartTime) / 1000);
    }

    /** 重置UI状态（录音完成后由主应用调用） */
    reset() {
        this.recording = false;
        this._btn.classList.remove('recording-active');
        clearInterval(this._durationInterval);
        this._durationInterval = null;
        this._durationEl.textContent = '00:00';
        if (this._labelEl) this._labelEl.textContent = '';
    }

    /**
     * 由主应用调用，同步外部录音状态到按钮UI（自动跟读场景）
     * @param {boolean} isRecording
     */
    syncState(isRecording) {
        if (isRecording && !this.recording) {
            this.recording = true;
            this._recordingStartTime = Date.now();
            this._btn.classList.add('recording-active');
            if (this._labelEl) this._labelEl.textContent = '录音中';
            this._updateDuration();
            this._durationInterval = setInterval(() => this._updateDuration(), 200);
        } else if (!isRecording && this.recording) {
            this.recording = false;
            this._btn.classList.remove('recording-active');
            if (this._labelEl) this._labelEl.textContent = '';
            clearInterval(this._durationInterval);
            this._durationInterval = null;
            this._durationEl.textContent = '00:00';
        }
    }

    // 事件回调注册
    onRecordingStart(callback) { this._onRecordingStart = callback; }
    onRecordingStop(callback) { this._onRecordingStop = callback; }
}
