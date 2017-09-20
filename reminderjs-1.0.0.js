/**
 * ReminderJS - Is a lightweight browser library written in vanilla JS for showing reminders.
 * 
 *
 * @author   Karthik Chengayan Sridhar (<https://github.com/karthikcsridhar>)
 * @version  1.0.0
 * @license  MIT
 * @see      <https://github.com/karthikcsridhar/reminderjs>
 */

(function (global) {
	"use strict";

	//defaults
	const DEFAULTS = {
		notificationsEndpoint: '',
		snoozeInterval: 10, //10 minutes
		responsePayloadStructure: {
			idField: 'id',
			titleField: 'title',
			descriptionField: 'description',
			timeStampField: 'timestamp'
		}

	};

	var notificationsEndpoint,
		responsePayloadStructure,
		position, callback, completionCallback, reminderDisplayCallback,
		snoozeCallback, snoozeInterval, endpointHeaders, parentElement,
		libraryName = 'reminderJS',
		initiated = false,
		inputList = false,
		reminderList = [],
		cssClassList = [],
		timerMap = {},
		nodeMap = {};
	global.timerMap = timerMap;
	global.nodeMap = nodeMap;

	//private functions

	function isInitiated() {
		return initiated;
	}

	function getShortDateTime(date, dateTime) {
		if (dateTime == 'time') {
			return date.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit'
			});
		} else {
			return date.toLocaleDateString([], {
				day: '2-digit',
				month: '2-digit'
			});
		}
	}

	function validateOptions() {

		if (reminderList.constructor !== Array) {
			console.error(libraryName + " can only accept an array as reminderList.");
		}

		if (callback && callback.constructor !== Function) {
			console.error(libraryName + " can only accept a function as callback.");
		}

	}

	function getReminders() {

		if (inputList) {

			massageReminders(reminderList);

		} else {
			console.info(libraryName + " - No input list provided to process. ReminderJS will wait for input.");
		}

	}

	function massageReminders(reminders) {
		var id, newReminders = [];

		if (reminders.constructor === Array) {

			reminders.forEach(function (reminder) {

				processSingleReminder(reminder, false);

			});

		}

	}

	function _refreshReminderList() {
		let reminderMap = {};

		//clear present reminders
		for (var prop in timerMap) {
			if (timerMap.hasOwnProperty(prop)) {
				clearTimeout(timerMap[prop]);
			}
		}

		timerMap = {};

		getReminders();

	}

	function handleSnooze(reminder) {

		var now = new Date();
		var newReminderTime = new Date(now.getTime() + snoozeInterval * 60000);

		if (!reminder.originalTimestamp)
			reminder.originalTimestamp = reminder[responsePayloadStructure.timeStampField];

		reminder[responsePayloadStructure.timeStampField] = newReminderTime;

		processSingleReminder(reminder, true);

	}

	function showMessageAndCloseReminder(container, textContainer, actionBtnsContainer, reminder) {

		actionBtnsContainer.parentNode.removeChild(actionBtnsContainer);

		textContainer.textContent = 'You will be reminded in ' + snoozeInterval + ' minutes!';

		setTimeout(function () {
			closeReminder(container, reminder);
		}, 1500);

	}

	function closeReminder(container, reminder) {

		let timeout = 0;
		if (container.classList.contains('animated')) {
			container.classList.add('bounceOutLeft');
			timeout = 500;
		}

		setTimeout(function () {
			container.parentNode.removeChild(container);
		}, timeout);

		delete nodeMap[reminder[responsePayloadStructure.idField]];

	}

	function _markReminderAsCompleteById(reminderId) {

		if (timerMap[reminderId]) { //cancel reminder before it is displayed
			clearTimeout(timerMap[reminderId]);
			delete timerMap[reminderId];
		}

		if (nodeMap[reminderId]) { //remove reminder if currently on dom
			nodeMap[reminderId].parentNode.removeChild(nodeMap[reminderId]);
			delete nodeMap[reminderId];
		}

	}

	function processSingleReminder(reminder, override) {

		if (override || (!timerMap[reminder[responsePayloadStructure.idField]] && !nodeMap[reminder[responsePayloadStructure.idField]])) { // New reminder

			var reminderTime = reminder[responsePayloadStructure.timeStampField];

			if (reminderTime.constructor !== Date)
				reminderTime = new Date(reminderTime);

			var now = new Date(),
				timeRemaining = reminderTime - now,
				timer, timeout = 0;

			if (timeRemaining > 0) { //future reminders
				timeout = timeRemaining;
			} else {
				reminder.originalTimestamp = reminder[responsePayloadStructure.timeStampField];
			}

			timer = setTimeout(function () {
				buildReminder(reminder);
			}, timeout);

			timerMap[reminder[responsePayloadStructure.idField]] = timer;

		}

	}


	function buildReminder(reminder) {

		var notificationContainer,
			notificationHeader,
			notificationTextNode,
			close,
			timeParentContainer, dateContainer, timeContainer, dueContainer,
			actionBtnContainer,
			actionBtnCompleted,
			actionBtnSnooze;

		//creating notification container
		notificationContainer = document.createElement('div');
		notificationContainer.classList.add('reminderJsItemContainer');

		notificationContainer.classList.add('reminder-js-info');

		cssClassList.forEach(function (curClass) {
			notificationContainer.classList.add(curClass);
		});

		if (reminder.originalTimestamp) {
			dueContainer = document.createElement('div');
			dueContainer.classList.add('reminder-js-due');
			dueContainer.textContent = 'DUE';
			notificationContainer.appendChild(dueContainer);
		}

		let timestamp = reminder.originalTimestamp !== undefined ? reminder.originalTimestamp : reminder[responsePayloadStructure.timeStampField];
		timestamp = timestamp.constructor === Date ? timestamp : new Date(timestamp);
		timeParentContainer = document.createElement('div');
		timeParentContainer.classList.add('reminder-js-time-panel');

		dateContainer = document.createElement('div');
		dateContainer.textContent = getShortDateTime(timestamp, 'date');
		timeParentContainer.appendChild(dateContainer);
		timeContainer = document.createElement('div');
		timeContainer.textContent = getShortDateTime(timestamp, 'time');
		timeParentContainer.appendChild(timeContainer);
		notificationContainer.appendChild(timeParentContainer);

		actionBtnContainer = document.createElement('div');
		actionBtnContainer.classList.add('reminder-js-action-btn-container');
		notificationContainer.appendChild(actionBtnContainer);

		//actionBtnCompleted
		actionBtnCompleted = document.createElement('strong');
		actionBtnCompleted.textContent = 'Complete';
		actionBtnCompleted.classList.add('reminder-js-action-btn-completed');
		actionBtnContainer.appendChild(actionBtnCompleted);

		//actionBtnSnooze
		actionBtnSnooze = document.createElement('strong');
		actionBtnSnooze.textContent = 'Snooze';
		actionBtnSnooze.classList.add('reminder-js-action-btn-snooze');
		actionBtnContainer.appendChild(actionBtnSnooze);

		//adding actual message
		notificationTextNode = document.createElement('span');
		notificationTextNode.textContent = reminder[responsePayloadStructure.descriptionField];
		notificationContainer.appendChild(notificationTextNode);

		//close button
		close = document.createElement('div');
		close.className = 'reminderJsClose';
		close.innerHTML = '&times;';
		notificationContainer.appendChild(close);

		parentElement.appendChild(notificationContainer);

		if (reminderDisplayCallback) {
			reminderDisplayCallback(reminder);
		}

		actionBtnCompleted.addEventListener("click", function () {

			var container = this.parentNode.parentNode;

			//container.parentNode.removeChild(container);

			closeReminder(container, reminder);

			if (completionCallback) {
				completionCallback(reminder);
			}

		});

		actionBtnSnooze.addEventListener("click", function () {

			var container = this.parentNode.parentNode;

			//container.parentNode.removeChild(container);

			showMessageAndCloseReminder(container, notificationTextNode, actionBtnContainer, reminder);

			handleSnooze(reminder);

			if (snoozeCallback) {
				snoozeCallback();
			}

		});

		close.addEventListener("click", function () {

			var container = this.parentNode;

			//container.parentNode.removeChild(container);

			closeReminder(container, reminder);

		});

		delete timerMap[reminder[responsePayloadStructure.idField]]; //remove timer

		nodeMap[reminder[responsePayloadStructure.idField]] = notificationContainer; // add node for future reference

	}

	function createNotificationsParentContainer() {

		var firstAfterBody;

		parentElement = document.getElementById("reminderjs-container");

		if (!parentElement) {
			firstAfterBody = document.createElement("div");
			document.body.insertBefore(firstAfterBody, document.body.firstChild);
			parentElement = firstAfterBody;

			if (position)
				parentElement.classList.add('reminder-js-' + position);
			else
				parentElement.classList.add('reminder-js-topRight');

		}

	}

	function setStyle() {

		var style = document.createElement("style"),
			stylesheet;

		// WebKit hack
		style.appendChild(document.createTextNode(""));

		// Add the <style> element to the page
		document.body.appendChild(style);

		stylesheet = style.sheet;

		insertStyle(stylesheet, ".reminder-js-info", "background-color: #04a9f4; border: none; border-bottom: 3px solid #7473e8; color: #fff;");
		insertStyle(stylesheet, ".reminder-js-error", "background-color: #04a9f4 /*#f51f1f*/; border: none; border-bottom: 3px solid #7473e8/*#d61b1b*/; color: #fff;");
		insertStyle(stylesheet, ".reminder-js-warning", "background-color: #ffae42; border: none; border-bottom: 3px solid #dc963a; color: #fff;");

		insertStyle(stylesheet, ".reminder-js-due", "display: inline-block; float: left; padding: 4px 7px; transform: rotate(-90deg); margin: -3px -6px 0px -16px; background: red;");

		insertStyle(stylesheet, ".reminderJsItemContainer", "position: relative; border-radius: 2px; border: 1px solid; font-size: 14px; padding: 10px 0 10px 14px; font-family: inherit; margin: 5px 0;line-height: normal;");
		insertStyle(stylesheet, ".reminderJsItemContainer strong", "float: left; margin-right: 6px; line-height: 1");
		insertStyle(stylesheet, ".reminderJsItemContainer span", "display:table-cell; padding-right: 35px;");
		insertStyle(stylesheet, ".reminderJsClose", "position: absolute; right: 10px; top: 3px; cursor: pointer; font-size: 26px; font-weight: bold;");

		insertStyle(stylesheet, ".reminder-js-topRight", "width: 340px; position: absolute; right: 10px; top: 5px;");
		insertStyle(stylesheet, ".reminder-js-top", "width: 340px; left: 50%; transform: translate(-170px,0); position: absolute; top: 5px;");
		insertStyle(stylesheet, ".reminder-js-bottom", "width: 340px; left: 50%; transform: translate(-170px,0); position: absolute; bottom: 5px;");
		insertStyle(stylesheet, ".reminder-js-bottomRight", "width: 340px; position: absolute; right: 10px; bottom: 5px;");
		insertStyle(stylesheet, ".reminder-js-topLeft", "width: 340px; position: absolute; left: 10px; top: 5px;");
		insertStyle(stylesheet, ".reminder-js-bottomLeft", "width: 340px; position: absolute; left: 10px; bottom: 5px;");

		insertStyle(stylesheet, ".reminder-js-action-btn-container", "margin-left: -8px;");
		insertStyle(stylesheet, ".reminder-js-action-btn-completed", "transform: translate(0px, -5px); background-color: #ffe100; border: none; border-radius: 2px; color: #222; cursor: pointer; display: inline-block; font-size: 12px; -webkit-font-smoothing: antialiased; font-weight: 600; line-height: 1; padding: 7px 5px; margin-right: 6px;");
		insertStyle(stylesheet, ".reminder-js-action-btn-snooze", "transform: translate(0px, -5px); background-color: #ececec; border: none; border-radius: 2px; color: #222; cursor: pointer; display: inline-block; font-size: 12px; -webkit-font-smoothing: antialiased; font-weight: 600; line-height: 1; padding: 7px 5px; margin-right: 6px;");

		insertStyle(stylesheet, ".reminder-js-time-panel", "display: inline-block; float: left; text-align: center; transform: translate(0, -5px); margin-right: 6px; font-size: 12px; min-width: 52px;");
	}

	function insertStyle(sheet, selector, rules, index) {
		index = index || 0;
		if (sheet.insertRule) {
			sheet.insertRule(selector + "{" + rules + "}", index);
		} else {
			sheet.addRule(selector, rules, index);
		}
	}



	//publicly exposed objects
	const ReminderJS = {

		/**
		 * `init` initializes the library properties and initiates the data pull.
		 * Errors are logged to the console as errors, but reminderJs fails silently.
		 *
		 * @private
		 *
		 * @param   {Object}     options  options that define the library properties
		 * 								  - snoozeInterval				:	Interval in minutes between a snooze and when reminder reappears 
		 *                                - position                    :   position, where reminders will be shown. options: top, topRight, topLeft, bottom, bottomRight, bottomLeft
		 *                                - responsePayloadStructure    :   Object - define the key names for title, message, type, timestamp fields from the API
		 * 								  - reminderList				:	An array of reminders as input to the library
		 * 								  - cssClassList				: 	CSS classes you want added to the reminder container. For example you can pass animate.css classes such as ["animated", "bounceInLeft"] if you use animate.css in your application
		 * 								  - completionCallback			:   A callback function to execute when user clicks the Complete button. It has one arg which is the reminder that the user completed
		 * 								  - snoozeCallback				: 	A callback function to execute when user clicks the Snooze button. It has one arg which is the reminder that the user snoozed
		 * 								  - reminderDisplayCallback		: 	A callback function to execute when a reminder appears on the screen. It has one arg which is the reminder that just appeared on screen
		 */

		init: function (options) {

			if (initiated) {
				console.warn(libraryName + ' already initiated. Please do not call init again.');
				return;
			}

			//initialize properties
			snoozeInterval = options.snoozeInterval || DEFAULTS.snoozeInterval;
			position = options.position || position;
			responsePayloadStructure = options.responsePayloadStructure || responsePayloadStructure || DEFAULTS.responsePayloadStructure;
			reminderList = options.reminderList || [];
			cssClassList = options.cssClassList || [];
			completionCallback = options.completionCallback;
			snoozeCallback = options.snoozeCallback;
			reminderDisplayCallback = options.reminderDisplayCallback;

			if (options.reminderList) {
				inputList = true;
			}

			validateOptions();

			createNotificationsParentContainer();
			setStyle();

			if (!initiated) {
				initiated = true;
				getReminders();
			}

			return nodeMap;
		},

		refreshReminderList: function (options) {

			if (!initiated) {
				console.warn(libraryName + " should be inititated with init() function first, before it can be refreshed");
			}

			reminderList = options.reminderList || reminderList;

			validateOptions();

			_refreshReminderList();

			return nodeMap;
		},

		markReminderAsCompleteById(reminderId) {
			_markReminderAsCompleteById(reminderId);
		},

		isInitiated: isInitiated

	};

	/**
	 * Expose ReminderJS depending on the module system used across the
	 * application. ( CommonJS, AMD, global)
	 */

	if (typeof exports === 'object') {
		module.exports = ReminderJS
	} else if (typeof define === 'function' && define.amd) {
		define(function () {
			return ReminderJS
		})
	} else {
		global.ReminderJS = ReminderJS
	}

})(window);