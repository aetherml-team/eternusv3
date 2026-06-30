class Animations {
	constructor({ duration } = {
		duration: 1.2
	}) {
		this.defaults = {
			duration
		};
		this.splitTextPresets = {
			'sliderLines': {
				init: true,
				type: 'lines',
				wrap: 'lines',
				set: false
			},
			'sliderChars': {
				type: 'lines,chars',
				wrap: 'chars',
				set: false
			},
			'counterChars': {
				init: true,
				type: 'chars',
				set: false,
				wrap: false
			},
			'animatedLines': {
				init: true,
				type: 'lines',
				set: {
					type: 'lines',
					direction: 'y',
					distance: '103%',
					opacity: false
				},
				wrap: 'lines',
				wrapClass: 'overflow-hidden',
			},
			'overlayMenuItem': {
				init: true,
				type: 'lines',
				set: {
					type: 'lines',
					direction: 'y',
					distance: '-103%',
					opacity: false
				},
				wrap: 'lines',
				wrapClass: 'overflow-hidden',
			},
			'animatedChars': {
				init: true,
				type: 'lines,words,chars',
				set: {
					type: 'chars',
					direction: 'y',
					distance: '103%',
					opacity: false
				},
				wrap: 'lines',
				wrapClass: 'overflow-hidden',
			},
			'animatedCharsRandom': {
				init: true,
				type: 'lines,words,chars',
				set: {
					type: 'chars',
					direction: 'y',
					distance: '103%',
					opacity: 1
				},
				wrap: 'lines',
				wrapClass: 'overflow-hidden',
			},
			'animatedCounterChars': {
				init: true,
				type: 'chars',
				set: {
					type: 'chars',
					direction: 'y',
					distance: '40%',
					opacity: 0
				},
				wrap: false
			},
		};

		this._animateTranslate();

		this._animateScale();

		this._animateMask();
		this._hideMask();

		this._animateCurtain();
		this._hideCurtain();
	}

	_animateTranslate() {
		gsap.registerEffect({
			name: 'animateTranslate',
			effect: (target, config) => {
				const tl = gsap.timeline();

				if (target && target[0]) {
					let
						initialConfig = {},
						targetConfig = {
							xPercent: 0,
							yPercent: 0,
							duration: config.duration,
							ease: config.ease,
							stagger: config.stagger
						};

					switch (config.animateFrom) {
						case 'top':
							initialConfig.yPercent = -100;
							break;
						case 'right':
							initialConfig.xPercent = 100;
							break;
						case 'left':
							initialConfig.xPercent = -100;
							break;
						case 'bottom':
							initialConfig.yPercent = 100;
							break;
					}

					if (typeof config.xPercent === 'number') {
						initialConfig.xPercent = config.xPercent;
					}

					if (typeof config.yPercent === 'number') {
						initialConfig.yPercent = config.yPercent;
					}

					if (!!config.animateOpacity) {
						initialConfig.opacity = 0;
						targetConfig.opacity = 1;
					}

					gsap.set(target, initialConfig);
					tl.to(target, targetConfig);

					if (!!config.clearProps && config.clearProps.length) {
						tl.set(target, {
							clearProps: config.clearProps
						});
					}
				}

				return tl;
			},
			defaults: {
				animateFrom: 'bottom',
				animateOpacity: false,
				animateSkew: false,
				xPercent: false,
				yPercent: false,
				duration: 1.2,
				ease: 'power4.out',
				stagger: 0,
				transformOrigin: 'center center',
				clearProps: 'transform,transformOrigin,opacity'
			},
			extendTimeline: true,
		});
	}

	_animateScale() {
		gsap.registerEffect({
			name: 'animateScale',
			effect: (target, config) => {
				const tl = gsap.timeline();

				if (target && target[0]) {
					let
						initialConfig = {},
						targetConfig = {
							duration: config.duration,
							ease: config.ease,
							stagger: config.stagger
						};

					switch (config.animateFrom) {
						case 'top':
							targetConfig.transformOrigin = 'center top';
							// initialConfig.scaleY = 0;
							targetConfig.scaleY = 1;
							break;
						case 'right':
							targetConfig.transformOrigin = 'right center';
							// initialConfig.scaleX = 0;
							targetConfig.scaleX = 1;
							break;
						case 'left':
							targetConfig.transformOrigin = 'left center';
							// initialConfig.scaleX = 0;
							targetConfig.scaleX = 1;
							break;
						case 'bottom':
							targetConfig.transformOrigin = 'center bottom';
							// initialConfig.scaleY = 0;
							targetConfig.scaleY = 1;
							break;
						case 'center':
							targetConfig.transformOrigin = 'center center';
							// initialConfig.scale = 0;
							targetConfig.scale = 1;
							break;
					}

					if (typeof config.scaleX === 'number') {
						// initialConfig.scaleX = config.scaleX;
						targetConfig.scaleX = 1;
					}

					if (typeof config.scaleY === 'number') {
						// initialConfig.scaleY = config.scaleY;
						targetConfig.scaleY = 1;
					}

					if (typeof config.scale === 'number') {
						// initialConfig.scale = config.scale;
						targetConfig.scale = 1;
					}

					// gsap.set(target, initialConfig);
					tl.to(target, targetConfig);

					if (!!config.clearProps && config.clearProps.length) {
						tl.set(target, {
							clearProps: config.clearProps
						});
					}
				}

				return tl;
			},
			defaults: {
				scaleX: false,
				scaleY: false,
				scale: false,
				animateFrom: 'center',
				duration: 0.6,
				ease: 'power4.out',
				clearProps: 'transform'
			},
			extendTimeline: true
		});
	}

	_animateMask() {
		gsap.registerEffect({
			name: 'animateMask',
			effect: (target, config) => {
				const tl = gsap.timeline({
					onStart: config.onStart,
					onComplete: config.onComplete,
				});

				if (target && target[0]) {
					let initialCP;

					if (config.shape === 'circle') {
						initialCP = `circle(0% at 50% 50%)`;
					} else if (config.shape === 'ellipse') {
						initialCP = `ellipse(50% 0% at 50% 50%)`;
					} else { // rectangle
						switch (config.animateFrom) {
							case 'top':
								initialCP = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
								break;
							case 'right':
								initialCP = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
								break;
							case 'left':
								initialCP = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
								break;
							case 'center':
								initialCP = 'inset(50%)';
								break;
							default:
								initialCP = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
								break;
						}
					}

					if (!!config.clipPathFrom) {
						gsap.set(target, {
							clipPath: initialCP,
							overwrite: config.overwrite
						});
					}

					let innerElement;

					if (typeof config.scaleInner === 'string') {
						innerElement = target[0].querySelector(config.scaleInner);
					}

					if (innerElement && !!config.scale) {
						gsap.set(innerElement, {
							transformOrigin: 'center center',
							scale: config.scale
						});
					}

					let clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

					if (config.animateFrom === 'center') {
						clipPath = `inset(0%)`;
					}

					if (config.shape === 'circle') {
						clipPath = `circle(100% at 50% 50%)`;
					} else if (config.shape === 'ellipse') {
						clipPath = `ellipse(100% 100% at 50% 50%)`;
					}

					tl.to(target, {
						x: config.x,
						y: config.y,
						clipPath,
						duration: config.duration,
						ease: config.ease,
						stagger: config.stagger,
					});

					if (innerElement && !!config.scale) {
						tl.to(innerElement, {
							scale: 1,
							duration: config.duration * 1.25,
							ease: config.ease
						}, '<');
					}

					if (!!config.clearProps && config.clearProps.length) {
						tl.set(target, {
							clearProps: config.clearProps
						});

						if (innerElement && !!config.scale) {
							tl.set(innerElement, {
								clearProps: 'transform'
							});
						}
					}
				}

				return tl;
			},
			defaults: {
				x: undefined,
				y: undefined,
				shape: 'rectangle',
				duration: this.defaults.duration,
				scale: 1.05,
				scaleInner: 'img,video',
				ease: 'expo.inOut',
				stagger: 0,
				animateFrom: 'bottom',
				clearProps: 'clipPath',
				clipPathFrom: true,
				overwrite: true
			},
			extendTimeline: true
		});
	}

	_hideMask() {
		gsap.registerEffect({
			name: 'hideMask',
			effect: (target, config) => {
				const tl = gsap.timeline({
					onStart: config.onStart,
					onComplete: config.onComplete,
				});

				if (target && target[0]) {

					switch (config.animateTo) {
						case 'top':
							config.clipPath = 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)';
							break;
						case 'right':
							config.clipPath = 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
							break;
						case 'left':
							config.clipPath = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
							break;
						case 'center':
							config.clipPath = 'inset(50%)';
							break;
						default:
							config.clipPath = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
							break;
					}

					if (!!config.clipPathFrom) {
						gsap.set(target, {
							clipPath: config.clipPathFrom,
							overwrite: config.overwrite
						});
					}

					let innerElement;

					if (typeof config.scaleInner === 'string') {
						innerElement = target[0].querySelector(config.scaleInner);
					}

					if (typeof config.duration === 'number' && config.duration > 0) {
						tl.to(target, {
							x: config.x,
							y: config.y,
							clipPath: config.clipPath,
							duration: config.duration,
							ease: config.ease,
							stagger: config.stagger
						});

						if (innerElement && !!config.scale) {
							tl.to(innerElement, {
								scale: config.scale,
								duration: config.duration,
								ease: config.ease
							}, '<');
						}

					} else {
						tl.set(target, {
							x: config.x,
							y: config.y,
							clipPath: config.clipPath
						});

						if (innerElement && !!config.scale) {
							tl.set(innerElement, {
								scale: config.scale
							}, '<');
						}
					}

					if (!!config.clearProps && config.clearProps.length) {
						tl.set(target, {
							clearProps: config.clearProps
						});

						if (innerElement && !!config.scale) {
							tl.set(innerElement, {
								clearProps: 'transform'
							});
						}
					}
				}

				return tl;
			},
			defaults: {
				x: undefined,
				y: undefined,
				duration: this.defaults.duration,
				scale: 1.1,
				scaleInner: 'img,video',
				ease: 'expo.inOut',
				animateTo: 'bottom',
				clearProps: 'clipPath',
				clipPathFrom: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
				overwrite: true
			},
			extendTimeline: true,
		});
	}

	_animateCurtain() {
		gsap.registerEffect({
			name: 'animateCurtain',
			effect: (target, config) => {
				if (!app.options.animations.curvedMasks) {
					Object.assign(config, {
						overwrite: false
					});

					return gsap.effects.animateMask(target, config);
				}
				const tl = gsap.timeline({
					onStart: config.onStart,
					onComplete: config.onComplete,
				});
				let shouldForceRepaint = false;

				if (typeof app.options.animations.curvedMasksForceRepaint === 'function') {
					shouldForceRepaint = app.options.animations.curvedMasksForceRepaint();
				} else if (app.options.animations.curvedMasksForceRepaint === 'auto') {
					shouldForceRepaint = typeof window.safari !== 'undefined';
				} else {
					shouldForceRepaint = !!app.options.animations.curvedMasksForceRepaint;
				}

				if (target && target[0]) {
					const
						clipPathTarget = "url('#curtain-clip')",
						clip = document.querySelector('#curtain-clip'),
						path = clip.querySelector('#curtain-clip__path');

					let
						transformOrigin = 'center bottom',
						morphSVGFrom = 'M0,0.5 C0.167,0.167,0.333,0,0.5,0 C0.667,0,0.833,0.167,1,0.5 L1,1 L0,1 L0,0.5',
						morphSVGTo = 'M0,0 C0.167,0,0.333,0,0.5,0 C0.667,0,0.833,0,1,0 L1,1 L0,1 L0,0';

					if (config.animateFrom === 'top') {
						transformOrigin = 'center top';
						morphSVGFrom = 'M0,0 L1,0 L1,0.5 C0.833,0.833,0.667,1,0.5,1 C0.333,1,0.167,0.833,0,0.5 L0,0';
						morphSVGTo = 'M0,0 L1,0 L1,1 C0.833,1,0.667,1,0.5,1 C0.333,1,0.167,1,0,1 L0,0';
					}

					tl
						.set(target[0], {
							clipPath: clipPathTarget,
							inset: '0px'
						})
						.set(path, {
							clearProps: 'all',
						})
						.fromTo(path, {
							morphSVG: morphSVGFrom,
							scaleY: 0,
							transformOrigin,
							immediateRender: true
						}, {
							morphSVG: morphSVGTo,
							scaleY: 1.01,
							transformOrigin,
							ease: config.ease,
							duration: config.duration,
							onUpdate: () => {
								if (shouldForceRepaint) {
									target[0].style.clipPath = 'none';
									target[0].offsetWidth;
									target[0].style.clipPath = "url('#curtain-clip')";
								}
							}
						})
						.set(target[0], {
							clearProps: config.clearProps,
						})
						.set(path, {
							clearProps: 'all',
						});
				}

				return tl;
			},
			defaults: {
				duration: this.defaults.duration,
				ease: 'expo.inOut',
				animateFrom: 'bottom',
				clearProps: 'clipPath,inset'
			},
			extendTimeline: true,
		});
	}

	_hideCurtain() {
		gsap.registerEffect({
			name: 'hideCurtain',
			effect: (target, config) => {
				if (!app.options.animations.curvedMasks) {
					Object.assign(config, {
						overwrite: false
					});

					return gsap.effects.hideMask(target, config);
				}

				const tl = gsap.timeline({
					onStart: config.onStart,
					onComplete: config.onComplete,
				});
				let shouldForceRepaint = false;

				if (typeof app.options.animations.curvedMasksForceRepaint === 'function') {
					shouldForceRepaint = app.options.animations.curvedMasksForceRepaint();
				} else if (app.options.animations.curvedMasksForceRepaint === 'auto') {
					shouldForceRepaint = typeof window.safari !== 'undefined';
				} else {
					shouldForceRepaint = !!app.options.animations.curvedMasksForceRepaint;
				}

				if (target && target[0]) {
					const
						clipPathTarget = "url('#curtain-clip')",
						clip = document.querySelector('#curtain-clip'),
						path = clip.querySelector('#curtain-clip__path');

					let
						transformOrigin = 'center bottom',
						morphSVGTo = 'M0,0.5 C0.167,0.167,0.333,0,0.5,0 C0.667,0,0.833,0.167,1,0.5 L1,1 L0,1 L0,0.5',
						morphSVGFrom = 'M0,0 C0.167,0,0.333,0,0.5,0 C0.667,0,0.833,0,1,0 L1,1 L0,1 L0,0';

					if (config.animateTo === 'top') {
						transformOrigin = 'center top';
						morphSVGTo = 'M0,0 L1,0 L1,0.5 C0.833,0.833,0.667,1,0.5,1 C0.333,1,0.167,0.833,0,0.5 L0,0';
						morphSVGFrom = 'M0,0 L1,0 L1,1 C0.833,1,0.667,1,0.5,1 C0.333,1,0.167,1,0,1 L0,0';
					}

					tl
						.set(target[0], {
							clipPath: clipPathTarget,
							inset: '0px',
						})
						.set(path, {
							clearProps: 'all',
						})
						.fromTo(path, {
							morphSVG: morphSVGFrom,
							scaleY: 1,
							transformOrigin,
							immediateRender: true
						}, {
							morphSVG: morphSVGTo,
							scaleY: 0,
							transformOrigin,
							ease: config.ease,
							duration: config.duration,
							onUpdate: () => {
								if (shouldForceRepaint) {
									target[0].style.clipPath = 'none';
									target[0].offsetWidth;
									target[0].style.clipPath = clipPathTarget;
								}
							}
							// onComplete: config.onComplete
						})
						.set(target[0], {
							clearProps: config.clearProps,
						})
						.set(path, {
							clearProps: 'all',
						});
				}

				return tl;
			},
			defaults: {
				duration: this.defaults.duration,
				ease: 'expo.inOut',
				animateTo: 'top',
				clearProps: 'clipPath,inset',
				onComplete: undefined
			},
			extendTimeline: true,
		});
	}
}

