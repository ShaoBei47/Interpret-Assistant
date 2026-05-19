/**
 * @file src/ui/ParticleEffects.js
 * @description 点击粒子烟花特效 — 点击页面任意位置触发彩色粒子爆发
 * 成员4 — UI/UX 增强
 *
 * 使用方式（在 main.js 或其他入口中）：
 *   import { ParticleEffects } from './ui/ParticleEffects.js';
 *   const fx = new ParticleEffects();
 *   fx.attach(document.body);
 */

export class ParticleEffects {
    constructor(options = {}) {
        this.maxParticles = options.maxParticles || 35;
        this.colors = options.colors || [
            '#4F6EF7', '#7B93FA', '#A78BFA', '#F472B6',
            '#FBBF24', '#34D399', '#60A5FA', '#F87171',
            '#818CF8', '#F9A8D4', '#FDE047', '#5EEAD4'
        ];
        this.gravity = options.gravity || 0.15;
        this.friction = options.friction || 0.96;
        this.minSize = options.minSize || 4;
        this.maxSize = options.maxSize || 10;
        this.lifespan = options.lifespan || 900; // ms

        this._canvas = null;
        this._ctx = null;
        this._particles = [];
        this._ripples = [];
        this._ambientParticles = [];
        this._animating = false;
        this._ambientTimer = null;
        this._scoreObserver = null;

        // 光标光晕
        this._mouseX = -200;
        this._mouseY = -200;
        this._mouseActive = false;
        this._smoothX = -200;
        this._smoothY = -200;
    }

