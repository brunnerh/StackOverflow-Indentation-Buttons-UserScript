// ==UserScript==
// @name           SO-IndentationButtons
// @version        1.2
// @namespace      brunnerh:gm
// @include        *stackoverflow.com*
// @include        *stackexchange.com*
// ==/UserScript==

// @ts-check

(() =>
{
	const buttonImageUrl = "https://i.stack.imgur.com/SVib6.png";

	setup();

	/** Hooks into post edit links and sets up buttons for answer editor. */
	function setup()
	{
		// Handle answer editor.
		buildButtons(null);

		// Handle other editors.
		Array.from(document.querySelectorAll(".wmd-input"))
			.forEach(input =>
			{
				if (input.id.startsWith("wmd-input-"))
					buildButtons(input.id.split("wmd-input-")[1]);
			})

		// Handle edit links.
		Array.from(document.querySelectorAll(".js-edit-post"))
			.forEach((/** @type {HTMLAnchorElement} */ link) =>
			{
				const id = link.href.match(/\/posts\/(\d+)\/edit/)[1];
				link.addEventListener("click", () => buildButtons(id));
			});
	}

	/**
	 * Async wait via Promise.
	 * @param {number?} timeout The time to wait in milliseconds.
	 */
	function wait(timeout) { return new Promise(res => setTimeout(res, timeout)); };

	/**
	 * Polls for a given value and returns it or throws on timeout.
	 * @template T
	 * @param {() => T} callback The polling function. If the returned value is falsey, polling continues.
	 * @param {number} interval The time to wait between polls in milliseconds.
	 * @param {number} timeout The maximal time used for polling in milliseconds. -1 disables the timeout. Default: 5000
	 */
	async function poll(callback, interval, timeout = 5000)
	{
		let waited = 0;
		while (true)
		{
			let output = callback();
			if (output)
				return output;

			await wait(interval);
			waited += interval;

			if (timeout != -1 && waited > timeout)
				throw new Error(`Polling timeout of ${timeout} milliseconds was exceeded.`);
		}
	}

	/**
	 * Adds buttons to a given post or the answer editor.
	 * @param {?string} postId The ID of the post, null if referring to answer editor.
	 */
	async function buildButtons(postId)
	{
		const timeout = postId == null ? -1 : 5000;

		const tbId = postId == null ? "wmd-input" : "wmd-input-" + postId;
		const textBox = await poll(() => /** @type {HTMLTextAreaElement} */(document.getElementById(tbId)), 100, timeout);

		const rowId = postId == null ? "wmd-button-row" : "wmd-button-row-" + postId;
		const buttonRow = await poll(() => document.getElementById(rowId), 100, timeout);

		const modifyButtonBar = () =>
		{
			// Check if already modified.
			const indentButtonClass = "so-indent-button";
			if (buttonRow.querySelector("." + indentButtonClass) != null)
				return;

			// Add separator
			const li = document.createElement("li");
			li.classList.add("wmd-spacer");
			li.style.left = getButtonOffset(buttonRow) + "px";
			buttonRow.appendChild(li);

			/**
			 * Adds a button to the button bar.
			 * @param {HTMLElement} content The button content.
			 * @param {string} title The title of the button.
			 * @param {(textBox: HTMLTextAreaElement) => void} onclick The click handler which gets passed the text box.
			 */
			function addButton(content, title, onclick)
			{
				const li = document.createElement("li");
				li.classList.add(indentButtonClass);
				li.classList.add("wmd-button");
				li.style.left = getButtonOffset(buttonRow) + "px";
				li.title = title;
				li.addEventListener("click", () => onclick(textBox));

				const span = document.createElement("span");
				span.appendChild(content);
				span.style.backgroundImage = "none";

				li.appendChild(span);
				buttonRow.appendChild(li);
			}

			addButton(createButtonContent(0), "Decrease Indentation - Ctrl+[", indentationDown);
			addButton(createButtonContent(-20), "Increase Indentation - Ctrl+]", indentationUp);
		}

		modifyButtonBar();
		// Check for changes (like advanced help for new users) and re-add buttons.
		new MutationObserver(modifyButtonBar).observe(buttonRow, { childList: true, subtree: true });

		textBox.addEventListener("keyup", e =>
		{
			// Reduce Indentation: Ctrl+[
			if (e.ctrlKey && e.keyCode == 219)
			{
				indentationDown(textBox);
			}
			// Increase Indentation: Ctrl+]
			if (e.ctrlKey && e.keyCode == 221)
			{
				indentationUp(textBox);
			}
		});
	}

	/**
	 * Creates the icon contents of an indentation button.
	 * @param {0|-20} backgroundOffset The horizontal background image offset.
	 */
	function createButtonContent(backgroundOffset)
	{
		const button = document.createElement("span");
		button.style.backgroundImage = `url('${buttonImageUrl}')`;
		button.style.backgroundRepeat = "no-repeat";
		button.style.backgroundPositionX = `${backgroundOffset}px`;
		button.style.display = "inline-block";
		button.style.height = "20px";
		button.style.width = "20px";

		/**
		 * Sets the vertical background position to top or bottom (i.e. default or hover).
		 * @param {boolean} top Whether the top or bottom image should be used.
		 */
		const setBgPosition = (top = true) =>
			button.style.backgroundPositionY = top ? 'top' : 'bottom';

		setBgPosition();

		button.addEventListener("mouseleave", () => setBgPosition(true));
		button.addEventListener("mouseenter", () => setBgPosition(false));

		return button;
	}

	/**
	 * Calculates the horizontal pixel offset for the next button in the button bar.
	 * @param {HTMLElement} buttonRow The button row for the editor.
	 */
	function getButtonOffset(buttonRow)
	{
		// -1 because of the help button on the right
		return (buttonRow.querySelectorAll("li").length - 1) * 25;
	}

	// #region Button Functions

	/**
	 * Increases indentation.
	 * @param {HTMLTextAreaElement} textBox The editor text box.
	 */
	function indentationUp(textBox)
	{
		const text = textBox.value.substring(textBox.selectionStart, textBox.selectionEnd);
		const lines = text.split("\n");
		let shift = 0;
		for (let i = 0; i < lines.length; i++)
		{
			lines[i] = "    " + lines[i];
			shift += 4;
		}
		replaceSelection(textBox, lines.join("\n"));
		textBox.focus();
	}

	/**
	 * Decreases indentation.
	 * @param {HTMLTextAreaElement} textBox The editor text box.
	 */
	function indentationDown(textBox)
	{
		const text = textBox.value.substring(textBox.selectionStart, textBox.selectionEnd);
		const lines = text.split("\n");
		let shift = 0;
		for (let i = 0; i < lines.length; i++)
		{
			if (lines[i].substring(0, 4) == "    ")
			{
				lines[i] = lines[i].substring(4);
				shift += 4;
			}
			if (lines[i].charCodeAt(0) == 9)
			{
				lines[i] = lines[i].substring(1);
				shift++;
			}
		}
		replaceSelection(textBox, lines.join("\n"));
		textBox.focus();
	}

	// #endregion


	// //#region Helper Functions

	/**
	 * Replaces the selected text in a textbox.
	 * @param {HTMLTextAreaElement} textbox The text area whose selection to replace.
	 * @param {string} text The replacement text.
	 */
	function replaceSelection(textbox, text)
	{
		const selectionStart = textbox.selectionStart;
		textbox.value =
			textbox.value.substring(0, textbox.selectionStart) +
			text +
			textbox.value.substring(textbox.selectionEnd);
		textbox.selectionStart = selectionStart;
		textbox.selectionEnd = selectionStart + text.length;
	}

	// #endregion
})();