class AssetsManager {
	constructor() {
		this.promises = [];
	}

	load({
		type = undefined, // script | stylesheet
		src = null,
		id = null, // id attribute in DOM
		inline = null,
		preload = false,
		refElement,
		version = null,
		timeout = 30000,
		cache = true,
		cb = null
	}) {
		return new Promise((resolve, reject) => {
			// Don't load asset that is pending to load
			if (cache && id in this.promises) {
				// return existing loading promise
				this.promises[id].then(resolve, reject);
				return;
			}

			// CSS
			if (type === 'style') {
				const stylePromise = this._loadStyle({
					src,
					id,
					inline,
					preload,
					refElement,
					timeout,
					version,
					cb
				});

				this.promises[id] = stylePromise;
				return stylePromise.then(resolve, reject);

			} else if (type === 'script') { // JS
				const scriptPromise = this._loadScript({
					src,
					id,
					inline,
					preload,
					refElement,
					timeout,
					version,
					cb
				});

				this.promises[id] = scriptPromise;

				return scriptPromise.then(resolve, reject);

			} else { // Unknown type
				reject(new TypeError('Resource type "style" or "script" is missing.'));
			}
		});
	}

	_loadScript({
		src = null,
		id = null,
		inline = null,
		preload = false,
		refElement = document.body,
		version = null,
		timeout = 15000,
		cb = null
	}) {
		return new Promise((resolve, reject) => {
			const
				element = document.querySelector(`script[src="${src}"]`),
				head = document.getElementsByTagName('head')[0];

			let script, timer, preloadEl;

			if ((typeof element === 'undefined' || element === null) && !inline) {

				if (src && version) {
					src += `?ver=${version}`;
				}

				if (src && preload) {
					preloadEl = document.createElement('link');
					preloadEl.setAttribute('rel', 'preload');
					preloadEl.setAttribute('href', src);
					preloadEl.setAttribute('as', 'script');
					preloadEl.setAttribute('type', 'text/javascript');
					head.prepend(preloadEl);
				}

				script = document.createElement('script');
				script.setAttribute('type', 'text/javascript');

				if (src) {
					script.setAttribute('async', 'async');
					script.setAttribute('src', src);
					script.setAttribute('crossorigin', 'anonymous');
				}

				if (!id) {
					const timestamp = Math.round(new Date().getTime() / 1000);
					id = `ajax-asset-${timestamp}-js`;
				}

				script.setAttribute('id', id);

				if (typeof inline === 'string' && inline.length) {
					script.innerHTML = inline;
				}

				refElement.append(script);

				if (src) {
					script.onerror = (error) => {
						cleanup();
						refElement.removeChild(script);
						script = null;
						reject(new Error(`A network error occured while trying to load resouce ${src}`));
					}

					if (script.onreadystatechange === undefined) {
						script.onload = onload;
					} else {
						script.onreadystatechange = onload;
					}

					timer = setTimeout(script.onerror, timeout);

				} else {
					resolve(script);
				}

			} else {
				resolve(element);
			}

			function cleanup() {
				clearTimeout(timer);
				timer = null;
				script.onerror = script.onreadystatechange = script.onload = null;
			}

			function onload() {
				cleanup();
				if (!script.onreadystatechange || (script.readyState && script.readyState === 'complete')) {
					if (typeof cb === 'function') {
						cb();
					}

					resolve(script);
					return;
				}
			}
		});
	}

