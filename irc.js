/**
javascript for use with IRCSocket applet
Copyright (C) 2011 Eli Cohen

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

Contact me using this program at http://echoline.org/irc
*/

var nick;

function begin() {
	try {
		nick = "guest" + Math.floor(Math.random() * 1000);
		var cmds = "user " + nick + " \"\" " + nick + " :" + nick + "\nnick " + nick + "\n";
		document.getElementById('IRCSocket').write(cmds);
		load();
	} catch(e) {
		document.getElementById('status').innerHTML += e;
		window.scrollTo(0,document.body.scrollHeight);
	}
}

function valid(id) {
	return id.replace(/[^A-Za-z0-9\-\_\:\.]/g, '');
}

function irc2html(str) {
	formatting = {
			bold:false,
			underlined:false,
			italics:false,
	};
	
	str = str.replace(new RegExp("\u0003([0-9\,]+)([^\u0003\u000F]*)","g"), function(m, one, two) {
					var ns;
					var cs = [ "red", "white" ];

					if (one.match(","))
						ns = one.split(",");
					else if (one.length != 0)
						ns = [ one, "0" ];
					else
						return two;

					for (i = 0; i < 2; i++) switch(ns[i]) {
					case '0':
						cs[i] = 'white';
						break;
					case '1':
						cs[i] = 'black';
						break;
					case '2':
						cs[i] = 'blue';
						break;
					case '3':
						cs[i] = 'green';
						break;
					case '4':
						cs[i] = 'pink';
						break;
					case '5':
						cs[i] = 'red';
						break;
					case '6':
						cs[i] = 'purple';
						break;
					case '7':
						cs[i] = 'orange';
						break;
					case '8':
						cs[i] = 'yellow';
						break;
					}

					return "<span style=\"color:" + cs[0] + ";background-color:" + cs[1] + ";\">" + two + "</span>";
				    });

	str = str.replace(new RegExp("\u0003","g"), "");

	str = str.replace(new RegExp("\u0002","g"), function() {
					var ret = "\0002";

					if (formatting.bold)
						ret = "</strong>";
					else
						ret = "<strong>";

					formatting.bold = formatting.bold? false: true;

					return ret;
				    });
	
	str = str.replace(new RegExp("\u001F","g"), function() {
					var ret = "\001F";

					if (formatting.underlined)
						ret = "</span>";
					else
						ret = "<span style=\"text-decoration: underline;\">";

					formatting.underlined = formatting.underlined? false: true;

					return ret;
				    });
	
	str = str.replace(new RegExp("\u0016","g"), function() {
					var ret = "\0016";

					if (formatting.italics)
						ret = "</em>";
					else
						ret = "<em>";

					formatting.italics = formatting.italics? false: true;

					return ret;
				    });

	str = str.replace(new RegExp("\u000F","g"), function() {
					var ret = "";

					if (formatting.italics)
						ret += "</em>";
					if (formatting.bold)
						ret += "</strong>";
					if (formatting.underlined)
						ret += "</span>";

					formatting.italics = formatting.bold = formatting.underlined = false;

					return ret;
				    });

	return str;
}

function msg(name) {
	exists(name);
	var id = String.fromCharCode(35).concat(valid(name));
	$("#content").tabs("select", id);

	return false;
}

var target = null;

var s = "";

function exists(t) {
	var ret = false;

	$('#tabs li a').each(function(i) {
		if (this.text == t) {
			ret = true;
		}
	});

	if (!ret){
		var id = String.fromCharCode(35).concat(valid(t));

		$('#content').tabs("add", id, t);
	}

	return ret;
}

