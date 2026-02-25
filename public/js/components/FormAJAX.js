export default class FormAJAX extends BaseComponent {
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
				pristine: {
					classTo: 'input-float', // class of the parent element where the error/success class is added
					errorClass: 'input-float_invalid',
					successClass: 'input-float_valid',
					errorTextParent: 'input-float', // class of the parent element where error text element is appended
					errorTextTag: 'span', // type of element to create for the error text
					errorTextClass: 'input-float__error' // class of the error text element
				}
			},
			// Component inner elements
			innerElements: {

			},
		});

		this.valid = true;
		this._handlers = {
			submit: this._onSubmit.bind(this),
			dismiss: this._onDismiss.bind(this)
		};

		this.messageSuccess = this.element.getAttribute('data-message-success');
		this.messageError = this.element.getAttribute('data-message-error');
		this.method = this.element.getAttribute('method');
		this.action = this.element.getAttribute('action');

		this.setup();
	}

	init() {
		if (!!this.options.pristine) {
			this._createPristine();
		}

		this._attachEvents();
	}

	_attachEvents() {
		this.element.addEventListener('submit', this._handlers.submit);
	}

	_detachEvents() {
		this.element.removeEventListener('submit', this._handlers.submit);
	}

	_onSubmit(event) {
		event.preventDefault();

		if (this.pristine) {
			// Check if the form is valid
			this.valid = this.pristine.validate();
		}

		if (this.valid) {
			this._fetch();
		}
	}

	_createPristine() {
		this.pristine = new Pristine(this.element, this.options.pristine);
	}

	_fetch() {
		const sendJson = this.element.hasAttribute('data-submit-json');
		const body = sendJson
			? JSON.stringify(Object.fromEntries(new FormData(this.element)))
			: new FormData(this.element);
		const headers = sendJson ? { 'Content-Type': 'application/json' } : {};

		fetch(this.action, {
			method: this.method,
			headers,
			body
		}).then((res) => {
			if (res.status >= 200 && res.status < 300) {
				this._onFetchSuccess();
			} else {
				this._onFetchError();
			}
		}).catch(() => {
			this._onFetchError();
		});
	}

	_onFetchSuccess() {
		this._createModal({
			template: this._getModalTemplate({
				icon: 'icon-success.svg',
				message: this.messageSuccess
			}),
			onDismiss: this._handlers.dismiss
		});
	}

	_onFetchError() {
		this._createModal({
			template: this._getModalTemplate({
				icon: 'icon-error.svg',
				message: this.messageError
			})
		});
	}

	_onDismiss() {
		this.element.reset();
	}

	_getModalTemplate({
		icon,
		message
	}) {
		return `
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content radius-img">
					<div class="modal__close p-3" data-bs-dismiss="modal" data-arts-cursor-follower-target="{scale: 'current', magnetic: 0.33}">
						<img src="img/modal/icon-close.svg" alt="">
					</div>
					<header class="text-center my-4">
						<img class="d-inline-block mb-4" src="img/modal/${icon}" width="80px" height="80px" alt=""/>
						<div class="modal__message h5">${message}</div>
					</header>
					<div class=">modal-content__wrapper-button">
						<button type="button" class="button button_solid button_fullwidth ui-element cursor-highlight" data-bs-dismiss="modal">
							<span class="button__label button__label-normal">
								<span class="button__title">OK</span>
							</span>
							<span class="button__label button__label-hover">
								<span class="button__title">OK</span>
							</span>
						</button>
					</div>
				</div>
			</div>
    `.trim();
	}

	_createModal({
		template,
		onDismiss
	}) {
		const modalElement = document.createElement('div');

		modalElement.id = 'modalContactForm';
		modalElement.className = 'modal';
		modalElement.innerHTML += template;

		document.body.appendChild(modalElement);

		const modal = new bootstrap.Modal(modalElement);

		modalElement.addEventListener('hidden.bs.modal', () => {
			if (typeof onDismiss === 'function') {
				onDismiss();
			}

			modal.dispose();
			modalElement.remove();

			app.utilities.scrollLock(false);
		});

		modalElement.addEventListener('shown.bs.modal', () => {
			app.utilities.scrollLock(true);
		});

		modal.show();
	}
}
