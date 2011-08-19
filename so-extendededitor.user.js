// ==UserScript==
// @name           SO-IndentationButtons
// @namespace      stackoverflow
// @include        *stackoverflow.com*
// ==/UserScript==

(function ()
{
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
		buildButtons("-1");
		var qEditLink = $(".edit-post");
		qEditLink.each(function (i, editLink)
		{
			var qEditLink = $(editLink);
			var id = qEditLink.attr("href").match(/\/posts\/(\d+)\/edit/)[1];
			qEditLink.click(function ()
			{
				buildButtons(id);
			});
		});
	}

	function buildButtons(postId)
	{
		var textBox;
		var buttonRow;
		getTextBoxAndContinue();

		function getTextBoxAndContinue()
		{
			var tbId = postId == "-1" ? "wmd-input" : "wmd-input-" + postId;
			textBox = document.getElementById(tbId);
			if (textBox == null)
			{
				window.setTimeout((function () { getTextBoxAndContinue() }), 100);
			}
			else
			{
				continue1();
			}
		}

		function continue1()
		{
			getButtonRowAndContinue();

			function getButtonRowAndContinue()
			{
				var rowId = postId == "-1" ? "wmd-button-row" : "wmd-button-row-" + postId;
				buttonRow = document.getElementById(rowId);
				if (buttonRow == null)
				{
					window.setTimeout((function () { getButtonRowAndContinue() }), 100);
				}
				else
				{
					continue2();
				}
			}
		}

		function continue2()
		{
			addSeperator(buttonRow);

			var buttonRedIndent = createButtonContent(0);
			addButton(textBox, buttonRow, buttonRedIndent, "Reduce Indentation - Ctrl+[", indentationDown);

			var buttonIncIndent = createButtonContent(-20);
			addButton(textBox, buttonRow, buttonIncIndent, "Increase Indentation - Ctrl+]", indentationUp);

			$(textBox).keyup(function (e)
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

	function addSeperator(buttonRow)
	{
		var li = document.createElement("li");
		$(li).addClass("wmd-spacer");
		$(li).css("left", getButtonOffset(buttonRow));
		$(buttonRow).append(li);
	}

	function addButton(/*node*/textBox, /*node*/buttonRow, /*node*/content, /*string*/title, /*function(TextBox)*/onclick)
	{
		var li = document.createElement("li");
		$(li).addClass("wmd-button");
		$(li).css("left", getButtonOffset(buttonRow));
		$(li).attr("title", title);
		$(li).click(function (event) { onclick(textBox); });
		var span = document.createElement("span");
		$(span).append(content);
		$(span).css("background-image", "none");
		$(li).append(span);
		$(buttonRow).append(li);
	}

	function getButtonOffset(buttonRow)
	{
		return ($(buttonRow).find("li").length - 1) * 25; // -1 because of the help button on the right
	}

	///// Button Functions /////

	function indentationUp(textBox)
	{
		var text = textBox.value.substring(textBox.selectionStart, textBox.selectionEnd);
		var lines = text.split("\n");
		var shift = 0;
		for (var i = 0; i < lines.length; i++)
		{
			lines[i] = "    " + lines[i];
			shift += 4;
		}
		replaceSelection(textBox, lines.join("\n"));
		textBox.focus();
	}

	function indentationDown(textBox)
	{
		var text = textBox.value.substring(textBox.selectionStart, textBox.selectionEnd);
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
		replaceSelection(textBox, lines.join("\n"));
		textBox.focus();
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