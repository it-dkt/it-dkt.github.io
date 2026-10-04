// yatsuka.js
// Event functions shared by all scenes of 八束村奇譚.
// Load this after avg.js in each scene's HTML.

const PERSON_IMG_CLASS = 'img-person1';

// overlay the person's image on the scene image (img/person-<name>.png)
const showPersonImage = function (name) {
	$('#image-area .' + PERSON_IMG_CLASS).remove();

	const img = $('<img>', {
		src: '../img/person-' + name + '.png',
		addClass: PERSON_IMG_CLASS
	});
	$('#image-area').append(img);
};

// show the person and switch to person mode
const showPerson = function (name) {
	showPersonImage(name);
	setPersonMode(name);
	getCommands(getSceneId());
	return true;
};

sceneEvents.showShizu = function () { return showPerson('shizu'); };
sceneEvents.showGenzo = function () { return showPerson('genzo'); };
sceneEvents.showOtatsu = function () { return showPerson('otatsu'); };
sceneEvents.showKenta = function () { return showPerson('kenta'); };

// remove the person and go back to normal mode
sceneEvents.hidePerson = function () {
	$('#image-area .' + PERSON_IMG_CLASS).remove();
	setPersonMode('');
	getCommands(getSceneId());
	return true;
};

// ending: show the sister without any commands
sceneEvents.showMisaEnding = function () {
	showPersonImage('misa');
	return true;
};

sceneEvents.clearGame = function () {
	$('#command-area').html('');
	return true;
};

sceneEvents.gotoBadEnd = function () {
	window.location.href = '../scenes/00012.html';
	return true;
};

sceneEvents.gotoTrueEnd = function () {
	window.location.href = '../scenes/00011.html';
	return true;
};

// retry from the underground shrine, keeping the player's flag
sceneEvents.retryFromCave = function () {
	window.location.href = '../scenes/00010.html';
	return true;
};

// staff roll after the true ending
sceneEvents.gotoEnding = function () {
	window.location.href = '../scenes/ending.html';
	return true;
};

// back to the title page with the flag cleared
sceneEvents.backToTitle = function () {
	setFlag('');
	window.location.href = '../index.html';
	return true;
};