    /**
     * 将特效挂载到指定容器
     * @param {HTMLElement} container
     */
    attach(container) {
        this._canvas = document.createElement('canvas');
        this._canvas.className = 'particle-canvas';
        this._canvas.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none; z-index: 9999;
        `;
        container.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');
        this._resize();

        this._initAmbient();
        this._observeScore();
        window.addEventListener('resize', this._resize);
        document.addEventListener('click', this._onClick);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseleave', this._onMouseLeave);
    }

    /** 销毁特效实例 */
    destroy() {
        window.removeEventListener('resize', this._resize);
        document.removeEventListener('click', this._onClick);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseleave', this._onMouseLeave);
        if (this._ambientTimer) clearInterval(this._ambientTimer);
        if (this._scoreObserver) this._scoreObserver.disconnect();
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        this._particles = [];
        this._ripples = [];
        this._ambientParticles = [];
        this._animating = false;
    }

    // --- 背景漂浮粒子 ---
    _initAmbient() {
        const count = 18;
        for (let i = 0; i < count; i++) {
            this._ambientParticles.push(this._createAmbientParticle());
        }
        // 每3秒随机重生一个
        this._ambientTimer = setInterval(() => {
            if (this._ambientParticles.length < 22) {
                this._ambientParticles.push(this._createAmbientParticle());
            }
        }, 3000);

        if (!this._animating) {
            this._animating = true;
            requestAnimationFrame(this._tick);
        }
    }

    // --- 评分庆祝彩纸 ---
    _observeScore() {
        const panel = document.getElementById('score-result-panel');
        if (!panel) return;

        this._scoreObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    if (!panel.classList.contains('hidden')) {
                        // 评分面板显示 → 庆祝！
                        this.celebrate();
                    }
                }
            }
        });
        this._scoreObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
    }

    /**
     * 公开方法：触发庆祝彩纸（分数出来时调用）
     * 也可通过 window._particleFX.celebrate() 手动触发
     */
    celebrate() {
        const w = this._canvas ? this._canvas.width : window.innerWidth;
        const h = this._canvas ? this._canvas.height : window.innerHeight;

        // 从顶部中央喷发
        const cx = w / 2;
        const cy = h * 0.1;

        const confettiColors = [
            '#F472B6', '#FB7185', '#FBBF24', '#FDE047',
            '#A78BFA', '#818CF8', '#4F6EF7', '#34D399',
            '#F97316', '#E879F9', '#22D3EE', '#FB923C'
        ];

        for (let j = 0; j < 3; j++) {
            setTimeout(() => {
                const count = 40 + Math.floor(Math.random() * 30);
                for (let i = 0; i < count; i++) {
                    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
                    const speed = 4 + Math.random() * 10;
                    const size = 5 + Math.random() * 10;

                    this._particles.push({
                        x: cx + (Math.random() - 0.5) * 300,
                        y: cy + Math.random() * 40,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 3,
                        size,
                        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                        opacity: 1,
                        life: 1,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.5,
                        shape: Math.random() > 0.4 ? 'confetti' : 'circle',
                        gravity: 0.06 + Math.random() * 0.1,
                        friction: 0.98,
                        lifespan: 2000 + Math.random() * 1500
                    });
                }
                if (!this._animating) {
                    this._animating = true;
                    requestAnimationFrame(this._tick);
                }
            }, j * 150);
        }
    }

    _createAmbientParticle() {
        const w = this._canvas ? this._canvas.width : window.innerWidth;
        const h = this._canvas ? this._canvas.height : window.innerHeight;
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            size: 1.5 + Math.random() * 3,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            opacity: 0.15 + Math.random() * 0.25,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.15 - Math.random() * 0.4,
            life: 0.3 + Math.random() * 0.7, // 重生用
            maxLife: 600 + Math.random() * 800 // 帧数大约
        };
    }

    // --- 内部 ---

    _resize = () => {
        if (!this._canvas) return;
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
    };

    _onClick = (e) => {
        this._spawn(e.clientX, e.clientY);
    };

    _onMouseMove = (e) => {
        this._mouseX = e.clientX;
        this._mouseY = e.clientY;
        this._mouseActive = true;
    };

    _onMouseLeave = () => {
        this._mouseActive = false;
    };

    _spawn(x, y) {
        // 涟漪环
        this._ripples.push({ x, y, radius: 6, opacity: 0.7 });

        // 粒子
        const count = Math.floor(this.maxParticles * (0.6 + Math.random() * 0.4));
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
            const speed = 2 + Math.random() * 6;
            const size = this.minSize + Math.random() * (this.maxSize - this.minSize);

            this._particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1,
                life: 1,              // 1 → 0
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                shape: Math.random() > 0.35 ? 'circle' : 'star'
            });
        }

        if (!this._animating) {
            this._animating = true;
            requestAnimationFrame(this._tick);
        }
    }

    _tick = () => {
        const ctx = this._ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // 光标光晕（平滑跟随）
        const lerp = 0.08;
        this._smoothX += (this._mouseX - this._smoothX) * lerp;
        this._smoothY += (this._mouseY - this._smoothY) * lerp;

        if (this._mouseActive) {
            const glow = ctx.createRadialGradient(
                this._smoothX, this._smoothY, 0,
                this._smoothX, this._smoothY, 180
            );
            glow.addColorStop(0, 'rgba(79,110,247,0.06)');
            glow.addColorStop(0.4, 'rgba(123,147,250,0.03)');
            glow.addColorStop(1, 'rgba(79,110,247,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }

        // 绘制背景漂浮粒子
        for (let i = this._ambientParticles.length - 1; i >= 0; i--) {
            const a = this._ambientParticles[i];
            a.x += a.vx;
            a.y += a.vy;
            a.maxLife--;
            if (a.maxLife <= 0 || a.y < -20 || a.x < -20 || a.x > this._canvas.width + 20) {
                this._ambientParticles.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.fillStyle = a.color;
            ctx.globalAlpha = a.opacity;
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 更新 & 绘制涟漪
        for (let i = this._ripples.length - 1; i >= 0; i--) {
            const r = this._ripples[i];
            r.radius += 2.5;
            r.opacity -= 0.025;
            if (r.opacity <= 0) {
                this._ripples.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(79,110,247,${r.opacity.toFixed(3)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // 更新 & 绘制粒子
        for (let i = this._particles.length - 1; i >= 0; i--) {
            const p = this._particles[i];

            // 物理（支持独立参数）
            const grav = p.gravity != null ? p.gravity : this.gravity;
            const fric = p.friction != null ? p.friction : this.friction;
            const ls    = p.lifespan != null ? p.lifespan : this.lifespan;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += grav;
            p.vx *= fric;
            p.vy *= fric;
            p.rotation += p.rotationSpeed;
            p.life -= 1 / (ls / 16);

            if (p.life <= 0) {
                this._particles.splice(i, 1);
                continue;
            }

            // 绘制
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.life * p.opacity;
            ctx.fillStyle = p.color;

            if (p.shape === 'star') {
                this._drawStar(ctx, 0, 0, p.size);
            } else if (p.shape === 'confetti') {
                this._drawConfetti(ctx, 0, 0, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        if (this._particles.length > 0 || this._ripples.length > 0 || this._ambientParticles.length > 0) {
            requestAnimationFrame(this._tick);
        } else {
            this._animating = false;
        }
    };

    _drawStar(ctx, cx, cy, size) {
        const spikes = 4;
        const outerRadius = size / 2;
        const innerRadius = outerRadius * 0.4;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    _drawConfetti(ctx, cx, cy, size) {
        const w = size * 0.6;
        const h = size * 0.3;
        ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    }
}

// 自动初始化（不依赖其他成员代码）
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window._particleFX = new ParticleEffects();
        window._particleFX.attach(document.body);
    });
}
