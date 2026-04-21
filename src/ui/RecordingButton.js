export class RecordingButton {
    constructor(container) {
        this.container = container;
        this.recording = false;
        this.render();
    }

    render() {
        // TODO: 成员4 Day 2任务 - 渲染录音按钮DOM (麦克风图标、脉冲动画)
        this.container.innerHTML = `<button class="record-btn">开始录音</button>`;
        this.btn = this.container.querySelector('.record-btn');
        this.btn.addEventListener('click', () => this.toggleRecording());
    }

    toggleRecording() {
        if (this.recording) {
            this.stopRecordingUI();
            if (this._onRecordingStop) this._onRecordingStop(); // 触发外部回调
        } else {
            this.startRecordingUI();
            if (this._onRecordingStart) this._onRecordingStart(); // 触发外部回调
        }
    }

    startRecordingUI() {
        this.recording = true;
        this.btn.innerText = "停止录音";
        this.btn.classList.add('recording-active');
    }

    stopRecordingUI() {
        this.recording = false;
        this.btn.innerText = "开始录音";
        this.btn.classList.remove('recording-active');
    }

    // 事件回调注册
    onRecordingStart(callback) { this._onRecordingStart = callback; }
    onRecordingStop(callback) { this._onRecordingStop = callback; }
}