	_loadStyle({
		src = null,
		id = null,
		inline = null,
		preload = false,
		refElement,
		version = null,
		timeout = 15000,
		cb = null
	}) {
		return new Promise((resolve, reject) => {
			const isInlineStyle = typeof inline === 'string' && inline.length;

			if (!id) {
				reject(new TypeError('Resource ID attribute is missing.'))
			}

			const sameIdElement = document.getElementById(id);

			let
				link = isInlineStyle ? document.createElement('style') : document.createElement('link'),
				timer,
				sheet,
				cssRules,
				preloadEl,
				c = (timeout || 10) * 100;

			if (src && version) {
				src += `?ver=${version}`;
			}

			if (src && preload) {
				preloadEl = document.createElement('link');
				preloadEl.setAttribute('rel', 'preload');
				preloadEl.setAttribute('href', src);
				preloadEl.setAttribute('as', 'style');
				preloadEl.setAttribute('type', 'text/css');
				document.head.prepend(preloadEl);
			}

			if (isInlineStyle) {
				link.innerHTML = inline;
				link.setAttribute('id', id);
				link.setAttribute('type', 'text/css');
			} else {
				link.setAttribute('rel', 'stylesheet');
				link.setAttribute('id', id);
				link.setAttribute('type', 'text/css');
				link.setAttribute('href', src);

				if (!preload) {
					link.setAttribute('crossorigin', 'anonymous');
				}
			}

			if (typeof refElement !== 'undefined' && refElement !== null) {
				refElement.insertAdjacentElement('afterend', link);
			} else {
				document.head.append(link);
			}

			link.onerror = function (error) {
				if (timer) {
					clearInterval(timer);
				}
				timer = null;

				reject(new Error(`A network error occured while trying to load resouce ${src}`));
			};

			if ('sheet' in link) {
				sheet = 'sheet';
				cssRules = 'cssRules';
			} else {
				sheet = 'styleSheet';
				cssRules = 'rules';
			}

			timer = setInterval(function () {
				try {
					if (link[sheet] && link[sheet][cssRules].length) {
						clearInterval(timer);
						timer = null;

						if (typeof cb === 'function') {
							cb();
						}

						resolve(link);

						// Remove old element with duplicate ID
						if (sameIdElement) {
							sameIdElement.remove();
						}
						return;
					}
				} catch (e) { }

				if (c-- < 0) {
					clearInterval(timer);
					timer = null;
					reject(new Error(`A network error occured while trying to load resouce ${src}`));
				}
			}, 10);


		});
	}

	injectPreload({
		src = null,
		refElement = document.head.querySelector('meta[charset]'),
		rel = 'prefetch', // prefetch or preload
		crossorigin = 'anonymous',
		as = 'script',
		type = 'application/javascript'
	} = {}) {
		// Don't preload if link element already exist
		if (src && !document.head.querySelector(`link[rel="${rel}"][href="${src}"]`) && !document.querySelector(`script[src="${src}"]`)) {
			const el = document.createElement('link');

			el.setAttribute('href', src);
			el.setAttribute('rel', rel);
			el.setAttribute('as', as);
			el.setAttribute('crossorigin', crossorigin);
			el.setAttribute('type', type);

			if (refElement) {
				refElement.insertAdjacentElement('afterend', el);
			} else {
				document.head.prepend(el);
			}
		}
	}
};

class BaseAnimation {
	constructor() {
		this.animations = {
			'animatedScale': {
				animationName: 'animateScale',
				initialVars: {
					scale: 0
				},
				targetVars: {
					animateFrom: 'center',
					ease: 'power3.out',
					duration: 0.6
				}
			},
			'animatedBorderHorizontal': {
				animationName: 'animateScale',
				initialVars: {
					scaleX: 0
				},
				targetVars: {
					animateFrom: 'left',
					ease: 'power4.out',
					duration: 1.2
				}
			},
			'animatedMask': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'center',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'center',
					shape: 'rectangle',
					ease: 'power4.out',
					duration: 1.2,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskCircle': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'center',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'center',
					shape: 'circle',
					ease: 'power2.inOut',
					duration: 1.2,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskEllipse': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'center',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'center',
					shape: 'ellipse',
					ease: 'power2.inOut',
					duration: 1.2,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskFromTop': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'bottom',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'top',
					shape: 'rectangle',
					ease: 'power3.inOut',
					duration: 0.9,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskFromBottom': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'top',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'bottom',
					shape: 'rectangle',
					ease: 'power3.inOut',
					duration: 0.9,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskFromLeft': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'right',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'left',
					shape: 'rectangle',
					ease: 'power3.inOut',
					duration: 0.9,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedMaskFromRight': {
				animationName: 'animateMask',
				setAnimationName: 'hideMask',
				initialVars: {
					animateTo: 'left',
					duration: 0,
					overwrite: false,
					clearProps: false,
					scaleInner: '.js-animated-mask-inner',
				},
				targetVars: {
					animateFrom: 'right',
					shape: 'rectangle',
					ease: 'power3.inOut',
					duration: 0.9,
					scale: 1.2,
					// overwrite: true,
					scaleInner: '.js-animated-mask-inner',
				}
			},
			'animatedReveal': {
				initialVars: {
					yPercent: -100
				},
				targetVars: {
					yPercent: 0,
					ease: 'power3.out',
					duration: 1.2
				}
			},
			'animatedRevealBottom': {
				initialVars: {
					yPercent: 100
				},
				targetVars: {
					yPercent: 0,
					ease: 'power3.out',
					duration: 1.2
				}
			},
			'animatedJump': {
				initialVars: {
					autoAlpha: 0,
					yPercent: 30
				},
				targetVars: {
					autoAlpha: 1,
					yPercent: 0,
					ease: 'power3.out',
					duration: 0.6
				}
			},
			'animatedJumpFromLeft': {
				initialVars: {
					autoAlpha: 0,
					xPercent: -30
				},
				targetVars: {
					autoAlpha: 1,
					xPercent: 0,
					ease: 'power3.out',
					duration: 0.6
				}
			},
			'animatedJumpFromRight': {
				initialVars: {
					autoAlpha: 0,
					xPercent: 30
				},
				targetVars: {
					autoAlpha: 1,
					xPercent: 0,
					ease: 'power3.out',
					duration: 0.6
				}
			},
			'animatedJumpScale': {
				initialVars: {
					autoAlpha: 0,
					scaleX: 1,
					scaleY: 1.5,
					x: 0,
					y: 300,
					xPercent: 0,
					yPercent: 0
				},
				targetVars: {
					autoAlpha: 1,
					scaleX: 1,
					scaleY: 1,
					x: 0,
					y: 0,
					xPercent: 0,
					yPercent: 0,
					ease: 'power3.out',
					duration: 0.6
				}
			},
			'animatedFade': {
				initialVars: {
					autoAlpha: 0
				},
				targetVars: {
					autoAlpha: 1,
					ease: 'power3.out',
					duration: 0.6
				}
			}
		};
	}

	prepareAnimation() {
		return new Promise((resolve) => {
			ScrollTrigger.refresh();
			resolve(true);
		});
	}

	getScrubAnimation() {

	}

	getRevealAnimation() {

	}

	_registerAnimations() {
		const timeScale = app.utilities.getTimeScaleByKey('onScrollReveal');

		for (const [name, options] of Object.entries(this.animations)) {
			const elements = this._getScopedAnimationElements(`[data-arts-os-animation-name="${name}"]`);

			if (elements.length) {
				const vars = {
					elements
				};

				if ('initialVars' in options) {
					Object.assign(vars, {
						initialVars: options['initialVars']
					});
				}

				if ('setAnimationName' in options && typeof gsap.effects[options.setAnimationName] === 'function') {
					Object.assign(vars, {
						shouldRunSetTween: false,
						setCb: (localElements, localVars) => {
							gsap.effects[options.setAnimationName](localElements, localVars);
						}
					});
				}

				if ('animationName' in options && typeof gsap.effects[options.animationName] === 'function') {
					Object.assign(vars, {
						shouldRunTween: false,
						cb: (batch) => {
							if ('duration' in options['targetVars']) {
								const originalDuration = options['targetVars']['duration'];

								Object.assign(options['targetVars'], {
									duration: originalDuration / timeScale
								});
							}

							gsap.effects[options.animationName](batch, options['targetVars']);
						}
					});
				}

				this._createBatchSTReveal(vars);
			}
		}
	}

	_getRevealTextAnimation() {
		const elements = this._getScopedAnimationElements();

		this._createBatchSTReveal({
			elements,
			shouldRunTween: false,
			clearVars: false,
			cb: (batch) => {
				this._animateText(batch);
			}
		});
	}

	_animateText(batch) {
		const tl = gsap.timeline();

		batch.forEach((el, index) => {
			if (el instanceof HTMLElement) {
				const type = el.getAttribute('data-arts-split-text-preset');

				switch (type) {
					case 'animatedCounterChars':
						tl.animateChars(el, {
							duration: 1.2,
							y: '-40%',
							stagger: {
								from: 'start',
								amount: .1
							}
						}, 'start');
						break;
					case 'animatedChars':
						tl.animateChars(el, {
							duration: 1.2,
							stagger: {
								from: 'start',
								amount: .3
							}
						}, 'start');
						break;
					case 'animatedCharsRandom':
						tl.animateChars(el, {
							duration: 1.2,
							stagger: {
								from: 'random',
								amount: .3
							}
						}, 'start');
						break;
					case 'animatedWords':
						tl.animateWords(el, {
							duration: 1.2,
							stagger: {
								from: 'start',
								amount: .1
							}
						}, index === 0 ? 'start' : '<20%');
						break;
					case 'animatedLines':
						tl.animateLines(el, {
							duration: 1.2,
							stagger: 0.07
						}, index === 0 ? 'start' : '<20%');
						break;
				}

			}
		});

		this._animateOutlines(tl);

		tl.timeScale(app.utilities.getTimeScaleByKey('onScrollReveal'));
	}

	_animateOutlines(timeline) {
		if (timeline && this.elements.outlines && this.elements.outlines.length) {
			timeline.add(() => {
				this.elements.outlines.forEach((el, index) => {
					timeline.to(el, {
						duration: 1.8,
						drawSVG: '100% 0%',
						ease: 'expo.inOut',
						delay: index * 0.1,
						onStart: () => {
							const parentOverflowLine = this.elements.outlines[index].closest('.js-arts-split-text__wrapper-line');

							if (parentOverflowLine) {
								parentOverflowLine.classList.remove('overflow-hidden');
								parentOverflowLine.style.overflow = 'initial';
							}

							this.elements.outlines[index].classList.add('color-accent');
						}
					}, '<');
				});
			}, '<50%');
		}
	}

	_initAnimations() {
		if (this._hasAnimationScene()) {
			this.prepareAnimation().then(() => {
				this._getRevealTextAnimation();
				this._registerAnimations();
				this._setAnimationReady();
				this._createSTReveal();
			});
		}

		this._createSTScrub();
	}

	_createSTReveal() {
		const animation = this.getRevealAnimation();

		if (animation) {
			const
				masterTimeline = gsap.timeline({
					defaults: {
						duration: 1.2,
						ease: 'power3.out'
					},
					onStart: () => {
						app.utilities.dispatchEvent('animation/start', {}, this.element);
					},
					onUpdate: () => {
						app.utilities.dispatchEvent('animation/update', {}, this.element);
					},
					onComplete: () => {
						animation.kill();
						app.utilities.dispatchEvent('animation/end', {}, this.element);
					}
				}).add(animation.play()),
				preloaderRef = app.componentsManager.getComponentByName('Preloader'),
				triggerHook = app.utilities.getTriggerHookValue();

			masterTimeline.timeScale(app.utilities.getTimeScaleByKey('onScrollReveal'));

			this.stReveal = ScrollTrigger.create({
				start: this.containerAnimation ? `top bottom` : `top bottom-=${window.innerHeight * triggerHook}px`,
				animation: masterTimeline,
				trigger: this.element,
				invalidateOnRefresh: true,
				// containerAnimation: this.containerAnimation,
				once: true
			});

			if (preloaderRef) {
				this.stReveal.disable();

				preloaderRef.loaded.then(() => {
					this.stReveal.enable();
				});
			} else {
				if (this._isWebGLEnabled()) {
					this.stReveal.disable();

					this.webGLReady.then(() => {
						this.stReveal.enable();
					});
				}
			}
		}
	}

	_createSTScrub() {
		const config = this.getScrubAnimation();

		if (config) {
			if (this.containerAnimation) {
				config['containerAnimation'] = this.containerAnimation;
			}

			if (config.matchMedia) {
				this.mmSTScrub = gsap.matchMedia();
				this.mmSTScrub.add(config.matchMedia, () => {
					this.stScrub = ScrollTrigger.create(config);
				});
			} else {
				this.stScrub = ScrollTrigger.create(config);
			}

			document.addEventListener('arts/barba/transition/start', () => {
				if (this.stScrub) {
					this.stScrub.kill();
				}

				if (this.mmSTScrub && typeof this.mmSTScrub.kill === 'function') {
					this.mmSTScrub.kill();
				}
			}, {
				once: true
			});
		}
	}

	_createBatchSTReveal({
		initialVars = {},
		targetVars = {},
		clearVars = {},
		elements,
		interval = 0.05,
		batchMax = 6,
		setCb,
		cb,
		shouldRunTween = true,
		shouldRunSetTween = true,
	} = {

		}) {

		if (elements) {
			const
				timeScale = app.utilities.getTimeScaleByKey('onScrollReveal'),
				triggerHook = app.utilities.getTriggerHookValue(),
				batchVars = {
					interval,
					batchMax,
					start: ({ trigger }) => {
						const offset = trigger.getBoundingClientRect().top < window.innerHeight ? 0 : window.innerHeight * triggerHook;

						return `top bottom-=${offset}px`;
					},
					once: true
				},
				defaultTargetVars = {
					autoAlpha: 1,
					x: 0,
					y: 0,
					xPercent: 0,
					yPercent: 0,
					scaleX: 1,
					scaleY: 1,
					duration: 0.6,
					stagger: 0.07,
					ease: 'power3.out',
				},
				defaultClearVars = {
					clearProps: 'opacity,visibility,transform'
				},
				preloaderRef = app.componentsManager.getComponentByName('Preloader');

			if (typeof targetVars === 'object') {
				targetVars = deepmerge(defaultTargetVars, targetVars);
			}

			if (typeof clearVars === 'object') {
				clearVars = deepmerge(defaultClearVars, clearVars);
			}

			if ('duration' in targetVars) {
				const originalDuration = targetVars['duration'];

				Object.assign(targetVars, {
					duration: originalDuration / timeScale
				});
			}

			Object.assign(batchVars, {
				onEnter: (batch) => {
					Object.assign(targetVars, {
						onStart: () => {
							app.utilities.dispatchEvent('animation/start', {}, this.element);
						},
						onUpdate: () => {
							app.utilities.dispatchEvent('animation/update', {}, this.element);
						},
						onComplete: () => {
							if (typeof clearVars === 'object') {
								gsap.set(batch, clearVars);
							}
							app.utilities.dispatchEvent('animation/complete', {}, this.element);
						}
					});

					if (typeof cb === 'function') {
						cb(batch, targetVars);
					}

					if (!!shouldRunTween) {
						gsap.to(batch, targetVars);
					}
				}
			});

			Object.assign(initialVars, {
				onComplete: () => {
					const batchST = ScrollTrigger.batch(elements, batchVars);

					if (preloaderRef) {
						batchST.forEach(instance => instance.disable());

						preloaderRef.loaded.then(() => {
							batchST.forEach(instance => instance.enable());
						});
					} else {
						if (this._isWebGLEnabled()) {
							batchST.forEach(instance => instance.disable());

							this.webGLReady.then(() => {
								batchST.forEach(instance => instance.enable());
							});
						}
					}
				}
			});

			if (typeof setCb === 'function') {
				setCb(elements, initialVars);
			}

			if (!!shouldRunSetTween) {
				gsap.set(elements, initialVars);
			}

			// Reset position
			ScrollTrigger.addEventListener('refreshInit', () => gsap.set(elements, {
				x: 0,
				y: 0,
				xPercent: 0,
				yPercent: 0
			}));
		}
	}

	_setAnimationReady() {
		this.element.setAttribute('data-arts-os-animation', 'ready');
	}

	_hasAnimationScene() {
		const animationAttribute = this.element.getAttribute('data-arts-os-animation');

		return !!animationAttribute && animationAttribute !== 'false';
	}

	_getScopedSelector(selector) {
		return `:scope ${selector}:not(:scope [data-arts-component-name] ${selector}):not(:scope [data-arts-component-name]${selector})`;
	}

	_getScopedAnimationElements(selector = '[data-arts-split-text-preset]') {
		const containers = [...this.element.querySelectorAll(this._getScopedSelector(selector))];

		if (this.element.matches(selector)) {
			containers.push(this.element);
		}

		return containers;
	}
}

