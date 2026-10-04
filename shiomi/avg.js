// constants
const FLAG_KEY = 'shiomi:AVG_FLAG_KEY';
const MOVE_COMMAND_MODE = 2;
const MESSAGE_WAIT_TIME = 75;
const MESSAGE_NEWLINE_CHAR = '@';
const MESSAGE_SPLIT_CHAR = ';'
const MESSAGE_EVENT_CHAR = '^';
const MESSAGE_PART_DIV = 'message-part-'
const MESSAGE_NEXT_LINK = '▼';
const DEFAULT_EVENT_STRING = 'empty_event';
const FORBIDDEN = 1;

// variables
let splitMsgs = []; 
let eventString = DEFAULT_EVENT_STRING;
let personMode = ''; 
let isOk = true;

$(document).ready(function () {
	initScene();
});

const initScene = function () {

	let flag = getFlag();
	let scene_id = getSceneId();

	// clear message area 
	$('#message-area').html('Loading...');

	// get initial message of the scene
	isOk = false;
	getMessage(scene_id, '000', '000', flag);
}

const getSceneId = function () {
	return $('#scene-id').val();
}

const getCommands = function (scene_id) {

	// default scene id is current scene's
	if(scene_id){
	}else{
		scene_id = getSceneId();
	}

	const data = {
		sceneId: scene_id,
	};
	// callback function of get commands api 
	const success = showCommands;

	if(getPersonMode(scene_id)){
		// api to get commands for person mode
		execAjax('api/command/person', data, success);
	}else{
		execAjax('api/command', data, success);
	}
}

// show commands of the scene or show targets of the seleced command
const showCommands = function (data, dataType) {

	// show message returned with the commands.
	showMessage(data);

	// clear command list
	$('#command-list').empty();
	// create command links
	const commands = data['commands'];
	commands.forEach(command => {
		// target_id of top level command is not set.
		const target_id = command.targetId ? command.targetId : '';

		// the id of command DOM element is command_id (ex.'CHK')
		// or command_id + target_id (ex.'CHK001')
		const link = $('<li></li>', {
			id: command.commandId + target_id
		});
		
		// set command mode
		$(link).attr('command-mode', command.mode);
		// set forbidden flag
		if(command.forbidden == FORBIDDEN){
			$(link).attr('forbidden', command.forbidden);
		}

		// set disabled if locked
		if(!isOk)
			link.addClass('disabled');

		$(link).text(command.text);

		$('#command-list').append(link);
	});

	// register event fires where the player select a command
	$('#command-list li').each(function (index, element) {
		const link_id = element.id;
		const command_id = link_id.substring(0, 3);
		const target_id = link_id.substring(3, 6);

		// get command mode
		const mode = element.getAttribute('command-mode');
		// get forbidden flag
		const isForbidden = element.getAttribute('forbidden');

		if (mode == MOVE_COMMAND_MODE && target_id && isForbidden != FORBIDDEN) {
			// if the command is the one to go to other scenes, and
			//    the target_id (where to go) is set, and
			//    the target is not forbidden,
			// go to the scene. 
			$(element).on('click', { link_id: link_id }, onChangeScene);
		} else {
			$(element).on('click', { link_id: link_id }, onClickCommand);
		}

		// hover style
		$(element).on('touchstart mouseover', function () {
			$(this).addClass('touch');
		});
		$(element).on('touchend mouseleave', function () {
			$(this).removeClass('touch');
		});
	});
}

const onChangeScene = function (e) {
	// lock
	if (isOk) { isOk = false; } else { return false; }

	const link_id = e.data.link_id;

	const scene_id = getSceneId();
	const command_id = link_id.substring(0, 3);
	const target_id = link_id.substring(3, 6);

	// data for api
	const data = {
		sceneId: scene_id,
		commandId: command_id,
		targetId: target_id
	};

	// callback
	const success = function (data, dataType) {
		var path = data['path'];
		window.location.href = path;
	}

	// the api returns the path of destination scene html
	execAjax('api/scene/dest', data, success);
}

const onClickCommand = function (e) {
	// lock
	if (isOk) { isOk = false; } else { return false; }

	const link_id = e.data.link_id;

	const scene_id = getSceneId();
	const command_id = link_id.substring(0, 3);
	const target_id = link_id.substring(3, 6);

	const flag = getFlag();
	const person = getPersonMode();

	// request data for api
	const data = {
		sceneId: scene_id,
		commandId: command_id,
		flag: flag
	};

	let success = null;
	if (target_id) {
		// callback: when tartget_id is set in the id attributge of clicked element (ex: 'CHK001')
		success = function (data, dataType) {
			// show the result of executing the command to the target
			getMessage(scene_id, command_id, target_id, flag);
			// get top level command again
			getCommands(scene_id);
		}

	} else {
		// callback: when tartget_id is NOT set (ex: 'CHK')
		success = function (data, dataType) {
			if(data.commands && data.commands.length > 0){
				// if some targets returned, show them 
				showCommands(data);
			}else{
				// if no target returned, only show the default message
				showMessage(data);
			}
		}
	}

	// get targets api
	execAjax('api/target', data, success);
}

