/* =========================================================
   JARVIS WebOS - Neural Matrix Canvas Background
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("network-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle settings
    const PARTICLE_COUNT = Math.min(Math.floor((width * height) / 12000), 90);
    const CONNECTION_DIST = 130;
    const WINDOW_ATTACH_DIST = 170;
    const particles = [];

    // Mouse tracker
    const mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Helper: read the current theme color from CSS variables
    function getThemeColor() {
        const style = getComputedStyle(document.body);
        const color = style.getPropertyValue("--primary-color").trim();
        return color || "#00f0ff";
    }

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.2;
            this.vy = (Math.random() - 0.5) * 1.2;
            this.radius = Math.random() * 2 + 1.2;
            this.depth = Math.random() * 0.6 + 0.4; // 3D depth simulation
        }

        update() {
            this.x += this.vx * this.depth;
            this.y += this.vy * this.depth;

            // Bounce on boundary
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse repulsion / interaction
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x -= Math.cos(angle) * force * 3;
                    this.y -= Math.sin(angle) * force * 3;
                }
            }
        }

        draw(color) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * this.depth, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 10 * this.depth;
            ctx.shadowColor = color;
            ctx.globalAlpha = 0.7 * this.depth;
            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    // Get anchor points of visible open windows and icons
    function getInteractiveAnchors() {
        const anchors = [];
        
        // Window corners and centers
        const windows = document.querySelectorAll(".os-window:not([style*='display: none'])");
        windows.forEach((win) => {
            const rect = win.getBoundingClientRect();
            anchors.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            anchors.push({ x: rect.left + 15, y: rect.top + 15 });
            anchors.push({ x: rect.right - 15, y: rect.bottom - 15 });
        });

        // Desktop Icons
        const icons = document.querySelectorAll(".desktop-icon");
        icons.forEach((icon) => {
            const rect = icon.getBoundingClientRect();
            anchors.push({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        });

        return anchors;
    }

    // Main animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        const themeColor = getThemeColor();
        const anchors = getInteractiveAnchors();

        // 1. Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(themeColor);

            // 2. Connect particles to nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.45;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = themeColor;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // 3. Connect particles to floating Windows / UI elements
            for (let a = 0; a < anchors.length; a++) {
                const adx = particles[i].x - anchors[a].x;
                const ady = particles[i].y - anchors[a].y;
                const aDist = Math.hypot(adx, ady);

                if (aDist < WINDOW_ATTACH_DIST) {
                    const alpha = (1 - aDist / WINDOW_ATTACH_DIST) * 0.6;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(anchors[a].x, anchors[a].y);
                    ctx.strokeStyle = themeColor;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = themeColor;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]); // Tech dotted line for app connections
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
