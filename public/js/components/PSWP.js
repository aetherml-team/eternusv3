export default class PSWP extends BaseComponent {
	constructor({
		name,
		loadInnerComponents,
		parent,
		element
	}) {
		super({
			name,
			loadInnerComponents,
			parent,
			element,
			// External options from app.options.gallery
			defaults: app.options.gallery,
			// Component inner elements
			innerElements: {

			}
		});

		this._handlers = {
			itemData: this._onItemData.bind(this),
			contentLoad: this._onContentLoad.bind(this),
			contentActivate: this._onContentActivate.bind(this),
			contentDeactivate: this._onContentDeactivate.bind(this),
			firstUpdate: this._onFirstUpdate.bind(this),
			beforeOpen: this._onBeforeOpen.bind(this),
			close: this._onClose.bind(this),
			uiRegister: this._onUIRegister.bind(this),
			pointerDown: this._onPointerDown.bind(this),
			pointerMove: this._onPointerMove.bind(this),
			pointerUp: this._onPointerUp.bind(this),
		};
		this._patterns = {
			image: /[^\s]+(\.(jpg|jpeg|jfif|pjpeg|pjp|bmp|gif|png|apng|webp|svg))/g,
			video: /[^\s]+(\.(mp4|ogv|webm))/g,
			// fallback $1 /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/)([^&|?|\/]*)/g
			youtube: /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g, // $6
			vimeo: /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/(?:.*\/)?(.+)/g // $1
		};

		this.setup();
	}

	init() {
		this.updateRef('cursorRef', 'CursorFollower');

		this._createLightbox();
		this._attachEvents();
	}

	destroy() {
		this._detachEvents();
	}

	_attachEvents() {
		this.lightbox.on('contentLoad', this._handlers.contentLoad);
		this.lightbox.on('contentActivate', this._handlers.contentActivate);
		this.lightbox.on('contentDeactivate', this._handlers.contentDeactivate);
		this.lightbox.on('beforeOpen', this._handlers.beforeOpen);
		this.lightbox.on('firstUpdate', this._handlers.firstUpdate);
		this.lightbox.on('close', this._handlers.close);
		this.lightbox.on('uiRegister', this._handlers.uiRegister);

		this.lightbox.on('pointerDown', this._handlers.pointerDown);
		this.lightbox.on('pointerMove', this._handlers.pointerMove);
		this.lightbox.on('pointerUp', this._handlers.pointerUp);
	}

	_detachEvents() {
		if (this.lightbox) {
			this.lightbox.destroy();
		}
	}

	_createLightbox() {
		this.lightbox = new PhotoSwipeLightbox({
			gallery: this.element,
			children: this.options.itemsSelector,
			bgOpacity: this.options.bgOpacity,
			initialZoomLevel: this.options.initialZoomLevel,
			secondaryZoomLevel: this.options.secondaryZoomLevel,
			maxZoomLevel: this.options.maxZoomLevel,
			arrowPrev: !this._shouldDisableDefaultUIElement('arrows'),
			arrowNext: !this._shouldDisableDefaultUIElement('arrows'),
			zoom: !this._shouldDisableDefaultUIElement('zoom'),
			close: !this._shouldDisableDefaultUIElement('close'),
			counter: !this._shouldDisableDefaultUIElement('counter'),
			preloader: !this._shouldDisableDefaultUIElement('preloader'),
			pswpModule: PhotoSwipe
		});
		this.lightbox.addFilter('itemData', this._handlers.itemData);
		this.lightbox.init();
	}

	_onPointerDown(event) {
		this.updateRef('cursorRef', 'CursorFollower');

		if (this.cursorRef && this.cursorRef.instance) {
			this.cursorRef.instance.updateMouse(event.originalEvent);
		}
	}

	_onPointerMove(event) {
		if (this.cursorRef && this.cursorRef.instance) {
			this.cursorRef.instance.updateMouse(event.originalEvent);
		}
	}
	_onPointerUp(event) {
		if (this.cursorRef && this.cursorRef.instance) {
			this.cursorRef.instance.updateMouse(event.originalEvent);
		}
	}

	_onBeforeOpen() {
		app.utilities.scrollLock(true);

		app.utilities.dispatchEvent('arts/container/visibility', {
			detail: {
				container: app.containerEl,
				visible: false
			}
		});
	}

	_onFirstUpdate() {
		if (typeof this.options.colorTheme === 'string') {
			this.lightbox.pswp.element.setAttribute('data-arts-color-theme', this.options.colorTheme);
		}
	}

	_shouldDisableDefaultUIElement(name) {
		return !this.options[name] || (!!this.options[name] && !!this.options[name].custom);
	}

	_onUIRegister() {
		if (!!this.options.close && this._shouldDisableDefaultUIElement('close')) {
			this._registerUIClose();
		}

		if (!!this.options.arrows && this._shouldDisableDefaultUIElement('arrows')) {
			this._registerUIArrowPrev();
			this._registerUIArrowNext();
		}

		if (!!this.options.counter && this._shouldDisableDefaultUIElement('counter')) {
			this._registerUICounter();
		}

		if (!!this.options.captions) {
			this._registerUICaption();
		}

		if (!!this.options.preloader && this._shouldDisableDefaultUIElement('preloader')) {
			this._registerUIPreloader();
		}

		if (!!this.options.zoom && this._shouldDisableDefaultUIElement('zoom')) {
			this._registerUIZoom();
		}
	}

	_registerUIZoom() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customZoom',
			className: 'pswp-custom-button pswp-custom-button_left pswp-custom-button_zoom',
			appendTo: 'bar',
			tagName: 'a',
			onClick: 'toggleZoom',
			order: 20,
			onInit: (el, pswp) => {
				el.setAttribute('href', '#');
				el.setAttribute('rel', 'nofollow');

				let iconAttributes = '';

				if (typeof this.options.zoom.cursor === 'object') {
					const cursorAttributes = deepmerge({
						delegate: true
					}, this.options.zoom.cursor);

					el.setAttribute('data-arts-cursor-follower-target', JSON.stringify(cursorAttributes));
					iconAttributes = 'data-arts-cursor-follower-delegated="true"';
				}

				el.addEventListener('click', app.hoverEffect.preventDefault);
				el.innerHTML = `<div class="pswp-custom-button__zoom-icon material-icons zoom_in" ${iconAttributes}></div>`.trim();
			}
		});
	}

	_registerUIPreloader() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customPreloader',
			className: 'pswp-custom-button pswp-custom-preloader',
			appendTo: 'root',
			order: 7,
			onInit: (el, pswp) => {
				let isVisible;
				let delayTimeout;

				el.innerHTML = `<svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="24" fill="none"></circle></svg>`;

				const toggleIndicatorClass = (className, add) => {
					el.classList[add ? 'add' : 'remove']('pswp__preloader--' + className);
				};

				const setIndicatorVisibility = (visible) => {
					if (isVisible !== visible) {
						isVisible = visible;
						toggleIndicatorClass('active', visible);
					}
				};

				const updatePreloaderVisibility = () => {
					if (!pswp.currSlide.content.isLoading()) {
						setIndicatorVisibility(false);
						if (delayTimeout) {
							clearTimeout(delayTimeout);
							delayTimeout = null;
						}
						return;
					}

					if (!delayTimeout) {
						// display loading indicator with delay
						delayTimeout = setTimeout(() => {
							setIndicatorVisibility(pswp.currSlide.content.isLoading());
							delayTimeout = null;
						}, pswp.options.preloaderDelay);
					}
				};

				pswp.on('change', updatePreloaderVisibility);

				pswp.on('loadComplete', (e) => {
					if (pswp.currSlide === e.slide) {
						updatePreloaderVisibility();
					}
				});

				// expose the method
				pswp.ui.updatePreloaderVisibility = updatePreloaderVisibility;
			}
		});
	}

	_registerUICaption() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customCaption',
			className: 'pswp-custom-caption',
			order: 9,
			isButton: false,
			appendTo: 'root',
			html: '',
			onInit: (el, pswp) => {
				this.lightbox.pswp.on('change', () => {
					const currentSlideElement = this.lightbox.pswp.currSlide.data.element;

					let captionHTML = '';

					if (currentSlideElement) {
						const captionFromAttribute = currentSlideElement.getAttribute('data-caption');

						// Explicitly set caption
						if (captionFromAttribute) {
							captionHTML = `<div class="pswp-custom-caption__content">${captionFromAttribute}</div>`;
						} else {
							// Try to get caption from thumbnail alt attribute
							const currentImage = currentSlideElement.querySelector('img');

							if (currentImage) {
								const altContents = currentImage.getAttribute('alt');

								if (altContents && altContents.length) {
									captionHTML = `<div class="pswp-custom-caption__content">${altContents}</div>`;
								}
							}
						}
					}

					el.innerHTML = captionHTML || '';
				});
			}
		});
	}

	_registerUICounter() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customCounter',
			className: 'pswp-custom-button pswp-custom-button_left pswp-custom-button_counter',
			appendTo: 'bar',
			order: 5,
			onInit: (el, pswp) => {
				pswp.on('change', () => {
					el.innerText = (pswp.currIndex + 1) +
						pswp.options.indexIndicatorSep +
						pswp.getNumItems();
				});
			}
		});
	}

	_registerUIClose() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customClose',
			className: 'pswp-custom-button pswp-custom-button_right pswp-custom-button_close',
			appendTo: 'bar',
			tagName: 'a',
			onClick: 'close',
			order: 20,
			onInit: (el, pswp) => {
				el.setAttribute('href', '#');
				el.setAttribute('rel', 'nofollow');

				let wrapperLinesAttributes = '';

				if (typeof this.options.close.cursor === 'object') {
					const cursorAttributes = deepmerge({
						delegate: true
					}, this.options.close.cursor);

					el.setAttribute('data-arts-cursor-follower-target', JSON.stringify(cursorAttributes));
					wrapperLinesAttributes = 'data-arts-cursor-follower-delegated="true"';
				}

				el.addEventListener('click', app.hoverEffect.preventDefault);

				el.innerHTML = `
					<div class="pswp-custom-button__label me-2">
						<div class="pswp-custom-button__close-label-close">${this.options.close.label || ''}</div>
						<div class="pswp-custom-button__close-label-hover">${this.options.close.labelHover || ''}</div>
					</div>
					<div class="pswp-custom-button__close-wrapper-lines" ${wrapperLinesAttributes}>
						<div class="pswp-custom-button__close-line"></div>
						<div class="pswp-custom-button__close-line"></div>
					</div>
				`.trim();
			}
		});
	}

	_registerUIArrowPrev() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customArrowPrev',
			className: 'slider-arrow pswp-custom-arrow-prev',
			appendTo: 'wrapper',
			tagName: 'div',
			onClick: 'prev',
			order: 10,
			onInit: (el, pswp) => {
				let buttonAttributes = '';

				if (typeof this.options.arrows.cursor === 'object') {
					buttonAttributes = `data-arts-cursor-follower-target=${JSON.stringify(this.options.arrows.cursor)}`;
				}

				el.innerHTML = `
					<button class="button-circle slider-arrow__button" ${buttonAttributes}>
						<span class="slider-arrow__inner">
							<svg class="svg-arrow svg-arrow_left" width="41" height="12" viewBox="0 0 41 12" xmlns="http://www.w3.org/2000/svg"><path d="M6 7v5L0 6l6-6v5h35v2z" fill-rule="evenodd"></path></svg>
						</span>
					</button>
				`.trim();
			}
		});
	}

	_registerUIArrowNext() {
		this.lightbox.pswp.ui.registerElement({
			name: 'customArrowNext',
			className: 'slider-arrow pswp-custom-arrow-next',
			appendTo: 'wrapper',
			tagName: 'div',
			onClick: 'next',
			order: 11,
			onInit: (el, pswp) => {
				let buttonAttributes = '';

				if (typeof this.options.arrows.cursor === 'object') {
					buttonAttributes = `data-arts-cursor-follower-target=${JSON.stringify(this.options.arrows.cursor)}`;
				}

				el.innerHTML = `
					<button class="button-circle slider-arrow__button" ${buttonAttributes}>
						<span class="slider-arrow__inner">
							<svg class="svg-arrow svg-arrow_right" width="41" height="12" viewBox="0 0 41 12" xmlns="http://www.w3.org/2000/svg"><path d="M35 5V0l5.999 6L35 12V7H0V5z" fill-rule="evenodd"></path></svg>
						</span>
					</button>
				`.trim();
			}
		});
	}

	_onClose() {
		const delay = typeof this.lightbox.pswp.options.hideAnimationDuration === 'number' ? this.lightbox.pswp.options.hideAnimationDuration / 1000 : 0;

		app.utilities.scrollLock(false);

		this.updateRef('cursorRef', 'CursorFollower');

		if (this.cursorRef && this.cursorRef.instance) {
			this.cursorRef.instance.reset();
		}

		gsap.delayedCall(delay, () => {
			app.utilities.dispatchEvent('arts/container/visibility', {
				detail: {
					container: app.containerEl,
					visible: true
				}
			});
		});
	}

	_onItemData(itemData, index) {
		const
			autoplay = itemData.element.getAttribute('data-autoplay'),
			url = itemData.element.getAttribute('href');

		if (url) {
			const type = this._getMediaTypeFromURL(url);

			Object.assign(itemData, {
				type
			});
		}

		if (autoplay && autoplay !== 'false') {
			Object.assign(itemData, {
				autoplay: true
			});
		}

		if (itemData.type === 'image') {
			const el = itemData.element;
			const pswpW = parseInt(el.getAttribute('data-pswp-width'), 10);
			const pswpH = parseInt(el.getAttribute('data-pswp-height'), 10);
			const img = el.querySelector('img');
			let W = pswpW;
			let H = pswpH;

			if (!W || !H) {
				W = parseInt(img?.getAttribute('width'), 10) || img?.naturalWidth || 0;
				H = parseInt(img?.getAttribute('height'), 10) || img?.naturalHeight || 0;
			}

			if (W && H) {
				itemData.w = W;
				itemData.h = H;
				itemData.width = W;
				itemData.height = H;
			}
		}

		return itemData;
	}

	_onContentLoad(event) {
		const {
			content
		} = event;

		if (content.type && content.data.src && content.type !== 'image') {
			event.preventDefault();

			content.element = document.createElement('div');
			content.element.className = 'pswp__wrapper-embed';

			switch (content.type) {
				case 'video':
					/**
					 * Self hosted video
					 */
					this._renderHTML5Video(content.element, content.data.src, content.data.autoplay);
					break;

				case 'youtube':
					/**
					 * YouTube iFrame
					 */
					this._renderYouTubeIFrame(content.element, content.data.src, content.data.autoplay);
					break;

				case 'vimeo':
					/**
					 * Vimeo iFrame
					 */
					this._renderVimeoIFrame(content.element, content.data.src, content.data.autoplay);
					break;

				default:
					/**
					 * Fallback iFrame
					 */
					this._renderIFrame(content.element, content.data.src);
					break;
			}
		}
	}

	_onContentActivate(event) {
		const {
			content
		} = event;

		if (content.data.autoplay && content.index === content.instance.currIndex) {
			this._playVideo(content);
		}
	}

	_onContentDeactivate(event) {
		const {
			content
		} = event;

		this._pauseVideo(content);
	}

	_renderHTML5Video(element, src) {
		const video = document.createElement('video');

		video.setAttribute('src', src);
		video.setAttribute('controls', true);
		video.setAttribute('playsinline', true);
		video.setAttribute('autoplay', true);

		element.appendChild(video);
	}

	_renderYouTubeIFrame(element, src, autoplay = false) {
		const
			iframe = document.createElement('iframe'),
			param = autoplay ? 'autoplay=1' : '',
			url = src.replace(this._patterns.youtube, `https://www.youtube.com/embed/$6?${param}&enablejsapi=1`);

		iframe.className = 'iframe-youtube';
		iframe.setAttribute('width', '100%');
		iframe.setAttribute('height', '100%');
		iframe.setAttribute('src', url);
		iframe.setAttribute('frameborder', '0');
		iframe.setAttribute('allow', 'autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen');

		element.appendChild(iframe);
	}

	_renderVimeoIFrame(element, src, autoplay = false) {
		const
			iframe = document.createElement('iframe'),
			param = autoplay ? 'autoplay=1' : '',
			url = src.replace(this._patterns.vimeo, `https://player.vimeo.com/video/$1?${param}`);

		iframe.className = 'iframe-vimeo';
		iframe.setAttribute('width', '100%');
		iframe.setAttribute('height', '100%');
		iframe.setAttribute('src', url);
		iframe.setAttribute('frameborder', '0');
		iframe.setAttribute('allow', 'autoplay; fullscreen');

		element.appendChild(iframe);
	}

	_renderIFrame(element, src) {
		const iframe = document.createElement('iframe');

		iframe.setAttribute('width', '100%');
		iframe.setAttribute('height', '100%');
		iframe.setAttribute('src', src);
		iframe.setAttribute('frameborder', '0');
		iframe.setAttribute('allow', 'autoplay; fullscreen');

		element.appendChild(iframe);
	}

	_getMediaTypeFromURL(url) {
		for (const [name, pattern] of Object.entries(this._patterns)) {
			if (url.match(pattern)) {
				return `${name}`;
			}
		}

		return 'iframe';
	}

	_playVideo(content) {
		switch (content.type) {
			case 'video': {
				const video = content.element.querySelector('video');

				this._playHTMLVideo(video);
				break;
			}
			/**
			 * YouTube iFrame
			 */
			case 'youtube': {
				const iframe = content.element.querySelector('iframe');

				if (iframe) {
					if (iframe.contentWindow) {
						this._playIFrameYouTube(iframe);
					} else {
						iframe.onload = () => {
							setTimeout(() => {
								this._playIFrameYouTube(iframe);
							}, 100);
						};
					}
				}
				break;
			}

			/**
			 * Vimeo iFrame
			 */
			case 'vimeo': {
				const iframe = content.element.querySelector('iframe');

				if (iframe) {
					if (iframe.contentWindow) {
						this._playIFrameVimeo(iframe);
					} else {
						iframe.addEventListener('load', () => {
							this._playIFrameVimeo(iframe);
						}, true);
					}
				}
				break;
			}
		}
	}

	_pauseVideo(content) {
		switch (content.type) {
			case 'video': {
				const video = content.element.querySelector('video');

				this._pauseHTMLVideo(video);
				break;
			}
			/**
			 * YouTube iFrame
			 */
			case 'youtube': {
				const iframe = content.element.querySelector('iframe');

				if (iframe) {

					if (iframe.contentWindow) {
						this._pauseIFrameYouTube(iframe);
					} else {
						iframe.onload = () => this._pauseIFrameYouTube(iframe);
					}
				}
				break;
			}

			/**
			 * Vimeo iFrame
			 */
			case 'vimeo': {
				const iframe = content.element.querySelector('iframe');

				if (iframe) {
					if (iframe.contentWindow) {
						this._pauseIFrameVimeo(iframe);
					} else {
						iframe.onload = () => this._pauseIFrameVimeo(iframe);
					}
				}
				break;
			}
		}
	}

	_playHTMLVideo(video) {
		if (video && typeof video.play === 'function') {
			video.play();
		}
	}

	_pauseHTMLVideo(video) {
		if (video && typeof video.pause === 'function') {
			video.pause();
		}
	}

	_playIFrameYouTube(iframe) {
		iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
	}

	_pauseIFrameYouTube(iframe) {
		iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
	}

	_playIFrameVimeo(iframe) {
		iframe.contentWindow.postMessage('{"method":"play"}', '*');
	}

	_pauseIFrameVimeo(iframe) {
		iframe.contentWindow.postMessage('{"method":"pause"}', '*');
	}
}
