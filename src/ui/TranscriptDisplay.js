export class TranscriptDisplay {
    constructor(container, transcript = '') {
        this.container = container;
        this._currentWordIndex = -1;
        this._currentSentenceIndex = -1;
        this._words = [];
        this._sentences = [];
        this.setTranscript(transcript);
    }

    setTranscript(text) {
        this.text = text;
        this._currentWordIndex = -1;
        this._currentSentenceIndex = -1;
        this._parseText(text);
        this.render();
    }

    // 将文本拆分为句子和单词，建立索引映射
    _parseText(text) {
        this._words = [];
        this._sentences = [];

        if (!text || !text.trim()) return;

        // 按句末标点拆分句子（保留标点）
        const rawSentences = text.match(/[^.!?\n]+[.!?]*\n*|.+$/g) || [text];

        let wordGlobalIndex = 0;

        rawSentences.forEach(raw => {
            const trimmed = raw.trim();
            if (!trimmed) return;

            const wordParts = trimmed.match(/[\w']+|[^\w\s]+/g) || [trimmed];
            const wordIndices = [];

            wordParts.forEach(() => {
                wordIndices.push(wordGlobalIndex);
                this._words.push(wordParts[wordIndices.length - 1]);
                wordGlobalIndex++;
            });

            this._sentences.push({
                text: trimmed,
                startWord: wordIndices[0],
                endWord: wordIndices[wordIndices.length - 1]
            });
        });
    }

    render() {
        if (!this.text || !this.text.trim()) {
            this.container.innerHTML = '<div class="transcript-box">等待文本加载...</div>';
            return;
        }

        const html = this._sentences.map((sent, si) => {
            const sentenceWords = this._words.slice(sent.startWord, sent.endWord + 1);
            const wordSpans = sentenceWords.map((w, wi) => {
                const globalIdx = sent.startWord + wi;
                return `<span class="word" data-word-index="${globalIdx}">${this._escapeHtml(w)}</span>`;
            }).join(' ');
            return `<span class="sentence" data-sentence-index="${si}">${wordSpans}</span>`;
        }).join(' ');

        this.container.innerHTML = `<div class="transcript-box">${html}</div>`;
        this._domBox = this.container.querySelector('.transcript-box');
    }

    highlightWord(wordIndex) {
        // 移除旧高亮
        const prev = this.container.querySelector('.word.highlight-active');
        if (prev) prev.classList.remove('highlight-active');
        // 只保留句子高亮，不额外处理该词所属句子的高亮

        // 添加新高亮
        const target = this.container.querySelector(`.word[data-word-index="${wordIndex}"]`);
        if (target) {
            target.classList.add('highlight-active');
            this._currentWordIndex = wordIndex;
            this.scrollToElement(target);
        }
    }

    highlightSentence(sentenceIndex) {
        // 清除旧的句子和单词高亮
        const prevSent = this.container.querySelector('.sentence.highlight');
        if (prevSent) prevSent.classList.remove('highlight');
        const prevWord = this.container.querySelector('.word.highlight-active');
        if (prevWord) prevWord.classList.remove('highlight-active');

        const target = this.container.querySelector(`.sentence[data-sentence-index="${sentenceIndex}"]`);
        if (target) {
            target.classList.add('highlight');
            this._currentSentenceIndex = sentenceIndex;
            this.scrollToElement(target);
        }
    }

    scrollToCurrent() {
        // 自动滚动到当前高亮的元素
        const el =
            this.container.querySelector('.word.highlight-active') ||
            this.container.querySelector('.sentence.highlight');
        if (el) this.scrollToElement(el);
    }

    scrollToElement(el) {
        const container = this.container;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offset = elRect.top - containerRect.top;
        const centerOffset = offset - containerRect.height / 2 + elRect.height / 2;
        container.scrollBy({ top: centerOffset, behavior: 'smooth' });
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
}
