export default class RotatingButton extends BaseComponent {
  constructor({
    name,
    loadInnerComponents,
    parent,
    element,
  }) {
    super({
      name,
      loadInnerComponents,
      parent,
      element,
      // Component default options
      defaults: {
        rotateAnimation: {
          onScrollSpeed: 2
        },
        delimiter: '&nbsp;&nbsp;→&nbsp;&nbsp;',
        loopRounds: 2
      },
      // Component inner elements
      innerElements: {
        link: '.js-rotating-button__link',
        label: '.js-rotating-button__label',
        icon: '.js-rotating-button__icon'
      }
    });

    this._handlers = {
      displayInit: app.utilities.debounce(this._onDisplayInit.bind(this), app.utilities.getDebounceTime())
    };

    this.mq = null;
    this.originalLabel = '';
    this.clamp = gsap.utils.clamp(1, 10);

    this.setup();
  }

  init() {
    if (this.element.offsetParent) {
      this._doInit();
    } else {
      this.mq = app.utilities.attachResponsiveResize({
        callback: this._handlers.displayInit
      });
    }
  }

  destroy() {
    this._detachEvents();
    this.resizeInstance = null;
  }

  _onDisplayInit() {
    if (this.element.offsetParent) {
      if (this.mq && typeof this.mq.clear === 'function') {
        this.mq.clear();
      }

      this._doInit();
    }
  }

  _doInit() {
    if (!this.elements.label || !this.elements.label[0]) {
      return;
    }
    this._addDelimiter();
    this._loopLabel();
    this._createCircle();
    this._attachEvents();
  }

  getScrubAnimation() {
    if (!this.options.rotateAnimation || !this.elements.label?.[0] || !this.elements.icon?.[0]) {
      return;
    }

    const animation = gsap.timeline({
      paused: true,
      defaults: {
        ease: 'none',
        repeat: -1
      }
    })
      .to(this.elements.label[0], {
        rotate: 360,
        duration: 30
      }, 'start')
      .to(this.elements.icon[0], {
        rotate: -360,
        duration: 10
      }, 'start');

    const config = {
      animation,
      trigger: this.element,
      once: false,
      onToggle: (self) => {
        if (self.isActive) {
          animation.play();
        } else {
          animation.pause();
        }
      }
    };

    if (typeof this.options.rotateAnimation.onScrollSpeed === 'number') {
      const proxy = {
        velocity: 1
      };

      const velocityWatcher = ScrollTrigger.getById('velocityWatcher');

      config['onUpdate'] = () => {
        let velocity = this.clamp(Math.abs(velocityWatcher.getVelocity()) / 100) * this.options.rotateAnimation.onScrollSpeed;

        if (velocity > proxy.velocity) {
          proxy.velocity = velocity;

          gsap.to(proxy, {
            velocity: 1,
            duration: 0.6,
            ease: 'power3.out',
            overwrite: true,
            onUpdate: () => {
              animation.timeScale(proxy.velocity);
            }
          });
        }

      };
    }

    return config;
  }

  getRevealAnimation() {
    if (!this.elements.icon?.[0]) {
      return;
    }
    const tl = gsap.timeline({
      paused: true
    })
      .animateScale(this.elements.icon, {
        ease: 'power3.out',
        animateFrom: 'center'
      }, '<');

    return tl;
  }

  _addDelimiter() {
    this.originalLabel = this.elements.label[0].innerHTML;

    if (this.options.delimiter) {
      this.elements.label[0].innerHTML += this.options.delimiter;
    }

    this.label = this.elements.label[0].innerHTML;
  }

  _loopLabel() {
    if (this.options.loopRounds > 0) {
      for (let index = 0; index < this.options.loopRounds; index++) {
        this.elements.label[0].innerHTML += this.label;
      }
    }
  }

  _createCircle() {
    this.circleInstance = new CircleType(this.elements.label[0]);
    this.elements.label[0].setAttribute('aria-label', this.label);
  }

  _setSize() {
    const size = this.elements.label[0].offsetHeight;

    this.elements.link[0].style.width = `${size}px`;
    this.elements.link[0].style.height = `${size}px`;

    if (this.stScrub) {
      this.stScrub.refresh();
    }
  }

  _attachEvents() {
    if (!this.elements.label?.[0] || !app.containerEl) {
      return;
    }
    this.resizeInstance = new ResizeObserver(this._onUpdate.bind(this));
    this.resizeInstance.observe(this.elements.label[0]);
    this.resizeInstance.observe(app.containerEl);
  }

  _onUpdate() {
    if (!this.elements.label?.[0] || !this.circleInstance) {
      return;
    }
    this._setSize();
    this.circleInstance.refresh();
  }

  _detachEvents() {
    if (this.resizeInstance && typeof this.resizeInstance.disconnect === 'function') {
      this.resizeInstance.disconnect();
    }
  }
}