class BaseComponent extends BaseAnimation {
	constructor({
		name,
		element,
		loadInnerComponents,
		parent,
		defaults,
		innerElements
	}) {
		super();

		this.mounted = false;
		this.containerAnimation = undefined;
		this.ready = new Promise((resolve) => {
			this._setReady = resolve;
		});
		this.webGLReady = new Promise((resolve) => {
			this._setWebGLReady = resolve;
		});

		this.loadInnerComponents = loadInnerComponents;
		this.name = name;
		this.element = element;
		this.parent = parent;
		this.defaults = defaults;
		this.innerSelectors = innerElements;
		this.components = [];
		this.elements = {};
		this.options = {};
		this.lazy = null;

		// Component options
		this._updateOptions();

		// Component inner elements
		this._updateElements({
			container: this.element,
			elements: this.innerSelectors
		});
	}

	setup() {
		const AJAX = app.componentsManager.getComponentByName('AJAX');

		document.fonts.ready.then(() => this.mount()).then(() => {
			if (AJAX && AJAX.running) {
				this.init();

				document.addEventListener('arts/barba/transition/end/before', this._initAnimations.bind(this), {
					once: true
				});
			} else {
				this.init();
				this._initAnimations();
			}

			// Set component ready on the next tick
			gsap.ticker.add(this._setReady.bind(this), true, false);
		});
	}

	init() {

	}

	destroy() {

	}

	update() {
		this._updateOptions();
	}

	reload(options) {
		if (this.stReveal) {
			this.stReveal.kill();
		}

		if (this.stScrub) {
			this.stScrub.kill();
		}

		this.destroy();
		this._updateOptions({
			attributeSelector: options ? false : undefined,
			options
		});
		this.init();
		this._initAnimations();
	}

	mount() {
		return new Promise((resolve) => {
			// console.log(`Mounting component: ${this.name}...`);

			if (this.parent && this.parent.horizontalScroll) {
				this.horizontalScroll = this.parent.horizontalScroll;
				this.containerAnimation = this.horizontalScroll.getContainerAnimation(this.element);
			}

			if (this.mounted || !this.loadInnerComponents) {
				this.mounted = true;

				resolve(true);
			} else {

				Promise.all(app.componentsManager.init({
					storage: this.components,
					scope: this.element,
					parent: this,
					nameAttribute: 'data-arts-component-name',
					optionsAttribute: 'data-arts-component-options',
				}))
					.then(() => {
						this._initSplitText();
						this._initLazyMedia();
						this.mounted = true;

						resolve(true);
					});
			}
		});
	}

	destroySplitText() {
		this.splitObserver.disconnect();
		this.splitTextInstance.forEach(instance => {
			instance.destroy();
		});
	}

	updateRef(key, componentName) {
		if (!key || !componentName) {
			return;
		}

		if (!this[key]) {
			this[key] = app.componentsManager.getComponentByName(componentName);
		}

		return this[key];
	}

	setLoading(loading = true) {
		if (!!app.options.cursorLoading) {
			this.element.classList.toggle('cursor-progress', loading);
		}
	}

	_initLazyMedia() {
		const lazyMedia = [...this.element.querySelectorAll('.lazy:not(:scope [data-arts-component-name] .lazy)')];

		if (lazyMedia.length) {
			lazyMedia.forEach((element) => {
				const
					width = element.getAttribute('width'),
					height = element.getAttribute('height'),
					isBackground = window.getComputedStyle(element).position === 'absolute',
					isFullheight = element.classList.contains('full-height') || element.classList.contains('hs-full-height');
				let parent = element.parentElement;

				if (parent && parent.tagName === 'PICTURE') {
					parent = parent.parentElement;
				}

				if (!isBackground && !isFullheight && parent && width && height && !element.closest('.custom-aspect-ratio') && !element.closest('.auto-width-height')) {
					parent.style.setProperty('--media-width', width);
					parent.style.setProperty('--media-height', height);
					parent.classList.add('has-aspect-ratio');


					// if (CSS.supports('aspect-ratio", "1 / 1')) {
					// 	element.parentElement.style.aspectRatio = `${width} / ${height}`;
					// } else {
					// }
				}
			});

			ScrollTrigger.create({
				trigger: this.element,
				start: () => `top-=1000px bottom`,
				scrub: false,
				containerAnimation: this.containerAnimation,
				once: true,
				onEnter: () => {
					lazyMedia.forEach((el) => {
						LazyLoad.load(el);
					});
				}
			});
		}
	}

