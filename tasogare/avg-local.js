// avg-local.js
// Answers avg.js's API calls in the browser from window.AVG_DB (data.js),
// so a game runs as plain static files with no server or database.
// Each function mirrors the SQL of the matching controller in Controllers/.
//
// The static build rewrites avg.js's `$.ajax({` to `(window.AVG_LOCAL_AJAX || $.ajax)({`,
// so this file only has to define window.AVG_LOCAL_AJAX.

(function (root) {
	'use strict';

	const COMMON_SCENE = '00000';
	const NO_MESSAGE = 'ERROR: No message!';

	// flags are unsigned 64-bit in the DB, so use BigInt for the bit operations
	const big = function (v) {
		try { return BigInt(v || 0); } catch (e) { return 0n; }
	};
	const hasFlags = function (rowFlag, flag) {
		const f = big(rowFlag);
		return (f & flag) === f;
	};
	const inScene = function (row, sceneId) {
		return row.SCENE_ID === sceneId || row.SCENE_ID === COMMON_SCENE;
	};
	// stable sort (Array.prototype.sort is stable), so ties keep the INSERT order
	const sortBy = function (rows, compare) {
		return rows.slice().sort(compare);
	};
	const desc = function (a, b) { return a < b ? 1 : a > b ? -1 : 0; };
	const asc = function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };

	const createApi = function (db) {

		const toCommand = function (c) {
			return { commandId: c.COMMAND_ID, targetId: '', text: c.TEXT, mode: c.MODE, forbidden: 0 };
		};

		// CommandController.Get / GetPerson
		const commands = function (q, person) {
			const rows = db.COMMAND.filter(c => inScene(c, q.sceneId)
				&& (person ? (c.MODE === 1 || c.MODE === 2) : c.MODE !== 1));
			return { commands: sortBy(rows, (a, b) => a.SORT_KEY - b.SORT_KEY).map(toCommand) };
		};

		// MessageController.Get
		const message = function (q) {
			const flag = big(q.flag);
			const rows = db.MESSAGE.filter(m => inScene(m, q.sceneId)
				&& m.COMMAND_ID === q.commandId
				&& m.TARGET_ID === q.targetId
				&& hasFlags(m.FLAG, flag));
			const m = sortBy(rows, (a, b) => desc(a.SCENE_ID, b.SCENE_ID) || desc(big(a.FLAG), big(b.FLAG)))[0];
			if (!m) return { message: NO_MESSAGE, flag: 0, event: null };

			const next = (flag | big(m.SET_FLAG)) & ~big(m.UNSET_FLAG);
			// avg.js stores the flag only when it is truthy, as it did with the server's number
			return { message: m.TEXT, flag: next === 0n ? 0 : next.toString(), event: m.EVENT };
		};

		// TargetController.Get
		const targets = function (q) {
			const flag = big(q.flag);
			const ts = db.TARGET.filter(t => inScene(t, q.sceneId)
				&& t.COMMAND_ID === q.commandId
				&& hasFlags(t.FLAG, flag));
			const cs = db.COMMAND.filter(c => inScene(c, q.sceneId) && c.COMMAND_ID === q.commandId);

			// INNER JOIN TARGET x COMMAND
			const joined = [];
			sortBy(ts, (a, b) => desc(a.SCENE_ID, b.SCENE_ID) || asc(a.TARGET_ID, b.TARGET_ID)).forEach(t => {
				cs.forEach(c => joined.push({
					commandId: t.COMMAND_ID,
					targetId: t.TARGET_ID,
					mode: c.MODE,
					text: t.TEXT,
					forbidden: t.FORBIDDEN
				}));
			});

			// initial message (000) when there are targets, default message (999) when not
			const initialId = joined.length > 0 ? '000' : '999';
			const m = db.MESSAGE.find(m => m.SCENE_ID === COMMON_SCENE
				&& m.COMMAND_ID === q.commandId
				&& m.TARGET_ID === initialId);

			return { message: m ? m.TEXT : NO_MESSAGE, commands: joined };
		};

		// SceneController.GetDestScene
		const dest = function (q) {
			const t = db.TARGET.find(t => t.SCENE_ID === q.sceneId
				&& t.COMMAND_ID === q.commandId
				&& t.TARGET_ID === q.targetId
				&& db.SCENE.some(s => s.SCENE_ID === t.DEST_SCENE_ID));
			const s = t && db.SCENE.find(s => s.SCENE_ID === t.DEST_SCENE_ID);
			return s ? { sceneId: s.SCENE_ID, path: s.PATH } : { sceneId: '', path: '' };
		};

		const routes = {
			'command': q => commands(q, false),
			'command/person': q => commands(q, true),
			'message': message,
			'target': targets,
			'scene/dest': dest
		};

		// call an endpoint by its path, e.g. request('api/message', {...})
		const request = function (url, query) {
			const route = routes[String(url).replace(/^(.*\/)?api\//, '')];
			if (!route) throw new Error('Unknown API: ' + url);
			const q = {};
			Object.keys(query || {}).forEach(k => { q[k] = String(query[k]); });
			return route(q);
		};

		return { request: request };
	};

	if (typeof module !== 'undefined' && module.exports) {
		// node: used by the build checks
		module.exports = { createApi: createApi };
	} else {
		const api = createApi(root.AVG_DB);

		// drop-in for $.ajax with the options avg.js passes (url, data, success, error)
		root.AVG_LOCAL_AJAX = function (opts) {
			setTimeout(function () {
				let res;
				try {
					res = api.request(opts.url, opts.data);
				} catch (e) {
					if (opts.error) opts.error({ status: 500 }, 'error', e.message);
					return;
				}
				opts.success(res, 'json');
			}, 0);
		};
	}
})(typeof window !== 'undefined' ? window : this);