const getMessage = function (scene_id, command_id, target_id, flag) {

	const data = {
		sceneId: scene_id,
		commandId: command_id,
		targetId: target_id,
		flag: flag
	};

	// callback
	const success = function (data, dataType) {
		showMessage(data);
	}

	// get messages api
	execAjax('api/message', data, success);
}

// call backend api
const execAjax = function (url, pData, pSuccess, pError) {

	// default callback
	let success = function (data, dataType) {
		alert(data);
	}

	if (pSuccess) {
		success = pSuccess;
	}

	// default error callback
	const error = function (XMLHttpRequest, textStatus, errorThrown) {
		alert('Error : ' + errorThrown);
		$("#XMLHttpRequest").html("XMLHttpRequest : " + XMLHttpRequest.status);
		$("#textStatus").html("textStatus : " + textStatus);
		$("#errorThrown").html("errorThrown : " + errorThrown);
	}

	if (pError) {
		error = pError;
	}

	(window.AVG_LOCAL_AJAX || $.ajax)({
		type: "GET",
		url: url,
		data: pData,
		success: success,
		error: error
	});
}

const showMessage = function (data) {

	const msg = data['message'];
	const flag = data['flag'];
	const event = data['event'];

	// update the player's flag value
	if (flag) {
		sessionStorage[FLAG_KEY] = flag;
	}

	if (event) {
		eventString = event;
	}

	if (msg) {
		splitMsgs = msg.split(MESSAGE_SPLIT_CHAR);
		//console.log(splitMsgs);
		showMessagePart(0);
	}
}

// show messages splited by the defined charactor
const showMessagePart = function (part_index, eventIndex = 0) {

	const div_selector = '#message-area';
	const messagePart = splitMsgs[part_index];
	//console.log('part text : ' + text);

	// clear message area 
	$(div_selector).html('');

	let index = 0;
	let eventCount = 0;

	// show charactors one by one
	const write_text = function () {
		// if matches defined controll charactors
		if (messagePart.charAt(index) == MESSAGE_NEWLINE_CHAR) {
			// new line
			$(div_selector).html($(div_selector).html() + '<br/>');
		} else if (messagePart.charAt(index) == MESSAGE_EVENT_CHAR) {
			// execute event
			//console.log(`# index=${index} executing eventIndex=${eventIndex + eventCount}`);
			execEvent(eventIndex + eventCount);
			eventCount++;
		} else {
			// normal charactors
			$(div_selector).html($(div_selector).html() + messagePart.charAt(index));
			//console.log(index + ' : ' + messagePart.charAt(index));
		}

		index++;
		if (messagePart.length > index) {
			// show next charactor
			setTimeout(write_text, MESSAGE_WAIT_TIME);
		} else {
			// the end of the message part
			if (splitMsgs.length > (part_index + 1)) {
				// create link to next part
				const next_link = $('<a></a>');
				next_link.attr('href', 'javascript:void(0);');
				next_link.text(MESSAGE_NEXT_LINK);
				next_link.on('click', function () {
					showMessagePart(part_index + 1, eventIndex + eventCount);
				});

				$(div_selector).append($('<br/>'));
				$(div_selector).append(next_link);
			} else {
				// if all of parts are shown, unlock command
				isOk = true;
				// remove disabled class
				$('#command-list li').each(function(i, elm){
					$(elm).removeClass('disabled');
				});
				// clear events
				eventString = DEFAULT_EVENT_STRING;
			}
		}
	}

	setTimeout(write_text, MESSAGE_WAIT_TIME);
}

const setPersonMode = function (person_flag) {
	personMode = person_flag;
}

const getPersonMode = function () {
	return personMode;
}

const getFlag = function () {

	let flag = sessionStorage[FLAG_KEY];

	if (flag) {
		;
	} else {
		flag = '0'
		setFlag(flag);
	}

	return flag;
}

const setFlag = function (flag) {
	if (flag) {
		sessionStorage[FLAG_KEY] = flag;
	} else {
		sessionStorage.removeItem(FLAG_KEY);
	}
}

const execEvent = function (eventIndex) {

	if (eventString) {
		//console.log(`# eventString=${eventString} eventIndex=${eventIndex}`)
		let eventArray = eventString.split(',');
		if (sceneEvents[eventArray[eventIndex]] !== 'undefined') {
			sceneEvents[eventArray[eventIndex]](); 
		} else {
			alert(eventArray[eventIndex] + 'is NOT a function!');
		}
	}
}

// default event
const empty_event = function () { };

const sceneEvents = {
	getInitialCommands: function(){

		getCommands();
	},
	showSaveDialog: function(){

		showSaveDialog();
	},
	showLoadDialog: function(){

		showLoadDialog();
	}
};

