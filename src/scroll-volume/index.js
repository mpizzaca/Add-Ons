class ScrollVolume extends Addon {
	constructor(...args) {
		super(...args);

		this.inject('site.player');
		this.createSettings();
	}

	onEnable() {
		this.createListener();
	}

	onDisable() {
		this.removeListeners();
	}

	createSettings() {
		this.settingsNamespace = 'addon.scroll-volume';
		this.settings.add(`${this.settingsNamespace}.stepValue`, {
			default: 5,
			ui: {
				path: 'Add-Ons > Scroll Volume >> Behavior',
				title: 'Volume Step Value',
				description: 'The amount to increase or decrease the volume with each scroll step (1-100).',
				component: 'setting-text-box',
				type: 'number',
				bounds: [1, 100],
			},
			changed: () => {
				this.removeListeners();
				this.createListener();
			}
		})
		this.settings.add(`${this.settingsNamespace}.scrollContainer`, {
			default: 'volume-slider',
			ui: {
				path: 'Add-Ons > Scroll Volume >> Behavior',
				title: 'Scroll Container',
				description: 'The area of the page to capture scroll events from.',
				component: 'setting-select-box',
				data: [
					{ value: 'player', title: 'Video Player' },
					{ value: 'volume-slider', title: 'Volume Slider' },
				]
			},
			changed: () => {
				this.removeListeners();
				this.createListener();
			}
		})
	}

	createListener() {
		const video = document.querySelector('video');
		if (!video) return;

		const videoContainer = this.getVideoContainer();
		const volumeSliderContainer = this.getVolumeSliderContainer();
		
		const volumeSlider = volumeSliderContainer?.querySelector('[id^="player-volume-slider-"]');
		const fiberKey = Object.keys(volumeSlider).find(k => k.startsWith('__reactFiber$'));
		const volumeSliderFiber = volumeSlider?.[fiberKey];
		if (!volumeSlider || !volumeSliderFiber) return;

		let node = volumeSliderFiber;
		while (node && !node.memoizedProps?.onChange) {
			node = node.return;
		}
		const props = node?.memoizedProps;
		if (!props) return;

		const showSliderStyle = document.createElement('style');
		showSliderStyle.textContent = `
			.volume-slider__slider-container {
				opacity: 1;
			}
		`;

		const step = this.settings.get(`${this.settingsNamespace}.stepValue`) / 100;
		const container = this.settings.get(`${this.settingsNamespace}.scrollContainer`) === 'player' ? videoContainer : volumeSliderContainer;

		container.onwheel = event => {
			event.preventDefault();

			// show volume slider
			// TODO: figure out how to make volume percentage tooltip appear when using the 'player' container option
			document.head.appendChild(showSliderStyle);
			clearTimeout(this._hideSliderTimeout);
			this._hideSliderTimeout = setTimeout(() => {
				showSliderStyle.remove();
			}, 1000);

			// adjust volume
			const delta = Math.sign(event.deltaY);
			let volume = video.volume - delta * step;
			volume = Math.min(Math.max(volume, 0), 1);
			props.onChange({ currentTarget: { value: volume } });
		};
	}

	removeListeners() {
		const videoContainer = this.getVideoContainer();
		if (videoContainer) {
			videoContainer.onwheel = null;
		}

		const volumeSliderContainer = this.getVolumeSliderContainer();
		if (volumeSliderContainer) {
			volumeSliderContainer.onwheel = null;
		}
	}

	getVideoContainer() {
		return document.querySelector('.video-player');
	}

	getVolumeSliderContainer() {
		return document.querySelector('.volume-slider__slider-container');
	}
}

ScrollVolume.register();
