export default class SliderTestimonials extends BaseComponent {
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
				keyboard: false,
				controls: true,
				direction: 'horizontal',
				loop: true,
				autoplay: 8,
				transitionDuration: 1.2
			},
			// Component inner elements
			innerElements: {
				container: '.slider-testimonials__container',
				sections: '.js-slider-testimonials__section',
				subheadings: '.js-slider-testimonials__item-subheading',
				headings: '.js-slider-testimonials__item-heading',
				texts: '.js-slider-testimonials__item-text',
				circles: '.js-slider-testimonials__dot circle',
				dots: '.js-slider-testimonials__dots',
				arrows: '.js-slider-testimonials__arrow',
				arrowsInner: '.slider-arrow__inner',
			}
		});

		this._handlers = {
			autoplayStart: this._onAutoplayStart.bind(this),
			autoplayStop: this._onAutoplayStop.bind(this),
			autoplayPause: this._onAutoplayPause.bind(this),
			autoplayResume: this._onAutoplayResume.bind(this),
			sectionChange: this._onSectionChange.bind(this),
			animationOut: this._onAnimationOut.bind(this),
			transitionStart: this._onTransitionStart.bind(this),
			retranslate: this._retranslate.bind(this),
			resize: app.utilities.debounce(this._onResize.bind(this), app.utilities.getDebounceTime())
		};

		this.dotsTL = gsap.timeline();
		this._lastResizeWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

		this.setup();
	}

	init() {
		const options = {
			init: false,
			interaction: false,
			keyboard: this.options.keyboard,
			controls: this.options.controls,
			animation: false,
			direction: this.options.direction,
			loop: this.options.loop,
			autoplay: typeof this.options.autoplay === 'number' ? {
				autoInit: false,
				duration: this.options.autoplay
			} : false,
			sectionElementsSelector: this.innerSelectors.sections,
			controlsPrevSelector: '[data-arts-fullpage-slider-arrow="prev"]',
			controlsNextSelector: '[data-arts-fullpage-slider-arrow="next"]',
			indicatorsSelector: '[data-arts-fullpage-slider-indicator]',
			matchMedia: false,
			animationOut: this._handlers.animationOut
		};

		this.slider = new ArtsFullpageSlider(this.element, options);
		this.slider.update();

		this._setSlides();
		this._setDots();

		this._attachEvents();
		this.slider.init();

		if (!!this.options.autoplay && !this._hasAnimationScene()) {
			this.slider.autoplay.init();
		}
	}

	destroy() {
		this._detachEvents();
		this.slider.destroy();
	}

	prepareAnimation() {
		return new Promise((resolve) => {
			const tl = gsap.timeline({
				defaults: {
					duration: 0
				},
				onComplete: () => {
					resolve(true);
				}
			});

			if (this.elements.arrowsInner[0]) {
				tl.set(this.elements.arrowsInner[0], {
					autoAlpha: 0,
					x: -30
				});
			}

			if (this.elements.arrowsInner[1]) {
				tl.set(this.elements.arrowsInner[1], {
					autoAlpha: 0,
					x: 30
				});
			}

		});
	}

	// Remove default text animation
	_getRevealTextAnimation() {

	}

	getRevealAnimation() {
		const tl = gsap.timeline({
			paused: true,
			onComplete: () => {
				if (!!this.options.autoplay) {
					this.slider.autoplay.init();
				}
			}
		}),
			firstSubheading = this.elements.sections[0].querySelectorAll(this.innerSelectors.subheadings),
			firstHeading = this.elements.sections[0].querySelectorAll(this.innerSelectors.headings),
			firstText = this.elements.sections[0].querySelectorAll(this.innerSelectors.texts);

		if (firstHeading) {
			tl.animateChars(firstHeading, {
				duration: 1.2,
				stagger: {
					from: 'start',
					amount: .3
				}
			}, '<');
		}

		if (firstText) {
			tl.animateLines(firstText, {
				duration: 1.2,
				stagger: 0.08
			}, '<');
		}

		if (firstSubheading) {
			tl.animateLines(firstSubheading, {
				duration: 1.2,
				stagger: 0.08
			}, '<');
		}

		if (this.elements.arrowsInner.length) {
			this.elements.arrowsInner.forEach((el, index) => {
				tl.to(el, {
					autoAlpha: 1,
					x: '0%',
					scaleX: 1,
					scaleY: 1,
					duration: 0.6,
					ease: 'power3.out',
					onComplete: () => {
						gsap.set(el, {
							clearProps: 'opacity,visibility,transform'
						});
					}
				}, index === 0 ? '<30%' : `<20%`);
			});
		}

		return tl;
	}

	_attachEvents() {
		if (!!this.options.autoplay) {
			this.slider
				.on('autoplayStart', this._handlers.autoplayStart)
				.on('autoplayStop', this._handlers.autoplayStop)
				.on('autoplayPause', this._handlers.autoplayPause)
				.on('autoplayResume', this._handlers.autoplayResume);

			document.addEventListener('arts/barba/transition/start', this._handlers.transitionStart, {
				once: true
			});
		}

		this.slider.on('sectionChange', this._handlers.sectionChange);
		window.addEventListener('resize', this._handlers.resize);
		window.addEventListener('i18n:languageChange', this._handlers.retranslate);
	}

	_detachEvents() {
		if (!!this.options.autoplay) {
			this.slider
				.off('autoplayStart', this._handlers.autoplayStart)
				.off('autoplayStop', this._handlers.autoplayStop)
				.off('autoplayPause', this._handlers.autoplayPause)
				.off('autoplayResume', this._handlers.autoplayResume);
		}

		this.slider.off('sectionChange', this._handlers.sectionChange);
		window.removeEventListener('resize', this._handlers.resize);
		window.removeEventListener('i18n:languageChange', this._handlers.retranslate);
	}

	_onAutoplayStart() {
		this.dotsTL.play();
		this._animateDot({
			toIndex: this.slider.currentIndex
		});
	}

	_onAutoplayStop() {
	}

	_onAutoplayPause() {
		this.dotsTL.pause();
	}

	_onAutoplayResume() {
		this.dotsTL.play();
	}

	_onSectionChange() {
		this._animateDot({
			fromIndex: this.slider.prevIndex,
			toIndex: typeof this.options.autoplay === 'number' ? undefined : this.slider.currentIndex
		});
	}

	_setDots() {
		gsap.set(this.elements.circles, {
			rotate: 0,
			transformOrigin: 'center center',
			drawSVG: '0% 0%'
		});

		// Initial set for 1st slide dot
		if (!this.options.autoplay) {
			gsap.set(this.elements.circles[0], {
				transformOrigin: 'center center',
				drawSVG: '0% 100%'
			});
		}
	}

	_animateDot({
		fromIndex,
		toIndex
	}) {
		this.dotsTL.clear();

		let duration = this.options.transitionDuration * 2;
		const hasAutoplay = typeof this.options.autoplay === 'number';

		if (hasAutoplay) {
			duration = this.options.autoplay;
		} else {
			this.dotsTL.play();
		}

		if (typeof fromIndex === 'number') {
			this.dotsTL.to(this.elements.circles, {
				duration: this.options.transitionDuration / 2,
				rotate: 180,
				transformOrigin: 'center center',
				drawSVG: '100% 100%',
				ease: 'power3.inOut'
			}, 'start');
		}

		if (typeof toIndex === 'number') {
			this.dotsTL.fromTo(this.elements.circles[toIndex], {
				rotate: 0,
				transformOrigin: 'center center',
				drawSVG: '0% 0%',
			}, {
				rotate: 180,
				transformOrigin: 'center center',
				duration,
				drawSVG: '0% 100%',
				ease: hasAutoplay ? 'none' : 'power3.inOut',
			}, 'start');
		}
	}

	_setSection(target, visible = true) {
		const tl = gsap.timeline();

		if (target) {
			tl.set(target, {
				autoAlpha: visible ? 1 : 0
			});
		}

		return tl;
	}

	_lockInteraction(lock = false) {
		this.element.classList.toggle('locked', lock);
	}

	_toggleInteractivity(enabled = true) {
		if (this.slider) {
			if (enabled) {
				this.slider.interaction.enable();
			} else {
				this.slider.interaction.disable();
			}
		}
	}

	_setSlides() {
		const hasAnimationScene = this._hasAnimationScene();

		this._setPosition();
		this._setContent(hasAnimationScene);
	}

	_setPosition() {
		gsap.set(this.elements.container, {
			height: this.elements.sections[0].offsetHeight
		});

		gsap.set(this.elements.sections, {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0
		});

		ScrollTrigger.refresh(true);
	}

	_setContent(hasAnimationScene) {
		this.elements.sections.forEach((section, index) => {
			const
				isFirstSection = index === 0,
				currentSubheading = section.querySelectorAll(this.innerSelectors.subheadings),
				currentHeading = section.querySelectorAll(this.innerSelectors.headings),
				currentText = section.querySelectorAll(this.innerSelectors.texts);

			// Hide inactive slides at the section level (not only via the
			// split-text line transforms). Slide transitions already toggle
			// autoAlpha, so this stays consistent — but it also means a later
			// text swap (e.g. an i18n language change) that removes the split
			// lines can't expose the hidden slides, avoiding overlapping text.
			gsap.set(section, {
				autoAlpha: isFirstSection ? 1 : 0
			});

			if (isFirstSection && !hasAnimationScene) {
				gsap.effects.animateLines(currentSubheading, {
					duration: 0,
					stagger: false
				});

				gsap.effects.animateChars(currentHeading, {
					duration: 0,
					stagger: false
				});

				gsap.effects.animateLines(currentText, {
					duration: 0,
					stagger: false
				});
			} else {
				gsap.effects.hideLines(currentSubheading, {
					duration: 0,
					y: '100%',
					stagger: false
				});

				gsap.effects.hideChars(currentHeading, {
					duration: 0,
					y: '100%',
					stagger: false
				});

				gsap.effects.hideLines(currentText, {
					duration: 0,
					y: '100%',
					stagger: 0
				});
			}
		});
	}

	_retranslate() {
		if (!this.slider) {
			return;
		}

		const current = this.slider.currentIndex;

		if (typeof this.destroySplitText === 'function') {
			this.destroySplitText();
		}

		const i18n = window.i18n;

		if (i18n) {
			this.elements.texts.forEach((el) => {
				const key = el.getAttribute('data-i18n');

				if (!key) {
					return;
				}

				const translation = i18n.t(key);
				const escaped = String(translation)
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');

				el.innerHTML = '<div class="h5">' + escaped + '</div>';
			});
		}

		if (typeof this._initSplitText === 'function') {
			this._initSplitText();
		}

		this.elements.sections.forEach((section, index) => {
			const
				isCurrentSection = index === current,
				currentSubheading = section.querySelectorAll(this.innerSelectors.subheadings),
				currentHeading = section.querySelectorAll(this.innerSelectors.headings),
				currentText = section.querySelectorAll(this.innerSelectors.texts);

			gsap.set(section, {
				autoAlpha: isCurrentSection ? 1 : 0
			});

			if (isCurrentSection) {
				gsap.effects.animateLines(currentSubheading, {
					duration: 0,
					stagger: false
				});

				gsap.effects.animateChars(currentHeading, {
					duration: 0,
					stagger: false
				});

				gsap.effects.animateLines(currentText, {
					duration: 0,
					stagger: false
				});
			} else {
				gsap.effects.hideLines(currentSubheading, {
					duration: 0,
					y: '100%',
					stagger: false
				});

				gsap.effects.hideChars(currentHeading, {
					duration: 0,
					y: '100%',
					stagger: false
				});

				gsap.effects.hideLines(currentText, {
					duration: 0,
					y: '100%',
					stagger: 0
				});
			}
		});
	}

	_onAnimationOut(currentSection, targetSection, direction) {
		const
			currentSubheading = currentSection.querySelectorAll(this.innerSelectors.subheadings),
			currentHeading = currentSection.querySelectorAll(this.innerSelectors.headings),
			currentText = currentSection.querySelectorAll(this.innerSelectors.texts),

			nextSubheading = targetSection.querySelectorAll(this.innerSelectors.subheadings),
			nextHeading = targetSection.querySelectorAll(this.innerSelectors.headings),
			nextText = targetSection.querySelectorAll(this.innerSelectors.texts);

		const args = {
			current: {
				section: currentSection,
				subheading: currentSubheading,
				heading: currentHeading,
				text: currentText,
			},
			target: {
				section: targetSection,
				subheading: nextSubheading,
				heading: nextHeading,
				text: nextText,
			},
			direction
		};

		return this._getTimelineTransition(args);
	}

	_getTimelineTransition({
		current = {
			section,
			subheading,
			heading,
			text
		} = {},
		target = {
			section,
			subheading,
			heading,
			text
		} = {},
		direction
	}) {
		const tl = gsap.timeline();

		tl
			.add(() => this._lockInteraction(true))
			.add(this._setSection(target.section, true))
			.add(this._animateSlideContentOut(0, direction === 'next' ? 'prev' : 'next', target))
			.add(this._animateSlideContentOut(this.options.transitionDuration, direction, current))

		tl
			.add(this._adjustSlideHeight(target.section), '<')
			.add(this._animateSlideContentIn(this.options.transitionDuration, direction, target), '<66%')
			.add(() => this._lockInteraction(false))
			.add(this._setSection(current.section, false));

		return tl;
	}

	_adjustSlideHeight(target, duration = this.options.transitionDuration / 2) {
		const tl = gsap.timeline({
			onComplete: () => {
				ScrollTrigger.refresh(true);
			}
		});

		if (duration > 0) {
			tl.to(this.elements.container, {
				height: target.offsetHeight,
				duration
			});
		} else {
			tl.set(this.elements.container, {
				height: target.offsetHeight,
			});
		}

		return tl;
	}

	_animateSlideContentOut(duration = this.options.transitionDuration, direction = 'next', {
		subheading,
		heading,
		text
	}) {
		const
			ease = 'expo.out',
			tl = gsap.timeline(),
			isNextDirection = direction === 'next';

		// Animate out section subheading
		if (subheading) {
			tl.hideLines(subheading, {
				y: isNextDirection ? '-100%' : '100%',
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 10
				}
			}, 'start');
		}

		// Animate out section heading
		if (heading) {
			tl.hideChars(heading, {
				y: isNextDirection ? '-100%' : '100%',
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 3
				}
			}, 'start');
		}

		// Animate out section text
		if (text) {
			tl.hideLines(text, {
				y: isNextDirection ? '-100%' : '100%',
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 10
				}
			}, 'start');
		}

		return tl;
	}

	_animateSlideContentIn(duration = this.options.transitionDuration, direction = 'next', {
		subheading,
		heading,
		text
	}) {
		const
			ease = 'expo.out',
			tl = gsap.timeline(),
			isNextDirection = direction === 'next';

		// Animate in section subheading
		if (subheading) {
			tl.animateLines(subheading, {
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 10
				}
			}, 'start');
		}

		// Animate in section heading
		if (heading) {
			tl.animateChars(heading, {
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 3
				}
			}, 'start');
		}

		// Animate in section text
		if (text) {
			tl.animateLines(text, {
				duration,
				ease,
				stagger: {
					from: isNextDirection ? 'start' : 'end',
					amount: duration / 10
				}
			}, 'start');
		}

		return tl;
	}

	_onResize() {
		const width = window.innerWidth;
		// Ignore mobile browser chrome height-only resizes (scroll jump at page bottom).
		if (this._lastResizeWidth === width) {
			return;
		}
		this._lastResizeWidth = width;

		const currentIndex = this.slider.currentIndex;

		this._adjustSlideHeight(this.elements.sections[currentIndex], 0);
	}

	_onTransitionStart() {
		if (!!this.options.autoplay) {
			this._handlers.autoplayPause();
			this.slider.autoplay.disable();
		}
	}
}