/* --------------------------------------------------
* code for save/load below
* -------------------------------------------------- */

const SLOT_COUNT = 3;
const STORAGE_KEY = 'shiomi:avg_save_slot_';

function toast(msg) {
	let el = document.querySelector('.avg-save-toast');
	if (!el) {
		el = document.createElement('div');
		el.className = 'avg-save-toast';
		document.body.appendChild(el);
	}
	el.textContent = msg;
	el.classList.add('show');
	setTimeout(() => el.classList.remove('show'), 2500);
}

function loadSlot(slot) {
	const raw = localStorage.getItem(STORAGE_KEY + slot);
	return raw ? JSON.parse(raw) : null;
}

function saveSlot(slot, flag, sceneId) {
	const data = {
		flag,
		sceneId,
		savedAt: new Date().toISOString()
	};
	localStorage.setItem(STORAGE_KEY + slot, JSON.stringify(data));
}

function allSlots() {
	return Array.from({ length: SLOT_COUNT }, (_, i) => {
		const slot = i + 1;
		const data = loadSlot(slot);
		return { slot, ...(data ?? { flag: 0, sceneId: '', savedAt: null }) };
	});
}

function fmtDate(iso) {
	if (!iso) return '---';
	const d = new Date(iso);
	const pad = n => String(n).padStart(2, '0');
	return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} `
			+ `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


// dialog common base
function buildOverlay() {
	const overlay = document.createElement('div');
	overlay.id = 'avg-save-overlay';
	const dialog = document.createElement('div');
	dialog.id = 'avg-save-dialog';
	overlay.appendChild(dialog);
	document.body.appendChild(overlay);
	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});
	return dialog;
}

// save dialog
window.showSaveDialog = function () {
	document.getElementById('avg-save-overlay')?.remove();

	const dialog = buildOverlay();
	dialog.innerHTML = '<h2>💾 Save</h2>';

	allSlots().forEach(s => {
		const isEmpty = !s.sceneId;
		const row = document.createElement('div');
		row.className = 'avg-save-slot';

		const info = document.createElement('div');
		info.className = 'avg-save-slot-info';
		info.innerHTML = `<span><strong>Slot ${s.slot}</strong></span>`
		+ (isEmpty
			? '<span>Empty</span>'
			: `<span>${fmtDate(s.savedAt)}</span>`);

		const btn = document.createElement('button');
		btn.className = 'avg-save-slot-btn do-save';
		btn.textContent = isEmpty ? 'Write' : 'Overwrite';

		btn.addEventListener('click', () => {
			const flag = getFlag();
			const sceneId = getSceneId();

			if (!sceneId) { toast('ERROR: Can not get scene id.'); return; }
			saveSlot(s.slot, flag, sceneId);
			toast(`Saved to slot ${s.slot}.`);
			document.getElementById('avg-save-overlay')?.remove();
		});

		row.appendChild(info);
		row.appendChild(btn);
		dialog.appendChild(row);
	});

	const closeBtn = document.createElement('button');
	closeBtn.id = 'avg-save-close';
	closeBtn.textContent = 'Cancel';
	closeBtn.addEventListener('click', () => document.getElementById('avg-save-overlay')?.remove());
	dialog.appendChild(closeBtn);
};

// load dialog
window.showLoadDialog = function () {
	document.getElementById('avg-save-overlay')?.remove();

	const dialog = buildOverlay();
	dialog.innerHTML = '<h2>📂 Load</h2>';

	allSlots().forEach(s => {
		const isEmpty = !s.sceneId;
		const row = document.createElement('div');
		row.className = 'avg-save-slot';

		const info = document.createElement('div');
		info.className = 'avg-save-slot-info';
		info.innerHTML = `<span><strong>Slot ${s.slot}</strong></span>`
		+ (isEmpty
			? '<span>Empty</span>'
			: `<span>${fmtDate(s.savedAt)}</span>`);

		const btn = document.createElement('button');
		btn.className = 'avg-save-slot-btn do-load';
		btn.textContent = 'Load';
		if (isEmpty) btn.disabled = true;

		btn.addEventListener('click', () => {
			const data = loadSlot(s.slot);
			if (!data) { toast('ERROR: Can not find the save data.'); return; }

			setFlag(data.flag);

			document.getElementById('avg-save-overlay')?.remove();
			toast(`Loaded from slot ${s.slot}.`);

			window.location.href = `../scenes/${data.sceneId}.html`;
		});

		row.appendChild(info);
		row.appendChild(btn);
		dialog.appendChild(row);
	});

	const closeBtn = document.createElement('button');
	closeBtn.id = 'avg-save-close';
	closeBtn.textContent = 'Cancel';
	closeBtn.addEventListener('click', () => document.getElementById('avg-save-overlay')?.remove());
	dialog.appendChild(closeBtn);
};