	_initSplitText() {
		const splitTarget = this._getScopedAnimationElements();
		let options = {
			init: true,
			type: 'lines',
			set: {
				type: 'lines',
				direction: 'y',
				distance: '100%',
				opacity: false
			},
			wrap: 'lines',
			wrapClass: 'overflow-hidden',
		};

		this.splitTextInstance = [];
		this.splitTextTriggered = false;
		this.splitObserver = new ResizeObserver(app.utilities.debounce(this._onSplitTextResize.bind(this), 50));

		splitTarget.forEach((el, index) => {
			const presetAttribute = el.getAttribute('data-arts-split-text-preset');
			this._createTextOutlines(el);

			if (presetAttribute && presetAttribute in app.animations.splitTextPresets) {
				options = app.animations.splitTextPresets[presetAttribute];
			}

			try {
				this.splitTextInstance[index] = new ArtsSplitText(el, options);

				this.splitObserver.observe(el);
			} catch (error) {
				console.error(`An error occured in component ${this.name}: ${error}`);
			}
		});
	}

	_createTextOutlines(el) {
		const outlines = [...el.querySelectorAll('u')];

		if (outlines.length && typeof app.options.circleTemplate === 'string') {
			this.elements.outlines = [];

			outlines.forEach((el) => {
				el.insertAdjacentHTML('beforeend', app.options.circleTemplate);

				const outline = el.querySelector('ellipse');

				this.elements.outlines.push(outline);

				if (this._hasAnimationScene()) {
					gsap.set(outline, {
						drawSVG: '0% 0%'
					});
				}
			});
		}
	}

	_onSplitTextResize(entries) {
		if (!this.splitTextTriggered) {
			this.splitTextTriggered = true;
			return;
		}

		for (const entry of entries) {
			this.elements.outlines = [];
			this.splitTextInstance.forEach((instance) => {
				if (instance.containerElement === entry.target) {
					instance.destroy();

					if (entry.target.classList.contains('split-text-animation-revealed')) {
						[...entry.target.querySelectorAll('u ellipse')].forEach((el) => {
							el.style = null;
						});
					}

					const outlines = [...entry.target.querySelectorAll('u')];

					outlines.forEach((el) => {
						const underline = el.querySelector('ellipse');
						this.elements.outlines.push(underline);
					});

					instance.init();

					if (entry.target.classList.contains('split-text-animation-revealed')) {
						[...entry.target.querySelectorAll('u ellipse')].forEach((el) => {
							const parentOverflowLine = el.closest('.js-arts-split-text__wrapper-line');

							if (parentOverflowLine) {
								parentOverflowLine.classList.remove('overflow-hidden');
								parentOverflowLine.style.overflow = 'initial';
							}
						});
					}
				}
			});
		}
	}

	_setReady() {

	}

	_setWebGLReady() {

	}

	_isWebGLEnabled() {
		return !!this.options.webGL && !!this.options.webGL.enabled;
	}

	_updateOptions({
		container = this.element,
		target = this.options,
		defaults = this.defaults,
		attributeSelector = 'data-arts-component-options',
		options = {}
	} = {}) {
		if (!container) {
			return {};
		}

		let resultOptions = {};

		if (options && defaults) {
			resultOptions = deepmerge(defaults, options);
		}

		if (attributeSelector) {
			// attempt to find & parse inline options via attribute selector
			const inlineOptions = app.utilities.parseOptionsStringObject(container.getAttribute(attributeSelector));

			// override with inline options
			if (inlineOptions && Object.keys(inlineOptions).length !== 0) {
				resultOptions = deepmerge(resultOptions, inlineOptions);
			}
		}

		Object.assign(target, resultOptions);
	}

	_updateElements({
		container,
		elements
	}) {

		if (container && elements && typeof elements === 'object') {
			for (const key in elements) {
				const selector = `${elements[key]}`;
				// const selector = `${elements[key]}:not(:scope [data-arts-component-name] ${elements[key]})`;

				Object.assign(this.elements, {
					[key]: [...container.querySelectorAll(selector)]
				});
			}
		}
	}

	_getInnerComponentByName(name) {
		const index = this.components.findIndex(p => p.name === name);

		if (index > -1) {
			return this.components[index];
		} else {
			return false;
		}
	}
}
window.BaseComponent = BaseComponent;

class ComponentsManager {
	constructor() {
		this.instances = {
			persistent: [],
			disposable: [],
		};
	}

	init({
		scope = document,
		parent = null,
		loadInnerComponents = true,
		storage = this.instances.disposable,
		selector = ':scope [data-arts-component-name]:not(:scope [data-arts-component-name] [data-arts-component-name])',
		loadOnlyFirst = false,
		nameAttribute = 'data-arts-component-name',
		optionsAttribute = 'data-arts-component-options',
	}) {
		if (!scope) {
			return [];
		}

		let
			nodes = loadOnlyFirst ? [scope.querySelector(selector)] : [...scope.querySelectorAll(selector)],
			promises = [];

		if (!parent) {
			nodes = nodes.filter(el => el && !el.matches(':scope [data-arts-component-name] [data-arts-component-name]'));

			if (!loadOnlyFirst) {
				nodes[0] = null;
			}
		}

		if (nodes && nodes.length) {
			nodes.forEach((el) => {
				const loader = this.loadComponent({
					el,
					parent,
					storage,
					loadInnerComponents,
					nameAttribute,
					optionsAttribute
				});

				promises.push(loader);
			});
		}

		return promises;
	}

	loadComponent({
		el,
		loadInnerComponents,
		parent,
		storage,
		name = undefined,
		nameAttribute = 'data-arts-component-name',
		optionsAttribute = 'data-arts-component-options',
		options = undefined,
	}) {
		if (!el) {
			return new Promise((resolve) => {
				resolve(true);
			});
		}

		const
			componentName = name || el.getAttribute(nameAttribute),
			attrOptions = options || el.getAttribute(optionsAttribute);

		return new Promise((resolve, reject) => {
			if (typeof window[componentName] !== 'undefined') {
				const instance = new window[componentName]({
					name: componentName,
					loadInnerComponents,
					parent,
					element: el,
					options: attrOptions
				});

				storage.push(instance);

				instance.ready.then(() => resolve(true));
			} else if (app.components[componentName]) {
				this.load({
					properties: app.components[componentName],
				})
					.then((module) => {
						if (typeof module === 'object' && 'default' in module) {
							const instance = new module.default({
								name: componentName,
								loadInnerComponents,
								parent,
								element: el,
								options: attrOptions
							});

							storage.push(instance);

							instance.ready.then(() => resolve(true));
						} else {
							resolve(true);
						}
					});
			} else {
				console.error(`Component "${componentName}" is not recognized`);
				resolve(true);
			}
		});
	}

	load({
		properties = []
	}) {
		const
			depsPromises = [],
			filesPromises = [];

		return new Promise((resolve) => {
			if ('dependencies' in properties) {
				properties.dependencies.forEach((dep) => {
					if (dep in app.assets) {
						app.assets[dep].forEach((resource) => {
							// depsPromises.push(import(resource));
							depsPromises.push(app.assetsManager.load(resource));
						});
					}
				});
			}

			if ('files' in properties) {
				properties.files.forEach((resource) => {
					filesPromises.push(app.assetsManager.load(resource));
				});
			}

			Promise.all(depsPromises)
				.then(() => Promise.all(filesPromises))
				.then(() => typeof properties.file === 'string' ? import(properties.file) : {})
				.then(resolve);
		});
	}

	getComponentByName(name) {
		return this.instances.persistent.filter(instance => instance.name.toLowerCase() === name.toLowerCase())[0];
	}
}

class Forms {
	constructor() {
		this.forms = 'form';
		this.input = 'input-float__input';
		this.inputClassNotEmpty = 'input-float__input_not-empty';
		this.inputClassFocused = 'input-float__input_focused';
		this.inputParent = 'wpcf7-form-control-wrap';

		this._handlers = {
			focusIn: this._onFocusIn.bind(this),
			focusOut: this._onFocusOut.bind(this),
			reset: this._onReset.bind(this),
		};

		this.init();
	}

	init() {
		this._floatLabels();
		this._attachEvents();
	}

	_floatLabels() {
		const inputs = [...document.querySelectorAll(`.${this.input}`)];

		inputs.forEach((el) => {
			const controlWrapper = el.closest(`.${this.inputParent}`);

			// Not empty value
			if (el.value && el.value.length) {
				this._setNotEmptyValue(el, controlWrapper);
				// Empty value
			} else {
				this._setEmptyValue(el, controlWrapper);
			}

			// Has placeholder & empty value
			if ((el.placeholder && el.placeholder.length) && !(el.value && el.value.length)) {
				this._setNotEmptyValue(el, controlWrapper);
			}
		});
	}

	_setNotEmptyValue(el, controlWrapper) {
		if (el) {
			el.classList.add(this.inputClassNotEmpty);
		}

		if (controlWrapper) {
			controlWrapper.classList.add(this.inputClassNotEmpty);
		}
	}

	_setEmptyValue(el, controlWrapper) {
		if (el) {
			el.classList.remove(this.inputClassFocused, this.inputClassNotEmpty);
		}

		if (controlWrapper) {
			controlWrapper.classList.remove(this.inputClassFocused, this.inputClassNotEmpty);
		}
	}

	_setFocus(el, controlWrapper) {
		if (el) {
			el.classList.add(this.inputClassFocused);
			el.classList.remove(this.inputClassNotEmpty);
		}

		if (controlWrapper) {
			controlWrapper.classList.add(this.inputClassFocused);
			controlWrapper.classList.remove(this.inputClassNotEmpty);
		}
	}

	_removeFocus(el, controlWrapper) {
		if (el) {
			el.classList.remove(this.inputClassFocused);
		}

		if (controlWrapper) {
			controlWrapper.classList.remove(this.inputClassFocused);
		}
	}

	_isTargetInput(target) {
		return target.classList && target.classList.contains(this.input);
	}

	_isTargetForm(target) {
		return target.tagName === 'FORM';
	}

	_attachEvents() {
		window.addEventListener('focusin', this._handlers.focusIn);
		window.addEventListener('focusout', this._handlers.focusOut);
		window.addEventListener('reset', this._handlers.reset);
	}

	_detachEvents() {
		window.removeEventListener('focusin', this._handlers.focusIn);
		window.removeEventListener('focusout', this._handlers.focusOut);
		window.removeEventListener('reset', this._handlers.reset);
	}

	_onFocusIn(event) {
		const target = event.target;

		if (this._isTargetInput(target)) {
			const controlWrapper = target.closest(`.${this.inputParent}`);

			this._setFocus(target, controlWrapper);
		}
	}

