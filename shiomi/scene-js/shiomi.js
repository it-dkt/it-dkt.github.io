// shiomi.js
// Event functions shared by all scenes of 汐見港ノクターン.
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

const hidePersonImage = function () {
	$('#image-area .' + PERSON_IMG_CLASS).remove();
};

// show the person and switch to person mode
const showPerson = function (name) {
	showPersonImage(name);
	setPersonMode(name);
	getCommands(getSceneId());
	return true;
};

sceneEvents.showSaeko = function () { return showPerson('saeko'); };
sceneEvents.showGinji = function () { return showPerson('ginji'); };
sceneEvents.showKuroda = function () { return showPerson('kuroda'); };
sceneEvents.showOnizuka = function () { return showPerson('onizuka'); };
sceneEvents.showChizuru = function () { return showPerson('chizuru'); };

// remove the person and go back to normal mode
sceneEvents.hidePerson = function () {
	hidePersonImage();
	setPersonMode('');
	getCommands(getSceneId());
	return true;
};

// endings: show / hide a person's image without any commands
sceneEvents.showSaekoImage = function () {
	showPersonImage('saeko');
	return true;
};
sceneEvents.hideImage = function () {
	hidePersonImage();
	return true;
};

sceneEvents.clearGame = function () {
	$('#command-area').html('');
	return true;
};

// go to another scene, keeping the player's flag.
// registers goto00001 ... goto00019 (used as EVENT values in the MESSAGE table)
const gotoScene = function (sceneId) {
	window.location.href = '../scenes/' + sceneId + '.html';
	return true;
};
for (let i = 1; i <= 19; i++) {
	const sceneId = String(i).padStart(5, '0');
	sceneEvents['goto' + sceneId] = function () { return gotoScene(sceneId); };
}

// retry after a bad/normal ending, keeping the player's flag
sceneEvents.retryHub = function () { return gotoScene('00002'); };
sceneEvents.retryPier = function () { return gotoScene('00010'); };
sceneEvents.retryLighthouse = function () { return gotoScene('00013'); };

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
