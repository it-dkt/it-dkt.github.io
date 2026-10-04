// bgm.js
// A shared script loaded from each scene's HTML, designed so that avg.js itself
// does not need to be modified.
// Place <audio id="bgm-audio" src="..." data-track="room" loop></audio> in each
// scene's HTML, and this script takes care of autoplay, playback continuity
// across scenes, and the mute toggle.

(function () {
	const BGM_TIME_KEY = 'yatsuka:AVG_BGM_TIME';
	const BGM_TRACK_KEY = 'yatsuka:AVG_BGM_TRACK';
	const BGM_MUTED_KEY = 'yatsuka:AVG_BGM_MUTED';

	document.addEventListener('DOMContentLoaded', function () {
		const audio = document.getElementById('bgm-audio');
		if (!audio) return;

		const track = audio.dataset.track || audio.currentSrc || audio.src;

		// Restore the mute state (keep the setting even across scene changes)
		if (sessionStorage.getItem(BGM_MUTED_KEY) === 'true') {
			audio.muted = true;
		}

		// If the same track continues, resume from the position where it was
		// playing in the previous scene.
		// (If the track changes, e.g. switching to the ending theme after the
		//  escape succeeds, play it from the beginning.)
		const savedTrack = sessionStorage.getItem(BGM_TRACK_KEY);
		const savedTime = parseFloat(sessionStorage.getItem(BGM_TIME_KEY));
		if (savedTrack === track && !isNaN(savedTime)) {
			audio.currentTime = savedTime;
		}

		// Workaround for browser autoplay policies:
		// if play() is rejected outright, wait for the first user interaction
		// (a click) and start playback then.
		const tryPlay = function () {
			const p = audio.play();
			if (p && typeof p.catch === 'function') {
				p.catch(function () {
					const resume = function () {
						audio.play().catch(function () {});
						document.removeEventListener('click', resume, true);
					};
					document.addEventListener('click', resume, true);
				});
			}
		};
		tryPlay();

		// Save the playback position periodically, so the music can pick up
		// where it left off after moving to the next scene.
		const saveState = function () {
			try {
				sessionStorage.setItem(BGM_TRACK_KEY, track);
				sessionStorage.setItem(BGM_TIME_KEY, String(audio.currentTime));
			} catch (e) { /* ignore */ }
		};
		setInterval(saveState, 1000);
		window.addEventListener('pagehide', saveState);

		// Mute toggle button (fixed at the top right of the screen)
		const btn = document.createElement('button');
		btn.id = 'bgm-toggle';
		btn.textContent = audio.muted ? '🔇' : '🔊';
		btn.title = 'Toggle BGM on/off';
		Object.assign(btn.style, {
			position: 'fixed',
			top: '8px',
			right: '8px',
			zIndex: 9998,
			width: '36px',
			height: '36px',
			borderRadius: '50%',
			border: '1px solid white',
			background: 'rgba(0,0,0,0.6)',
			color: 'white',
			fontSize: '16px',
			cursor: 'pointer'
		});
		btn.addEventListener('click', function () {
			audio.muted = !audio.muted;
			sessionStorage.setItem(BGM_MUTED_KEY, audio.muted ? 'true' : 'false');
			btn.textContent = audio.muted ? '🔇' : '🔊';
			if (!audio.muted) {
				audio.play().catch(function () {});
			}
		});
		document.body.appendChild(btn);
	});
})();
