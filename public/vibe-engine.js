/**
 * VibeEngine v3.0 - The Complete SDK
 * Pre-injected runtime for VibeCanvas H5 artifacts
 * 
 * Dependencies (CDN loaded):
 * - PixiJS v8
 * - Three.js r128
 * - GSAP
 * - Howler.js
 */

(function() {
  'use strict';

  // Global Vibe namespace
  window.Vibe = {
    // Core state
    _mode: null,
    _pixiApp: null,
    _threeScene: null,
    _threeCamera: null,
    _threeRenderer: null,
    _audioContext: {},
    _state: {},

    /**
     * Initialize VibeEngine
     * @param {Object} config - { mode: '2d'|'3d', bgColor: string }
     */
    init: function(config) {
      this._mode = config.mode || '2d';
      const bgColor = config.bgColor || '#000000';

      if (this._mode === '2d') {
        this._init2D(bgColor);
      } else if (this._mode === '3d') {
        this._init3D(bgColor);
      }

      // Set up touch event handling
      this._setupTouchEvents();
      
      console.log(`[VibeEngine] Initialized in ${this._mode} mode`);
    },

    _init2D: function(bgColor) {
      const app = new PIXI.Application();
      app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: bgColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      }).then(() => {
        document.body.appendChild(app.canvas);
        this._pixiApp = app;
        
        // Handle resize
        window.addEventListener('resize', () => {
          app.renderer.resize(window.innerWidth, window.innerHeight);
        });
      });
    },

    _init3D: function(bgColor) {
      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bgColor);
      this._threeScene = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      this._threeCamera = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(renderer.domElement);
      this._threeRenderer = renderer;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Add default ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
    },

    _setupTouchEvents: function() {
      // Convert touch to pointer events for compatibility
      document.body.addEventListener('touchstart', (e) => {
        e.preventDefault();
      }, { passive: false });
    },

    /**
     * Utility: Delay
     */
    delay: function(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Emit event to parent (React Host)
     */
    emit: function(event, data) {
      parent.postMessage({ type: 'VIBE_EVENT', event, data }, '*');
    },

    // ==================== AUDIO ====================
    playBGM: function(url, volume = 0.5) {
      if (this._audioContext.bgm) {
        this._audioContext.bgm.stop();
      }
      const sound = new Howl({
        src: [url],
        loop: true,
        volume: volume
      });
      sound.play();
      this._audioContext.bgm = sound;
    },

    playSFX: function(url, volume = 0.8) {
      const sound = new Howl({
        src: [url],
        volume: volume
      });
      sound.play();
    },

    // ==================== NARRATIVE SYSTEM ====================
    showDialog: function(speaker, text) {
      return new Promise((resolve) => {
        const ui = document.getElementById('ui');
        const dialog = document.createElement('div');
        dialog.style.cssText = `
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 20px;
          border-radius: 12px;
          font-family: sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        dialog.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; color: #ffd700;">${speaker}</div>
          <div style="line-height: 1.6;">${text}</div>
          <div style="text-align: right; margin-top: 12px; font-size: 12px; color: #999;">轻触继续...</div>
        `;
        
        ui.appendChild(dialog);
        
        const dismiss = () => {
          dialog.remove();
          resolve();
        };
        
        dialog.addEventListener('touchend', dismiss);
        setTimeout(() => {
          dialog.addEventListener('click', dismiss);
        }, 100);
      });
    },

    showChoices: function(choices) {
      return new Promise((resolve) => {
        const ui = document.getElementById('ui');
        const container = document.createElement('div');
        container.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 400px;
        `;
        
        choices.forEach(choice => {
          const btn = document.createElement('button');
          btn.textContent = choice.text;
          btn.style.cssText = `
            display: block;
            width: 100%;
            padding: 16px;
            margin: 12px 0;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          `;
          
          btn.addEventListener('touchend', (e) => {
            e.stopPropagation();
            container.remove();
            resolve(choice.id);
          });
          
          container.appendChild(btn);
        });
        
        ui.appendChild(container);
      });
    },

    showToast: function(text) {
      const ui = document.getElementById('ui');
      const toast = document.createElement('div');
      toast.textContent = text;
      toast.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
      `;
      ui.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    },

    // ==================== 2D ENGINE (PixiJS) ====================
    spawnRect: function(x, y, width, height, color) {
      const rect = new PIXI.Graphics();
      rect.beginFill(color);
      rect.drawRect(0, 0, width, height);
      rect.endFill();
      rect.x = x;
      rect.y = y;
      this._pixiApp.stage.addChild(rect);
      return rect;
    },

    spawnCircle: function(x, y, radius, color) {
      const circle = new PIXI.Graphics();
      circle.beginFill(color);
      circle.drawCircle(0, 0, radius);
      circle.endFill();
      circle.x = x;
      circle.y = y;
      this._pixiApp.stage.addChild(circle);
      return circle;
    },

    spawnShape: function(x, y, size, color, shape = 'rect') {
      if (shape === 'circle') {
        return this.spawnCircle(x, y, size / 2, color);
      }
      return this.spawnRect(x, y, size, size, color);
    },

    spawnSprite: function(url, x, y, width, height) {
      const sprite = PIXI.Sprite.from(url);
      sprite.x = x;
      sprite.y = y;
      if (width) sprite.width = width;
      if (height) sprite.height = height;
      this._pixiApp.stage.addChild(sprite);
      return sprite;
    },

    spawnText: function(text, x, y, style = {}) {
      const textObj = new PIXI.Text(text, {
        fontSize: style.fontSize || 24,
        fill: style.color || '#ffffff',
        ...style
      });
      textObj.x = x;
      textObj.y = y;
      this._pixiApp.stage.addChild(textObj);
      return textObj;
    },

    moveTo2D: function(obj, x, y, duration = 1) {
      gsap.to(obj, { x, y, duration, ease: 'power2.out' });
    },

    rotateTo2D: function(obj, rotation, duration = 1) {
      gsap.to(obj, { rotation, duration, ease: 'power2.out' });
    },

    scaleTo2D: function(obj, scale, duration = 1) {
      gsap.to(obj.scale, { x: scale, y: scale, duration, ease: 'elastic.out(1, 0.3)' });
    },

    set2DTint: function(obj, color) {
      obj.tint = color;
    },

    set2DAlpha: function(obj, alpha) {
      obj.alpha = alpha;
    },

    hide2D: function(obj) {
      obj.visible = false;
    },

    bringToFront: function(obj) {
      this._pixiApp.stage.removeChild(obj);
      this._pixiApp.stage.addChild(obj);
    },

    makeDraggable: function(obj, onEnd) {
      obj.interactive = true;
      obj.buttonMode = true;
      
      let dragging = false;
      let offset = { x: 0, y: 0 };
      
      obj.on('pointerdown', (e) => {
        dragging = true;
        offset.x = e.data.global.x - obj.x;
        offset.y = e.data.global.y - obj.y;
      });
      
      obj.on('pointermove', (e) => {
        if (dragging) {
          obj.x = e.data.global.x - offset.x;
          obj.y = e.data.global.y - offset.y;
        }
      });
      
      obj.on('pointerup', () => {
        dragging = false;
        if (onEnd) onEnd(obj);
      });
    },

    addGravity: function(obj, gravity = 0.5, bounce = 0.8) {
      let velocityY = 0;
      const ground = window.innerHeight - 50;
      
      this._pixiApp.ticker.add(() => {
        velocityY += gravity;
        obj.y += velocityY;
        
        if (obj.y >= ground) {
          obj.y = ground;
          velocityY *= -bounce;
        }
      });
    },

    orbit2D: function(obj, centerX, centerY, radius, speed) {
      let angle = 0;
      this._pixiApp.ticker.add(() => {
        angle += speed;
        obj.x = centerX + Math.cos(angle) * radius;
        obj.y = centerY + Math.sin(angle) * radius;
      });
    },

    // 2D VFX
    fxPopIn: function(obj) {
      obj.scale.set(0);
      gsap.to(obj.scale, { x: 1, y: 1, duration: 0.5, ease: 'back.out(2)' });
    },

    fxFloat: function(obj) {
      gsap.to(obj, { 
        y: obj.y - 20, 
        duration: 1.5, 
        repeat: -1, 
        yoyo: true, 
        ease: 'sine.inOut' 
      });
    },

    fxPulse: function(obj) {
      gsap.to(obj.scale, { 
        x: 1.1, 
        y: 1.1, 
        duration: 0.8, 
        repeat: -1, 
        yoyo: true, 
        ease: 'sine.inOut' 
      });
    },

    fxExplode: function(x, y, color) {
      for (let i = 0; i < 20; i++) {
        const particle = this.spawnCircle(x, y, 5, color);
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 150 + 50;
        
        gsap.to(particle, {
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          duration: 1,
          ease: 'power2.out',
          onComplete: () => particle.destroy()
        });
      }
    },

    fxShake2D: function() {
      const stage = this._pixiApp.stage;
      const originalX = stage.x;
      const originalY = stage.y;
      
      gsap.to(stage, {
        x: originalX + 10,
        y: originalY + 10,
        duration: 0.05,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          stage.x = originalX;
          stage.y = originalY;
        }
      });
    },

    // ==================== 3D ENGINE (Three.js) ====================
    spawn3DBox: function(x, y, z, size, color) {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this._threeScene.add(mesh);
      return mesh;
    },

    spawn3DSphere: function(x, y, z, radius, color) {
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this._threeScene.add(mesh);
      return mesh;
    },

    spawn3DPlane: function(x, y, z, width, height, color) {
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this._threeScene.add(mesh);
      return mesh;
    },

    spawn3DCylinder: function(x, y, z, radius, height, color) {
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this._threeScene.add(mesh);
      return mesh;
    },

    spawn3DTorus: function(x, y, z, radius, tube, color) {
      const geometry = new THREE.TorusGeometry(radius, tube, 16, 100);
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this._threeScene.add(mesh);
      return mesh;
    },

    add3DAmbientLight: function(color, intensity) {
      const light = new THREE.AmbientLight(color, intensity);
      this._threeScene.add(light);
      return light;
    },

    add3DDirectionalLight: function(color, intensity, x, y, z) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      this._threeScene.add(light);
      return light;
    },

    add3DPointLight: function(color, intensity, x, y, z) {
      const light = new THREE.PointLight(color, intensity);
      light.position.set(x, y, z);
      this._threeScene.add(light);
      return light;
    },

    set3DFog: function(color, near = 1, far = 100) {
      this._threeScene.fog = new THREE.Fog(color, near, far);
    },

    set3DBackgroundColor: function(color) {
      this._threeScene.background = new THREE.Color(color);
    },

    move3DTo: function(mesh, x, y, z, duration = 1) {
      gsap.to(mesh.position, { x, y, z, duration, ease: 'power2.out' });
    },

    rotate3DTo: function(mesh, x, y, z, duration = 1) {
      gsap.to(mesh.rotation, { x, y, z, duration, ease: 'power2.out' });
    },

    scale3DTo: function(mesh, scale, duration = 1) {
      gsap.to(mesh.scale, { 
        x: scale, 
        y: scale, 
        z: scale, 
        duration, 
        ease: 'elastic.out(1, 0.3)' 
      });
    },

    lookAt3D: function(mesh, x, y, z) {
      mesh.lookAt(new THREE.Vector3(x, y, z));
    },

    make3DInteractive: function(mesh, onClick) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      const onTouch = (event) => {
        const touch = event.touches[0] || event.changedTouches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this._threeCamera);
        const intersects = raycaster.intersectObject(mesh);
        
        if (intersects.length > 0) {
          onClick(mesh);
        }
      };
      
      document.addEventListener('touchend', onTouch);
    },

    add3DSpin: function(mesh, speedX = 0.01, speedY = 0.01) {
      const animate = () => {
        mesh.rotation.x += speedX;
        mesh.rotation.y += speedY;
        requestAnimationFrame(animate);
      };
      animate();
    },

    orbit3D: function(mesh, centerX, centerZ, radius, speed) {
      let angle = 0;
      const animate = () => {
        angle += speed;
        mesh.position.x = centerX + Math.cos(angle) * radius;
        mesh.position.z = centerZ + Math.sin(angle) * radius;
        requestAnimationFrame(animate);
      };
      animate();
    },

    // 3D VFX
    fx3DFloat: function(mesh) {
      gsap.to(mesh.position, { 
        y: mesh.position.y + 0.5, 
        duration: 1.5, 
        repeat: -1, 
        yoyo: true, 
        ease: 'sine.inOut' 
      });
    },

    fx3DBounce: function(mesh) {
      gsap.to(mesh.scale, { 
        y: 1.2, 
        duration: 0.5, 
        repeat: -1, 
        yoyo: true, 
        ease: 'sine.inOut' 
      });
    },

    add3DParticles: function(color, count = 100) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      for (let i = 0; i < count; i++) {
        positions.push(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color, size: 0.1 });
      const particles = new THREE.Points(geometry, material);
      this._threeScene.add(particles);
      return particles;
    },

    fx3DShakeCamera: function() {
      const camera = this._threeCamera;
      const originalX = camera.position.x;
      const originalY = camera.position.y;
      
      gsap.to(camera.position, {
        x: originalX + 0.2,
        y: originalY + 0.2,
        duration: 0.05,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          camera.position.x = originalX;
          camera.position.y = originalY;
        }
      });
    }
  };

  console.log('[VibeEngine v3.0] SDK loaded and ready');
})();
