class NeonSnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameState = 'start'; // start, playing, gameOver
        this.score = 0;
        this.level = 1;
        this.speed = 1;
        
        // Snake properties
        this.snake = [{x: Math.floor(this.width / 2 / this.gridSize) * this.gridSize, y: Math.floor(this.height / 2 / this.gridSize) * this.gridSize}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.gridSize = 20;
        

        
        // Food
        this.food = this.generateFood();
        
        // Particle systems
        this.particles = [];
        this.tracers = [];
        this.sparks = [];
        this.waveEffects = [];
        
        // Audio context
        this.audioContext = null;
        this.initAudio();
        
        // Particle intensity
        this.particleIntensity = 3;
        this.setupParticleSlider();
        
        // Game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 150; // milliseconds per frame
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }
    
    setupCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();
        
        // Set canvas size to fill the container
        this.width = containerRect.width;
        this.height = containerRect.height;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Adjust grid size for mobile
        if (this.width < 500) {
            this.gridSize = 15;
        } else {
            this.gridSize = 20;
        }
        
        // Show mobile controls and swipe area on touch devices
        const mobileControls = document.getElementById('mobileControls');
        const swipeArea = document.getElementById('swipeArea');
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            mobileControls.style.display = 'block';
            swipeArea.style.display = 'block';
        } else {
            mobileControls.style.display = 'none';
            swipeArea.style.display = 'none';
        }
        
        // Force a small delay to ensure proper sizing
        setTimeout(() => {
            const newRect = container.getBoundingClientRect();
            if (newRect.width !== this.width || newRect.height !== this.height) {
                this.setupCanvas();
            }
        }, 100);
    }
    
    setupParticleSlider() {
        const slider = document.getElementById('particleSlider');
        const value = document.getElementById('particleValue');
        
        slider.addEventListener('input', (e) => {
            this.particleIntensity = parseInt(e.target.value);
            value.textContent = this.particleIntensity;
        });
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playMultiToneSound(baseFreq, duration) {
        if (!this.audioContext) return;
        
        const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playSound(freq, duration * 0.3, 'square');
            }, index * 50);
        });
    }
    
    playWaveSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mobile controls
        this.setupMobileControls();
        this.setupSwipeControls();
        
        // Touch controls for start/restart
        document.addEventListener('touchstart', (e) => {
            if (this.gameState === 'start' || this.gameState === 'gameOver') {
                e.preventDefault();
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
        });
    }
    
    setupMobileControls() {
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        
        const addTouchControl = (button, key) => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
            
            // Also support mouse for testing
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
        };
        
        addTouchControl(upBtn, 'ArrowUp');
        addTouchControl(downBtn, 'ArrowDown');
        addTouchControl(leftBtn, 'ArrowLeft');
        addTouchControl(rightBtn, 'ArrowRight');
    }
    
    setupSwipeControls() {
        const swipeArea = document.getElementById('swipeArea');
        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        
        const handleTouchStart = (e) => {
            if (this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isSwiping = true;
        };
        
        const handleTouchMove = (e) => {
            if (!isSwiping || this.gameState !== 'playing') return;
            
            e.preventDefault();
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // Determine swipe direction based on larger delta
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 30 && this.direction.x === 0) {
                    this.nextDirection = {x: 1, y: 0};
                    isSwiping = false;
                } else if (deltaX < -30 && this.direction.x === 0) {
                    this.nextDirection = {x: -1, y: 0};
                    isSwiping = false;
                }
            } else {
                // Vertical swipe
                if (deltaY > 30 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: 1};
                    isSwiping = false;
                } else if (deltaY < -30 && this.direction.y === 0) {
                    this.nextDirection = {x: 0, y: -1};
                    isSwiping = false;
                }
            }
        };
        
        const handleTouchEnd = (e) => {
            isSwiping = false;
        };
        
        swipeArea.addEventListener('touchstart', handleTouchStart, { passive: false });
        swipeArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        swipeArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        this.playMultiToneSound(440, 0.2);
        this.createWaveEffect(this.width/2, this.height/2, 100);
        
        // Reset snake position for new game
        this.snake = [{x: Math.floor(this.width / 2 / this.gridSize) * this.gridSize, y: Math.floor(this.height / 2 / this.gridSize) * this.gridSize}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.food = this.generateFood();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.speed = 1;
        this.snake = [{x: Math.floor(this.width / 2 / this.gridSize) * this.gridSize, y: Math.floor(this.height / 2 / this.gridSize) * this.gridSize}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.food = this.generateFood();
        this.particles = [];
        this.tracers = [];
        this.sparks = [];
        this.waveEffects = [];
        document.getElementById('gameOver').style.display = 'none';
        this.playMultiToneSound(880, 0.2);
        this.createWaveEffect(this.width/2, this.height/2, 150);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
        this.playSound(200, 0.5, 'sawtooth');
        this.createExplosion(this.snake[0].x, this.snake[0].y, 50 * this.particleIntensity);
        this.createSparkStorm(this.snake[0].x, this.snake[0].y, 100 * this.particleIntensity);
        this.playWaveSound();
    }
    
    generateFood() {
        const x = Math.floor(Math.random() * (this.width / this.gridSize)) * this.gridSize;
        const y = Math.floor(Math.random() * (this.height / this.gridSize)) * this.gridSize;
        return {x, y, color: this.getRandomNeonColor()};
    }
    
    getRandomNeonColor() {
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#00ff80', '#8000ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createParticle(x, y, color, velocity, life) {
        return {
            x: x,
            y: y,
            vx: velocity.x,
            vy: velocity.y,
            life: life,
            maxLife: life,
            color: color,
            size: Math.random() * (this.particleIntensity * 2) + 1
        };
    }
    
    createExplosion(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * (this.particleIntensity * 3) + 2;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.particles.push(this.createParticle(x, y, this.getRandomNeonColor(), velocity, 60 + this.particleIntensity * 10));
        }
    }
    
    createSparkStorm(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.sparks.push({
                x: x,
                y: y,
                vx: velocity.x,
                vy: velocity.y,
                life: 40 + this.particleIntensity * 5,
                maxLife: 40 + this.particleIntensity * 5,
                color: this.getRandomNeonColor(),
                size: Math.random() * (this.particleIntensity * 3) + 2
            });
        }
    }
    
    createWaveEffect(x, y, radius) {
        this.waveEffects.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: radius,
            life: 60,
            maxLife: 60,
            color: this.getRandomNeonColor()
        });
    }
    
    createTracer(x, y, color) {
        this.tracers.push({
            x: x,
            y: y,
            life: 30,
            maxLife: 30,
            color: color
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98; // Air resistance
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateSparks() {
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vx *= 0.95;
            spark.vy *= 0.95;
            spark.life--;
            
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }
    
    updateWaveEffects() {
        for (let i = this.waveEffects.length - 1; i >= 0; i--) {
            const wave = this.waveEffects[i];
            wave.radius += wave.maxRadius / wave.maxLife;
            wave.life--;
            
            if (wave.life <= 0) {
                this.waveEffects.splice(i, 1);
            }
        }
    }
    
    updateTracers() {
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const tracer = this.tracers[i];
            tracer.life--;
            
            if (tracer.life <= 0) {
                this.tracers.splice(i, 1);
            }
        }
    }
    
    handleInput() {
        if (this.keys['ArrowUp'] && this.direction.y === 0) {
            this.nextDirection = {x: 0, y: -1};
        } else if (this.keys['ArrowDown'] && this.direction.y === 0) {
            this.nextDirection = {x: 0, y: 1};
        } else if (this.keys['ArrowLeft'] && this.direction.x === 0) {
            this.nextDirection = {x: -1, y: 0};
        } else if (this.keys['ArrowRight'] && this.direction.x === 0) {
            this.nextDirection = {x: 1, y: 0};
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        
        // Update direction
        if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
            this.direction = {...this.nextDirection};
        }
        
        // Move snake
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            const head = {...this.snake[0]};
            head.x += this.direction.x * this.gridSize;
            head.y += this.direction.y * this.gridSize;
            
            // Check boundaries - walls are now deadly
            if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
                this.gameOver();
                return;
            }
            
            // Check collision with self
            for (let segment of this.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    this.gameOver();
                    return;
                }
            }
            
            this.snake.unshift(head);
            
            // Create tracer for head
            this.createTracer(head.x + this.gridSize/2, head.y + this.gridSize/2, '#00ff00');
            
            // Random spark trail
            if (Math.random() < 0.3) {
                this.sparks.push({
                    x: head.x + this.gridSize/2 + (Math.random() - 0.5) * 10,
                    y: head.y + this.gridSize/2 + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 20,
                    maxLife: 20,
                    color: this.getRandomNeonColor(),
                    size: Math.random() * 2 + 1
                });
            }
            
            // Check food collision
            if (head.x === this.food.x && head.y === this.food.y) {
                const oldLevel = this.level;
                this.score += 10 * this.level;
                this.level = Math.floor(this.score / 100) + 1;
                this.speed = Math.min(5, 1 + this.level * 0.5);
                this.food = this.generateFood();
                this.playMultiToneSound(660, 0.15);
                this.createExplosion(this.food.x + this.gridSize/2, this.food.y + this.gridSize/2, 20 * this.particleIntensity);
                this.createSparkStorm(this.food.x + this.gridSize/2, this.food.y + this.gridSize/2, 15 * this.particleIntensity);
                this.createWaveEffect(this.food.x + this.gridSize/2, this.food.y + this.gridSize/2, 50);
                
                // Level up effect
                if (this.level > oldLevel) {
                    this.playMultiToneSound(880, 0.3);
                    this.createWaveEffect(this.width/2, this.height/2, 200);
                    this.createSparkStorm(this.width/2, this.height/2, 50 * this.particleIntensity);
                }
            } else {
                this.snake.pop();
            }
            
            // Update UI
            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.level;
            document.getElementById('speed').textContent = this.speed.toFixed(1);
        }
        
        this.updateParticles();
        this.updateSparks();
        this.updateWaveEffects();
        this.updateTracers();
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const hue = (120 + index * 10) % 360;
            const color = `hsl(${hue}, 100%, 50%)`;
            
            // Main body
            this.ctx.fillStyle = color;
            this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);
            
            // Glow effect
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10 + this.particleIntensity;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(segment.x, segment.y, this.gridSize, this.gridSize);
            this.ctx.shadowBlur = 0;
            
            // Head special effect
            if (index === 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = 15;
                this.ctx.fillRect(segment.x + 5, segment.y + 5, 10, 10);
                this.ctx.shadowBlur = 0;
                
                // Energy aura around head
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 8;
                this.ctx.strokeRect(segment.x - 2, segment.y - 2, this.gridSize + 4, this.gridSize + 4);
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawFood() {
        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        const size = this.gridSize * pulse;
        const offset = (this.gridSize - size) / 2;
        
        this.ctx.fillStyle = this.food.color;
        this.ctx.shadowColor = this.food.color;
        this.ctx.shadowBlur = 15 + this.particleIntensity * 2;
        this.ctx.fillRect(
            this.food.x + offset, 
            this.food.y + offset, 
            size, 
            size
        );
        this.ctx.shadowBlur = 0;
        
        // Orb effect
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.food.x, this.food.y, this.gridSize, this.gridSize);
        
        // Energy field around food
        this.ctx.strokeStyle = this.food.color;
        this.ctx.lineWidth = 1;
        this.ctx.shadowColor = this.food.color;
        this.ctx.shadowBlur = 5;
        this.ctx.strokeRect(this.food.x - 5, this.food.y - 5, this.gridSize + 10, this.gridSize + 10);
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 5 + this.particleIntensity;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawSparks() {
        this.sparks.forEach(spark => {
            const alpha = spark.life / spark.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = spark.color;
            this.ctx.shadowColor = spark.color;
            this.ctx.shadowBlur = 8 + this.particleIntensity * 2;
            this.ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawWaveEffects() {
        this.waveEffects.forEach(wave => {
            const alpha = wave.life / wave.maxLife;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = wave.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawTracers() {
        this.tracers.forEach(tracer => {
            const alpha = tracer.life / tracer.maxLife;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.fillStyle = tracer.color;
            this.ctx.shadowColor = tracer.color;
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(tracer.x - 2, tracer.y - 2, 4, 4);
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawGrid() {
        // Animated grid with color cycling
        const time = Date.now() * 0.001;
        const hue = (time * 30) % 360;
        const gridColor = `hsla(${hue}, 50%, 20%, 0.3)`;
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Add some scanlines for retro effect
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw game elements
        this.drawTracers();
        this.drawWaveEffects();
        this.drawParticles();
        this.drawSparks();
        this.drawFood();
        this.drawSnake();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.timeStep / this.speed) {
            this.update();
            this.accumulator -= this.timeStep / this.speed;
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new NeonSnake();
});