function load() {
	try {
		var chunk = document.getElementById('IRCSocket').read();

		if (chunk != null)
			s += chunk;

		if ((s != "")  && (s.charAt(s.length-1) == '\n')) {
			lines = s.split(/\r\n|\r|\n/);
			for (i in lines) {
				s = lines[i];
				if (ping = s.match(/^PING\s+\S+/)) {
					ping = ping[0].replace("PING", "PONG");
					document.getElementById('IRCSocket').write(ping + '\n');

				} else {
					s = s.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

					if ((list = s.split(/\s+/)) && (list.length > 1)) {
						if (list[1].match(/^privmsg$/i) || list[1].match(/^notice$/i)) {
							var from = list[0].substr(1,list[0].indexOf('!')-1);
							var to = list[2];
							var t;

							if (to.charAt(0).match(/^#$/))
								t = to;
							else
								t = from;

							var m = s.substr(s.substr(1).indexOf(':') + 2).replace(/(https?):\/\/(\S+)/g, "<a href=\"$1://$2\" target=\"_blank\">$1://$2</a>");
							var id = String.fromCharCode(35).concat(valid(t));

							// privmsg ctcps
							if (m.charAt(0).match(/\001/)) {
								if (m.substr(1).match(/^action/i)) {
									exists(t);

									m = m.replace(/^\001action(.*)\001$/i, "$1");
									if (m.match(nick))
										$(id).append("<span style=\"background:yellow;\">" + (new Date()).toLocaleTimeString() + " * " + from + " " + irc2html(m) + '</span><br/>');
									else
										$(id).append((new Date()).toLocaleTimeString() + " * " + from + " " + irc2html(m) + '<br/>');
								} else if (m.match(/^\001version\001$/i)) {
									document.getElementById('IRCSocket').write('NOTICE ' + from + ' :\001VERSION audreyirc v0.1\001\n');

								}
							} else if (!id.match(/^#$/)) {
								exists(t);

								if (m.match(nick))
									$(id).append("<span style=\"background:yellow;\">" + (new Date()).toLocaleTimeString() + " &lt;" + from + "&gt; " + irc2html(m) + '</span><br/>');
								else
									$(id).append((new Date()).toLocaleTimeString() + " &lt;" + from + "&gt; " + irc2html(m) + '<br/>');

								if (tablist[$('#content').tabs('option', 'selected')] && tablist[$("#content").tabs('option','selected')].text != t) {
									$('#tabs li a').each(function(i) {
										if (this.text == t) {
											$(this).css("color","#F00");
											if (m.match(nick))
												$(this).parent().effect("bounce", { times:3 }, 500);
										}
									});
								}

							} else {
								$('#status').append(s + '<br/>');
							}

							if (MathJax)
								MathJax.Hub.Queue(["Typeset",MathJax.Hub, "content"]);

							window.scrollTo(0,document.body.scrollHeight);
						} else if (list[1].match(/^353$/)) {
							var t = list[4];
							var l = s.substr(1);
							l = l.substr(l.indexOf(':') + 1);
							var ppl = l.split(/\s+/);

							exists(t);
							var id = String.fromCharCode(35).concat(valid(t));
							$(id + ' .userlist').remove();
							$(id).prepend('<ul class="userlist"></ul>');
							for (i in ppl) {
								if (ppl[i].length > 0) {
									var n = ppl[i].replace(/^([\~\@\%\+]|\&amp;)/,""); 
									$(id + ' .userlist').prepend('<li><a href="#" onclick="return msg(this.innerHTML)">' + n + '</a></li>');
								}
							}

							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/^332$/)) {
							var t = list[3];
							var l = s.substr(1);
							l = l.substr(l.indexOf(':') + 1);

							exists(t);
							var id = String.fromCharCode(35).concat(valid(t));
							$(id).append((new Date()).toLocaleTimeString() + " " + l + "<br/>");
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/nick/i)) {
							var from = list[0].substr(1,list[0].indexOf('!')-1);
							var to = list[2].substr(1);

							$('.userlist li a').each(function(i) {
								if (this.innerHTML == from) {
									this.innerHTML = to;
								}
							});

							$('#tabs li a').each(function(i) {
								if (this.innerHTML == from) {
									this.innerHTML = to;
								}
							});

							if (nick == from)
								nick = to;

						} else if (list[1].match(/join/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var chan = list[2].substr(1);
							var id = String.fromCharCode(35).concat(valid(chan));

							$(id + ' .userlist').prepend('<li><a href="#" onclick="return msg(this.innerHTML)">' + who + '</a></li>');
							$(id).append((new Date()).toLocaleTimeString() + " " + who + " has joined " + chan + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/part/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var chan = list[2].substr(1);
							var id = String.fromCharCode(35).concat(valid(chan));

							$(id + ' .userlist li').remove(":contains('" + who + "')");
							$(id).append((new Date()).toLocaleTimeString() + " " + who + " has left " + chan + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);
						
						} else if (list[1].match(/kick/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var chan = list[2];
							var id = String.fromCharCode(35).concat(valid(chan));

							$(id + ' .userlist li').remove(":contains('" + list[3] + "')");
							if (list[3].match(nick))
								$(id).append('<span style="color:#F00;">' + (new Date()).toLocaleTimeString() + ' you have been kicked from ' + chan + '</span><br/>');
							else
								$(id).append((new Date()).toLocaleTimeString() + " " + who + " has kicked " + list[3] + ': ' + s.substr(s.substr(1).indexOf(':') + 2) + '<br/>');

							window.scrollTo(0,document.body.scrollHeight);
						
						} else if (list[1].match(/quit/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var msg = s.substr(s.substr(1).indexOf(':') + 2);

							$('.userlist:has(li)').each(function() {
								$(this).find('li').each(function() {
									if ((new RegExp("^" + who + "$").test($(this).text()))) {
										$(this).parent().parent().append((new Date()).toLocaleTimeString() + " " + who + ' has quit: ' + msg + '<br/>');
										$(this).remove();
									}
								});
							});
							$('#status').append((new Date()).toLocaleTimeString() + " " + who + ' has quit: ' + msg + '<br/>');

							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[0].match(/^error/i)) {
							$('#content').tabs("select", "status");
							$('#status').append("<span style=\"color:#F00\">" + s + '</span><br/>');
							window.scrollTo(0,document.body.scrollHeight);
						
						} else {
							$('#status').append(s + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);
						}

					} else if (!s.match(/^\s*$/)) {
						$('#status').append(s + '<br/>');
						window.scrollTo(0,document.body.scrollHeight);
					}

				}
			}

			s = "";
		}

		setTimeout('load()', 100);
	} catch(e) {
		document.getElementById('status').innerHTML += e;
		window.scrollTo(0,document.body.scrollHeight);
	}
}

function send(event) {
	if (event.keyCode == 13) {
		try {
			var l = document.getElementById('inbox').value;
			l = l.replace(/\\u(\d|[A-F]){4}/gi, function(arg) { return String.fromCharCode(parseInt(arg.substr(2), 16)); });
			if (l.charAt(0) == '/') {
				if (a = l.match(/^\/msg\s+([^\s]+)\s+(.*)/i)) {
					var to = a[1];
					var mesg = a[2];

					msg(to);

					document.getElementById('IRCSocket').write('privmsg ' + to + ' :'  + mesg + '\n');

					$(String.fromCharCode(35).concat(valid(to))).append((new Date()).toLocaleTimeString() + " &lt;<span style=\"color:#F00\">" + nick + "</span>&gt; " + irc2html(mesg) + '<br/>');
				} else if (l.match(/^\/me\s/i) && target) {
					var tab = tablist[target];

					document.getElementById('IRCSocket').write('privmsg ' + tab.text + ' :'  + l.replace(/^\/me\s(.*)$/i, "\001ACTION $1\001") + '\n');
					l = l.replace(/^\/me\s/i,"").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/(https?):\/\/(\S+)/g, "<a href=\"$1://$2\" target=\"_blank\">$1://$2</a>")
					var panel = panellist[target];
					$(panel).append((new Date()).toLocaleTimeString() + " * <span style=\"color:#F00\">" + nick + "</span> " + irc2html(l) + '<br/>');

				} else
					document.getElementById('IRCSocket').write(l.substr(1) + '\n');

			} else if (target) {
				var tab = tablist[target];
				document.getElementById('IRCSocket').write('privmsg ' + tab.text + ' :'  + l + '\n');
				l = l.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/(https?):\/\/(\S+)/g, "<a href=\"$1://$2\" target=\"_blank\">$1://$2</a>").replace(/\\u([\d|A-F]{4})/gi, function(arg){return "" + String.fromCharCode(parseInt(arg, 16));});
				var panel = panellist[target];
				$(panel).append((new Date()).toLocaleTimeString() + " &lt;<span style=\"color:#F00\">" + nick + "</span>&gt; " + irc2html(l) + '<br/>');
			}

			if (MathJax)
				MathJax.Hub.Queue(["Typeset",MathJax.Hub, "content"]);

			window.scrollTo(0,document.body.scrollHeight);
		} catch (e) {
			document.getElementById('status').innerHTML += e;
		}

		document.getElementById('inbox').value = '';
		return false;
	} else if (event.keyCode == 9) {
		var s = document.getElementById('inbox').value;

		if (s = s.match(/([^\s]+)$/)) {
			s = s[1];

			$(".userlist li:contains(" + s + ")").each(function() {
				if ($(this).text().match(new RegExp("^" + s))) {
					document.getElementById('inbox').value += $(this).text().substr(s.length);

					return false;
				}
			});
		}
		
		if (event.preventDefault) {
			event.preventDefault();
		}

		return false;
	}
}

var tablist;
var panellist;

function gui() {
	tablist = new Array();
	panellist = new Array;
	var $tabs = $('#content').tabs({
		add: function(event, ui) {
			$tabs.tabs('select', ui.index);
		},
		select: function(event, ui) {
			target = ui.index;
			panellist[ui.index] = ui.panel;
			tablist[ui.index] = ui.tab;
			$(ui.tab).css("color","");
		},
		show: function(event, ui) {
			window.scrollTo(0,document.body.scrollHeight);
		},
		closable: true
	});

	begin();
}
