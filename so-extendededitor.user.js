// ==UserScript==
// @name           SO-IndentationButtons
// @namespace      stackoverflow
// @include        *stackoverflow.com*
// ==/UserScript==

(function ()
{
	var inputTextBox = null;
	var buttonRow = null;
	jq_wait();

	function jq_wait()
	{
		if (typeof unsafeWindow.jQuery == 'undefined')
		{
			window.setTimeout(jq_wait, 100);
		} else
		{
			$ = unsafeWindow.jQuery;
			$(document).ready(setup);
		}
	}

	function setup()
	{
		inputTextBox = $("#wmd-input")[0];
		getButtonRow();
	}

	function getButtonRow()
	{
		buttonRow = document.getElementById("wmd-button-row");
		if (buttonRow == null)
		{
			window.setTimeout((function () { getButtonRow() }), 100);
		}
		else
		{
			buildButtons();
		}
	}

	function buildButtons()
	{
		addSeperator();

		var buttonRedIndent = createButtonContent(0);
		addButton(buttonRedIndent, "Reduce Indentation - Ctrl+[", indentationDown);

		var buttonIncIndent = createButtonContent(-20);
		addButton(buttonIncIndent, "Increase Indentation - Ctrl+]", indentationUp);

		$(inputTextBox).keyup(function (e)
		{
			// Reduce Indentation: Ctrl+[
			if (e.ctrlKey && e.keyCode == 219)
			{
				indentationDown();
			}
			// Increase Indentation: Ctrl+]
			if (e.ctrlKey && e.keyCode == 221)
			{
				indentationUp();
			}
		});
	}

	function createButtonContent(backgroundOffset)
	{
		var button = document.createElement("span");
		button.setAttribute("style", "background-image: url('http://i.stack.imgur.com/5t3SJ.png');" //What to do about the image/image hosting?
		+ "background-position:" + backgroundOffset + "px top;"
		+ "background-repeat: no-repeat;"
		+ "display: inline-block;"
		+ "height: 20px;"
		+ "width: 20px;");
		$(button).mouseleave(function ()
		{
			$(button).css("background-position", backgroundOffset + "px top");
		});
		$(button).mouseenter(function ()
		{
			$(button).css("background-position", backgroundOffset + "px bottom");
		});
		return button;
	}

	function addSeperator()
	{
		var li = document.createElement("li");
		$(li).addClass("wmd-spacer");
		$(li).css("left", getButtonOffset());
		$(buttonRow).append(li);
	}

	function addButton(/* node */content, /* string */title, /* function */onclick)
	{
		var li = document.createElement("li");
		$(li).addClass("wmd-button");
		$(li).css("left", getButtonOffset());
		$(li).attr("title", title);
		$(li).click(function (event) { onclick(); });
		var span = document.createElement("span");
		$(span).append(content);
		$(span).css("background-image", "none");
		$(li).append(span);
		$(buttonRow).append(li);
	}

	function getButtonOffset()
	{
		return ($(buttonRow).find("li").length - 1) * 25; // -1 because of the help button on the right
	}

	///// Button Functions /////

	function indentationUp()
	{
		var text = inputTextBox.value.substring(inputTextBox.selectionStart, inputTextBox.selectionEnd);
		var lines = text.split("\n");
		var shift = 0;
		for (var i = 0; i < lines.length; i++)
		{
			lines[i] = "    " + lines[i];
			shift += 4;
		}
		replaceSelection(inputTextBox, lines.join("\n"));
		inputTextBox.focus();
	}

	function indentationDown()
	{
		var text = inputTextBox.value.substring(inputTextBox.selectionStart, inputTextBox.selectionEnd);
		var lines = text.split("\n");
		var shift = 0;
		for (var i = 0; i < lines.length; i++)
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
		replaceSelection(inputTextBox, lines.join("\n"));
		inputTextBox.focus();
	}

	///// Helper Functions /////

	function replaceSelection(textbox, text)
	{
		var selectionStart = textbox.selectionStart;
		textbox.value = textbox.value.substring(0, textbox.selectionStart) + text + textbox.value.substring(textbox.selectionEnd);
		textbox.selectionStart = selectionStart;
		textbox.selectionEnd = selectionStart + text.length;
	}

	function surroundSelection(textbox, head, tail)
	{
		var selectionStart = textbox.selectionStart;
		var selectedText = textbox.value.substring(textbox.selectionStart, textbox.selectionEnd);
		var selectionLength = selectedText.length;
		textbox.value = textbox.value.substring(0, textbox.selectionStart) + head + selectedText + tail + textbox.value.substring(textbox.selectionEnd);
		textbox.selectionStart = selectionStart + head.length;
		textbox.selectionEnd = textbox.selectionStart + selectionLength;
	}
})();