	_onFocusOut(event) {
		const target = event.target;

		if (this._isTargetInput(target)) {
			const controlWrapper = target.closest(`.${this.inputParent}`);

			// not empty value
			if (target.value && target.value.length) {
				this._setNotEmptyValue(target, controlWrapper);
			} else {
				// has placeholder & empty value
				if (target.placeholder && target.placeholder.length) {
					this._setNotEmptyValue(target, controlWrapper);
				}

				this._removeFocus(target, controlWrapper);
			}
		}
	}

	_onReset(event) {
		const target = event.target;

		if (this._isTargetForm(target)) {
			[...target.querySelectorAll(`.${this.input}`)].forEach((el) => {
				const controlWrapper = el.closest(`.${this.inputParent}`);

				el.classList.remove(this.inputClassFocused, this.inputClassNotEmpty);

				if (controlWrapper) {
					controlWrapper.classList.remove(this.inputClassFocused, this.inputClassNotEmpty);
				}
			});
		}
	}
}

class HoverEffect {
	constructor() {
		this._handlers = {
			hoverIn: this._onMouseEnter.bind(this),
			hoverOut: this._onMouseLeave.bind(this),
			prevent: this.preventDefault.bind(this)
		};

		this.selectorHoverSelf = '[data-hover-class]';
		this.attributeHoverSelf = 'data-hover-class';

		this.selectorHoverGroup = '[data-hover-group-class]';
		this.selectorHoverGroupElements = `${this.selectorHoverGroup} a`;
		this.attributeHoverGroup = 'data-hover-group-class';

		this.attachEvents(document, this._handlers.hoverIn, this._handlers.hoverOut);
	}

	_onMouseEnter(event) {
		const target = event.target;

		if (target instanceof HTMLElement) {
			this._toggleHoverSelfClass({
				element: target,
				toggle: true
			});

			this._toggleHoverGroupClass({
				element: target,
				toggle: true
			});
		}
	}

	_onMouseLeave(event) {
		const target = event.target;

		if (target instanceof HTMLElement) {
			this._toggleHoverSelfClass({
				element: target,
				selector: this.selectorHoverSelf,
				attribute: this.attributeHoverSelf,
				toggle: false
			});

			this._toggleHoverGroupClass({
				element: target,
				toggle: false
			});
		}
	}

	_toggleHoverSelfClass({
		element,
		toggle
	} = {
			element: null,
			toggle: false
		}) {
		const el = element.closest(this.selectorHoverSelf);

		if (el) {
			const hoverClass = el.getAttribute(this.attributeHoverSelf);

			if (hoverClass.length) {
				el.classList.toggle(hoverClass, toggle);
			}
		}
	}

	_toggleHoverGroupClass({
		element,
		toggle
	} = {
			element: null,
			toggle: false
		}) {
		const el = element.closest(this.selectorHoverGroupElements);

		if (el) {
			const parent = element.closest(this.selectorHoverGroup);

			if (parent) {
				const hoverClass = parent.getAttribute(this.attributeHoverGroup);

				if (hoverClass.length) {
					parent.classList.toggle(hoverClass, toggle);
				}
			}
		}
	}

	attachEvents(element, onHoverInCallback, onHoverOutCallback) {
		if (element) {
			if (typeof onHoverInCallback === 'function') {
				element.addEventListener('mouseenter', onHoverInCallback, true);
				element.addEventListener('touchstart', onHoverInCallback, true);

				element.addEventListener('webkitmouseforcewillbegin', this._handlers.prevent);
				element.addEventListener('webkitmouseforcedown', this._handlers.prevent);
				element.addEventListener('webkitmouseforceup', this._handlers.prevent);
				element.addEventListener('webkitmouseforcechanged', this._handlers.prevent);
			}

			if (typeof onHoverOutCallback === 'function') {
				element.addEventListener('mouseleave', onHoverOutCallback, true);
				element.addEventListener('touchend', onHoverOutCallback, true);
				element.addEventListener('touchcancel', onHoverOutCallback, true);
			}
		}
	}

	detachEvents(element, onHoverInCallback, onHoverOutCallback) {
		if (element) {
			if (typeof onHoverInCallback === 'function') {
				element.removeEventListener('mouseenter', onHoverInCallback, true);
				element.removeEventListener('touchstart', onHoverInCallback, true);

				element.removeEventListener('webkitmouseforcewillbegin', this._handlers.prevent);
				element.removeEventListener('webkitmouseforcedown', this._handlers.prevent);
				element.removeEventListener('webkitmouseforceup', this._handlers.prevent);
				element.removeEventListener('webkitmouseforcechanged', this._handlers.prevent);
			}

			if (typeof onHoverOutCallback === 'function') {
				element.removeEventListener('mouseleave', onHoverOutCallback, true);
				element.removeEventListener('touchend', onHoverOutCallback, true);
				element.removeEventListener('touchcancel', onHoverOutCallback, true);
			}
		}
	}

	preventDefault(event) {
		event.stopPropagation();
		event.preventDefault();
	}
}

class Utilities {
	constructor() {
		this._handlers = {
			resize: this.debounce(this._updateMobileBarVh.bind(this), this.getDebounceTime(300)),
			orientationchange: this.debounce(ScrollTrigger.refresh.bind(ScrollTrigger, false), this.getDebounceTime())
		};

		this.lastVW = window.innerWidth;
		this.lastVH = window.innerHeight;

		this.mqPointer = window.matchMedia(`(hover: hover) and (pointer: fine)`);
		this.init();
	}

	init() {
		this._attachEvents();
	}

	update() {
		this._updateMobileBarVh();
	}

	destroy() {
		this._detachEvents();
	}

	_attachEvents() {
		this.attachResponsiveResize({
			callback: this._handlers.resize,
			autoDetachOnTransitionStart: false
		});

		window.addEventListener('orientationchange', this._handlers.orientationchange);
	}

	_detachEvents() {
		window.removeEventListener('orientationchange', this._handlers.orientationchange);
	}

	attachResponsiveResize({
		callback,
		immediateCall = true,
		autoDetachOnTransitionStart = true
	} = {}) {
		const self = this;

		if (typeof callback === 'function') {
			const cb = callback.bind(callback);

			function changeHandlerVW(event) {
				if (this.lastVW !== window.innerWidth) {
					this.lastVW = window.innerWidth;
					cb();
				}
			}

			function changeHandlerVH(event) {
				if (this.lastVH !== window.innerHeight) {
					this.lastVH = window.innerHeight;
					cb();
				}
			}

			const
				cbWidth = changeHandlerVW.bind(changeHandlerVW),
				cbHeight = changeHandlerVH.bind(changeHandlerVH);

			function changeHandler(event, runCallback = false) {
				if (event.matches) {
					window.addEventListener('resize', cbHeight, false);
				} else {
					window.removeEventListener('resize', cbHeight, false);
				}

				if (!!runCallback) {
					cb();
				}
			}

			function clear() {
				window.removeEventListener('resize', cbWidth, false);
				window.removeEventListener('resize', cbHeight, false);

				if (typeof self.mqPointer.removeEventListener === 'function') {
					self.mqPointer.removeEventListener('change', changeHandler);
				} else {
					self.mqPointer.removeListener(changeHandler);
				}
			}

			window.addEventListener('resize', cbWidth, false);

			changeHandler({ matches: self.mqPointer.matches }, immediateCall);

			if (typeof self.mqPointer.addEventListener === 'function') {
				self.mqPointer.addEventListener('change', changeHandler);
			} else {
				self.mqPointer.addListener(changeHandler);
			}

			if (!!autoDetachOnTransitionStart) {
				document.addEventListener('arts/barba/transition/start', clear, { once: true });
			}

			return { clear };
		}
	}

	_updateMobileBarVh() {
		document.documentElement.style.setProperty('--fix-bar-vh', `${document.documentElement.clientHeight * 0.01}px`);
		ScrollTrigger.refresh(true);
	}

	scrollTo({
		target = 0,
		ease = 'expo.inOut',
		delay = 0,
		duration = 0.8,
		offset = 0,
		container = window,
		cb = undefined
	}) {
		const
			scrollRef = app.componentsManager.getComponentByName('Scroll'),
			isSmoothScroll = this.isSmoothScrollingEnabled() && scrollRef && scrollRef.instance;

		if (duration === 0) {
			if (isSmoothScroll) {
				return gsap.set(container, {
					delay,
					scrollTo: { y: target, offsetY: offset },
					onComplete: () => {
						scrollRef.instance.scrollTo(target, { immediate: true, offset: -offset, force: true });

						if (typeof cb === 'function') {
							cb();
						}
					}
				});
			} else {
				return gsap.set(container, {
					delay,
					scrollTo: target,
					onComplete: () => {
						if (typeof cb === 'function') {
							cb();
						}
					}
				});
			}
		} else {
			if (isSmoothScroll) {
				return gsap.to(container, {
					duration,
					delay,
					ease,
					onStart: () => {
						scrollRef.instance.scrollTo(target, {
							duration,
							offset: -offset,
							easing: gsap.parseEase(ease)
						});
					},
					onComplete: () => {
						if (typeof cb === 'function') {
							cb();
						}
					}
				});
			} else {
				return gsap.to(container, {
					duration,
					delay,
					scrollTo: { y: target, offsetY: offset },
					ease,
					onComplete: () => {
						if (typeof cb === 'function') {
							cb();
						}
					}
				});
			}
		}
	}

	scrollLock(lock = true) {
		const scrollRef = app.componentsManager.getComponentByName('Scroll');
		const lockClass = 'lock-scroll';

		document.documentElement.classList.toggle(lockClass, lock);

		if (this.isSmoothScrollingEnabled() && scrollRef.instance) {
			if (lock) {
				scrollRef.instance.stop();
			} else {
				scrollRef.instance.start();
			}
		}
	}

	scrollToAnchorFromHash(delay = 0.3) {
		if (window.location.hash) {
			try {
				const scrollElement = document.querySelector(window.location.hash);

				if (scrollElement) {
					return this.scrollTo({
						target: scrollElement,
						delay,
					});
				}
			} catch (error) {

			}
		}
	}

	isSmoothScrollingEnabled() {
		const scrollRef = app.componentsManager.getComponentByName('Scroll');

		return scrollRef && scrollRef.instance;
	}

	toggleClasses(element, classNamesString, force) {
		if (element && element instanceof HTMLElement) {
			const classNames = classNamesString.split(' ');

			if (classNames.length) {
				classNames.map(className => element.classList.toggle(className, force));
			}
		}
	}

	debounce(func, wait, immediate) {
		let timeout;

		return function (...args) {
			let context = this;

			let later = () => {
				timeout = null;

				if (!immediate) {
					func.apply(context, args);
				};
			};

			let callNow = immediate && !timeout;

			clearTimeout(timeout);

			timeout = setTimeout(later, wait);

			if (callNow) {
				func.apply(context, args)
			};
		};
	}

	getDebounceTime(value = 400) {
		return value;
	}

	parseOptionsStringObject(strObj) {
		let result = {};

		if (!strObj) {
			return result;
		}

		try {
			result = JSON.parse(this.convertStringToJSON(strObj));
		} catch (error) {
			console.warn(`${strObj} is not a valid parameters object`);
		}

		return result;
	}

	convertStringToJSON(strObj) {
		if (!strObj) {
			return;
		}

		const filteredStr = strObj.replace(/'/g, '"');

		return filteredStr.replace(/(?=[^"]*(?:"[^"]*"[^"]*)*$)(\w+:)|(\w+ :)/g, function (s) {
			return '"' + s.substring(0, s.length - 1) + '":';
		});
	}

	pageLock(lock = true) {
		gsap.set('#page-blocking-curtain', {
			display: lock ? 'block' : 'none'
		});
	}

	getLinkTarget(event) {
		const target = event.target;

		if (target instanceof HTMLElement) {
			const link = target.closest('a') || target.closest('.virtual-link');

			if (link) {
				return link;
			}
		}

		return null;
	}

	degrees2Radians(degrees) {
		return degrees * (Math.PI / 180);
	}

	getHeaderHeight() {
		return parseInt(document.documentElement.style.getPropertyValue('--header-height'));
	}

	dispatchEvent(name, options, target = document) {
		const event = new CustomEvent(name, options);

		target.dispatchEvent(event);
	}

	waitForVariable(variable, checkingInterval = 20, timeout = 1000) {
		return new Promise((resolve, reject) => {
			const ticker = setInterval(() => {
				if (typeof window[variable] !== 'undefined') {
					clearInterval(ticker);
					resolve(window[variable]);
				}
			}, checkingInterval);

			setTimeout(() => {
				clearInterval(ticker);
				reject(`Global variable "window.${variable}" is still not defined after ${timeout}ms.`);
			}, timeout);
		});
	}

	isEnabledOption(obj) {
		return obj === true || (typeof obj === 'object' && (!('enabled' in obj) || ('enabled' in obj && obj['enabled'] === true)));
	}

	getTimeScaleByKey(key) {
		if (key in app.options.animations.speed && typeof app.options.animations.speed[key] === 'number') {
			if (app.options.animations.speed[key] === 0) {
				return 1;
			}

			return gsap.utils.clamp(0.01, Infinity, app.options.animations.speed[key]);
		}

		return 1;
	}

	getTriggerHookValue(defaultValue = 0.15) {
		if ('triggerHook' in app.options.animations && typeof app.options.animations.triggerHook === 'number') {
			return gsap.utils.clamp(0.0, 1.0, app.options.animations.triggerHook);
		}

		return defaultValue;
	}

	shouldPreventLinkClick(event) {
		return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
	}
}

(()=>{"use strict";var t={417:t=>{var e=function(t){return function(t){return!!t&&"object"==typeof t}(t)&&!function(t){var e=Object.prototype.toString.call(t);return"[object RegExp]"===e||"[object Date]"===e||function(t){return t.$$typeof===i}(t)}(t)},i="function"==typeof Symbol&&Symbol.for?Symbol.for("react.element"):60103;function s(t,e){return!1!==e.clone&&e.isMergeableObject(t)?o((i=t,Array.isArray(i)?[]:{}),t,e):t;var i}function n(t,e,i){return t.concat(e).map((function(t){return s(t,i)}))}function a(t){return Object.keys(t).concat(function(t){return Object.getOwnPropertySymbols?Object.getOwnPropertySymbols(t).filter((function(e){return t.propertyIsEnumerable(e)})):[]}(t))}function r(t,e){try{return e in t}catch(t){return!1}}function o(t,i,c){(c=c||{}).arrayMerge=c.arrayMerge||n,c.isMergeableObject=c.isMergeableObject||e,c.cloneUnlessOtherwiseSpecified=s;var l=Array.isArray(i);return l===Array.isArray(t)?l?c.arrayMerge(t,i,c):function(t,e,i){var n={};return i.isMergeableObject(t)&&a(t).forEach((function(e){n[e]=s(t[e],i)})),a(e).forEach((function(a){(function(t,e){return r(t,e)&&!(Object.hasOwnProperty.call(t,e)&&Object.propertyIsEnumerable.call(t,e))})(t,a)||(r(t,a)&&i.isMergeableObject(e[a])?n[a]=function(t,e){if(!e.customMerge)return o;var i=e.customMerge(t);return"function"==typeof i?i:o}(a,i)(t[a],e[a],i):n[a]=s(e[a],i))})),n}(t,i,c):s(i,c)}o.all=function(t,e){if(!Array.isArray(t))throw new Error("first argument should be an array");return t.reduce((function(t,i){return o(t,i,e)}),{})};var c=o;t.exports=c},76:(t,e,i)=>{i.r(e)},549:(t,e,i)=>{i.r(e)}},e={};function i(s){var n=e[s];if(void 0!==n)return n.exports;var a=e[s]={exports:{}};return t[s](a,a.exports,i),a.exports}i.d=(t,e)=>{for(var s in e)i.o(e,s)&&!i.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:e[s]})},i.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),i.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var s={};(()=>{i.d(s,{default:()=>h});var t=i(417);const e={init:!0,matchMedia:!1,type:"lines",set:!1,lineClass:"js-arts-split-text__line",wordClass:"js-arts-split-text__word",charClass:"js-arts-split-text__char",wrap:!1,wrapClass:!1,dropCapSelector:".has-drop-cap",reduceWhiteSpace:!0};class n{constructor({container:t,attributeSelector:i="data-arts-split-text-options",options:s}){this._data=e,t instanceof HTMLElement&&this._transformOptions({container:t,attributeSelector:i,options:s})}get data(){return this._data}set data(t){this._data=t}_transformOptions({container:i,attributeSelector:s,options:a}){if(!i)return{};let r={};if(a&&e&&(r=t(e,a)),s){let e;e="DATA"===s?function(t,e={separator:"-",pattern:/^/}){let i={};var s;return void 0===e.separator&&(e.separator="-"),Array.prototype.slice.call(t.attributes).filter((s=e.pattern,function(t){let e;return e=/^data\-/.test(t.name),void 0===s?e:e&&s.test(t.name.slice(5))})).forEach((function(t){t.name.slice(5).split(e.separator).reduce((function(e,i,s,n){return"data"===i?e:(s===n.length-1?e[i]=t.value:e[i]=e[i]||{},e[i])}),i)})),i}(i):n.parseOptionsStringObject(i.getAttribute(s)),e&&0!==Object.keys(e).length&&(e=n.transformPluginOptions(e),r=t(r,e))}this.data=r}static parseOptionsStringObject(t){let e={};if(!t)return e;try{e=JSON.parse(n.convertStringToJSON(t))}catch(e){console.warn(`${t} is not a valid parameters object`)}return e}static convertStringToJSON(t){if(t)return t.replace(/'/g,'"').replace(/(?=[^"]*(?:"[^"]*"[^"]*)*$)(\w+:)|(\w+ :)/g,(function(t){return'"'+t.substring(0,t.length-1)+'":'}))}static transformPluginOptions(t){return t}}class a{static getElementByStringSelector(t,e=document){if("string"==typeof t){const i=e.querySelector(t);if(i&&null!==i)return i}return t}static getElementsInContainer(t,e){return"string"==typeof e&&t&&null!==t?[...t.querySelectorAll(e)]:[...e]}}function r(t,e=!1){return(e?t.toLowerCase():t).replace(/(?:^|\s|["'([{])+\S/g,(t=>t.toUpperCase()))}class o{constructor({container:t,options:e={}}){this._enabled=!1,this._initialized=!1,t&&e&&(this._updateContainerElement(t),this._updateOptions(t,e),this._updateSplitTarget())}get enabled(){return this._enabled}set enabled(t){this._enabled=t}get initialized(){return this._initialized}set initialized(t){this._initialized=t}get containerElement(){return this._containerElement}set containerElement(t){this._containerElement=t}_updateContainerElement(t){this.containerElement=a.getElementByStringSelector(t)}get options(){return this._options}set options(t){this._options=t}_updateOptions(t,e){this.options=new n({container:t,attributeSelector:"data-arts-split-text-options",options:e}).data}get matchMedia(){return this._matchMedia}set matchMedia(t){this._matchMedia=t}get splitTarget(){return this._splitTarget}set splitTarget(t){this._splitTarget=t}_updateSplitTarget(){const t=this.containerElement.children;t.length>0?([...t].forEach((t=>{t instanceof HTMLElement&&(t.matches("ul")||t.matches("ol"))&&(this._wrapListElements(t),t.dataset.artsSplitTextElement="list")})),this.splitTarget=[...t]):this.splitTarget=[this.containerElement]}get splitInstance(){return this._splitInstance}set splitInstance(t){this._splitInstance=t,this.containerElement.dataset.artsSplitTextReady=null===t?"false":"true"}_updateSplitInstance(){this.splitInstance=new SplitText(this.splitTarget,{type:this.options.type,reduceWhiteSpace:this.options.reduceWhiteSpace})}_markSplitTextElements(){"chars"in this.splitInstance&&this.splitInstance.chars.length>0&&this.splitInstance.chars.forEach((t=>{t instanceof HTMLElement&&"string"==typeof this.options.charClass&&t.classList.add(this.options.charClass)})),"words"in this.splitInstance&&this.splitInstance.words.length>0&&this.splitInstance.words.forEach((t=>{t instanceof HTMLElement&&"string"==typeof this.options.wordClass&&t.classList.add(this.options.wordClass)})),"lines"in this.splitInstance&&this.splitInstance.lines.length>0&&this.splitInstance.lines.forEach((t=>{t instanceof HTMLElement&&"string"==typeof this.options.lineClass&&t.classList.add(this.options.lineClass)}))}_wrapSplitTextElements(){if(this.options.wrap&&"string"==typeof this.options.wrap){let t="";"string"==typeof this.options.wrap&&(t=this.options.wrap.slice(0,-1).toLowerCase()),this.splitInstance[this.options.wrap].forEach((e=>{if(e instanceof HTMLElement){const i=document.createElement("div");"string"==typeof this.options.wrapClass&&i.classList.add(this.options.wrapClass),i.classList.add(`js-arts-split-text__wrapper-${t}`),this._wrap(e,i)}}))}}_wrapListElements(t){[...t.querySelectorAll("li")].forEach((t=>{if(t instanceof HTMLElement){const e=document.createElement("div");e.dataset.artsSplitTextElement="wrapperLi",this._wrapInner(t,e)}}))}_wrap(t,e){t.parentNode&&(t.parentNode.insertBefore(e,t),e.appendChild(t))}_wrapInner(t,e){for(t.appendChild(e);t.firstChild!==e;)t.firstChild&&e.appendChild(t.firstChild)}_handleDropCap(){if("string"==typeof this.options.dropCapSelector){const t=this.containerElement.querySelectorAll(this.options.dropCapSelector);t.length>0&&[...t].forEach((t=>{const e=t.innerHTML[0],i=t.innerHTML.slice(1,-1);t.innerHTML=`<span data-arts-split-text-element="wrapperDropCap">${e}</span>${i}`}))}}_set(){if("artsSplitTextState"in this.containerElement.dataset&&"string"==typeof this.containerElement.dataset.artsSplitTextState){const{animationName:t,selector:e,x:i,y:s,autoAlpha:n}=JSON.parse(decodeURIComponent(this.containerElement.dataset.artsSplitTextState)),a={selector:e,duration:0,x:i,y:s,autoAlpha:n};gsap.effects[t](this.containerElement,a)}else if(this.options.set&&"type"in this.options.set&&"string"==typeof this.options.set.type){const t=`hide${r(this.options.set.type)}`;if(t in gsap.effects&&"function"==typeof gsap.effects[t]){const e={[this.options.set.direction]:"number"==typeof this.options.set.distance?`${this.options.set.distance}px`:this.options.set.distance,duration:0};"number"==typeof this.options.set.opacity&&(e.opacity=this.options.set.opacity),gsap.effects[t](this.containerElement,e)}}}}class c{constructor({condition:t,callbackMatch:e,callbackNoMatch:i}){this._handlers={change:this._onChange.bind(this)},this.condition=t,this.callbacks={match:e,noMatch:i},(this._hasMatchFunction()||this._hasNoMatchFunction())&&this.init()}init(){this.mediaQuery=this._addMatchMedia(),this._attachEvents()}destroy(){this._detachEvents(),this.mediaQuery=null}get mediaQuery(){return this._mediaQuery}set mediaQuery(t){this._mediaQuery=t}get callbacks(){return this._callbacks}set callbacks(t){this._callbacks=t}get condition(){return this._condition}set condition(t){this._condition=t}_hasMatchFunction(){return"function"==typeof this.callbacks.match}_hasNoMatchFunction(){return"function"==typeof this.callbacks.noMatch}_addMatchMedia(){return window.matchMedia(`${this.condition}`)}_attachEvents(){"function"==typeof this.mediaQuery.addEventListener?this.mediaQuery.addEventListener("change",this._handlers.change):this.mediaQuery.addListener(this._handlers.change)}_detachEvents(){"function"==typeof this.mediaQuery.removeEventListener?this.mediaQuery.removeEventListener("change",this._handlers.change):this.mediaQuery.removeListener(this._handlers.change)}_onChange(t){t.matches?this._hasMatchFunction()&&this.callbacks.match():t.matches||this._hasNoMatchFunction()&&this.callbacks.noMatch()}}gsap.registerPlugin(ScrollTrigger),gsap.registerPlugin(SplitText);var l=function(t,e){var i={};for(var s in t)Object.prototype.hasOwnProperty.call(t,s)&&e.indexOf(s)<0&&(i[s]=t[s]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var n=0;for(s=Object.getOwnPropertySymbols(t);n<s.length;n++)e.indexOf(s[n])<0&&Object.prototype.propertyIsEnumerable.call(t,s[n])&&(i[s[n]]=t[s[n]])}return i};i(76),i(549),new class{constructor({duration:t,ease:e,hideWithOpacity:i,linesSelector:s,wordsSelector:n,charsSelector:a}={duration:1.2,ease:"power4.out",hideWithOpacity:1,linesSelector:".js-arts-split-text__line",wordsSelector:".js-arts-split-text__word",charsSelector:".js-arts-split-text__char"}){this._animations={},this._options={duration:t,ease:e,hideWithOpacity:i,linesSelector:s,wordsSelector:n,charsSelector:a},this._animations={lines:{selector:this._options.linesSelector,duration:this._options.duration,ease:this._options.ease,x:0,y:0,autoAlpha:1,stagger:{amount:.08}},words:{selector:this._options.wordsSelector,duration:this._options.duration,ease:this._options.ease,x:0,y:0,autoAlpha:1,stagger:{amount:.2}},chars:{selector:this._options.charsSelector,duration:this._options.duration,ease:this._options.ease,x:0,y:0,autoAlpha:1,stagger:{from:"end",axis:"x",amount:.3}}},this._registerAnimations()}_registerAnimations(){for(const t in this._animations){const e=r(t),i=`animate${e}`,s=`hide${e}`;gsap.registerEffect({name:i,effect:this._effect,defaults:Object.assign(Object.assign({},this._animations[t]),{animationName:i,type:"reveal"}),extendTimeline:!0}),gsap.registerEffect({name:s,effect:this._effect,defaults:Object.assign(Object.assign({},this._animations[t]),{animationName:s,y:"-103%",autoAlpha:this._options.hideWithOpacity,type:"hide"}),extendTimeline:!0})}gsap.registerEffect({name:"animateCharsDirectional",effect:this._effectCharsDirectional,defaults:Object.assign(Object.assign({},this._animations.chars),{stagger:{from:"auto",amount:.3},animationName:"animateCharsDirectional",type:"reveal"}),extendTimeline:!0}),gsap.registerEffect({name:"hideCharsDirectional",effect:this._effectCharsDirectional,defaults:Object.assign(Object.assign({},this._animations.chars),{y:"-103%",autoAlpha:this._options.hideWithOpacity,animationName:"hideCharsDirectional",type:"hide"}),extendTimeline:!0})}_effect(t,e){const i=gsap.timeline({defaults:{duration:0}});if(t&&t[0]){const s=()=>[...t[0].querySelectorAll(e.selector)],{selector:n}=e,a=l(e,["selector"]);if("type"in e){const i=a.onStart,s=a.onComplete;"reveal"===e.type&&(a.onStart=()=>{"function"==typeof i&&i(),t[0].classList.remove("split-text-animation-hidden")},a.onComplete=()=>{"function"==typeof s&&s(),t[0].classList.remove("split-text-animation-hidden"),t[0].classList.add("split-text-animation-revealed")}),"hide"===e.type&&(a.onStart=()=>{"function"==typeof i&&i(),t[0].classList.remove("split-text-animation-revealed")},a.onComplete=()=>{"function"==typeof s&&s(),t[0].classList.remove("split-text-animation-revealed"),t[0].classList.add("split-text-animation-hidden")}),delete a.type}return 0===a.duration?i.add((()=>{t[0].dataset.artsSplitTextState=encodeURIComponent(JSON.stringify(e)),delete a.stagger,delete a.duration,delete a.animationName,delete a.selector,gsap.set(s(),a)})):(delete a.animationName,delete a.selector,i.to({},{delay:a.delay,duration:a.duration,ease:a.ease,onStart:()=>{t[0].dataset.artsSplitTextState=encodeURIComponent(JSON.stringify(e)),delete a.delay,i.to(s(),a,"<")}}))}return i}_effectCharsDirectional(t,e){if(t&&t[0]){const i=[...t[0].querySelectorAll(e.selector)];if(i.length){const{selector:t}=e,s=l(e,["selector"]);if("stagger"in s&&"from"in s.stagger&&"auto"===s.stagger.from){let t;switch(gsap.getProperty(i[0],"text-align")){case"left":default:t="start";break;case"center":t="center";break;case"right":t="end"}s.stagger=function(t){let e,i=t.ease,s=t.from||0,n=t.base||0,a=t.axis,r={center:.5,end:1}[s]||0;return function(o,c,l){if(!l)return 0;let h,p,d,u,f,m,g,y,_,b,S,E=l.length;if(!e){for(e=[],g=_=1/0,y=b=-g,S=[],m=0;m<E;m++)f=l[m].getBoundingClientRect(),d=(f.left+f.right)/2,u=(f.top+f.bottom)/2,d<g&&(g=d),d>y&&(y=d),u<_&&(_=u),u>b&&(b=u),S[m]={x:d,y:u};for(h=isNaN(s)?g+(y-g)*r:S[s].x||0,p=isNaN(s)?_+(b-_)*r:S[s].y||0,y=0,g=1/0,m=0;m<E;m++)d=S[m].x-h,u=p-S[m].y,e[m]=f=a?Math.abs("y"===a?u:d):Math.sqrt(d*d+u*u),f>y&&(y=f),f<g&&(g=f);e.max=y-g,e.min=g,e.v=E=t.amount||t.each*E||0,e.b=E<0?n-E:n}return E=(e[o]-e.min)/e.max,e.b+(i?i.getRatio(E):E)*e.v}}({from:t,amount:s.stagger.amount})}return 0===s.duration?gsap.set(i,s):gsap.to(i,s)}}}};const h=class extends o{constructor(t,e={}){super({container:t,options:e}),this.options.init&&(this.options.matchMedia&&!window.matchMedia(`${this.options.matchMedia}`).matches?this.matchMedia=new c({condition:this.options.matchMedia,callbackMatch:this.init.bind(this)}):this.init())}init(){this.initialized||(this.matchMedia&&this.matchMedia.destroy(),this.options.matchMedia&&(this.matchMedia=new c({condition:this.options.matchMedia,callbackMatch:this.init.bind(this),callbackNoMatch:this.destroy.bind(this)})),this._handleDropCap(),this._updateSplitInstance(),this._markSplitTextElements(),this._wrapSplitTextElements(),this._set(),this.initialized=!0,this.enabled=!0)}destroy(){this.enabled=!1,this.initialized=!1,this.splitInstance&&this.splitInstance.revert()}}})(),this.ArtsSplitText=s.default})();