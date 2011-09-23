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

function msg(name) {
	exists(name);
	var id = String.fromCharCode(35).concat(name);
	$("#content").tabs("select", id);

	return false;
}

var target = null;

var s = "";

function exists(t) {
	var ret = false;
	var id;

	$('.tabs li a').each(function(i) {
		if (this.text == t) {
			ret = true;
		}
	});

	if (!ret){
		if (t.charAt(0).match(/^#$/)) {
			id = t;
		} else {
			id = String.fromCharCode(35).concat(t);
		}

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

							var m = s.substr(s.substr(1).indexOf(':') + 2).replace(/http:\/\/(\S+)/g, "<a href=\"http://$1\">http://$1</a>");
							var id;
						
							if (t.charAt(0).match(/^#$/)) {
								id = t;
							} else {
								id = String.fromCharCode(35).concat(t);
							}

							// privmsg ctcps
							if (m.charAt(0).match(/\001/)) {
								if (m.substr(1).match(/^action/i)) {
									m = m.replace(/^\001action(.*)\001$/i, "$1");
									if (m.match(nick))
										$(id).append("<span style=\"background:yellow;\">" + (new Date()).toLocaleTimeString() + " * " + from + " " + m + '</span><br/>');
									else
										$(id).append((new Date()).toLocaleTimeString() + " * " + from + " " + m + '<br/>');
								} else if (m.substr(1).match(/^version\001$/i)) {
									document.getElementById('IRCSocket').write('NOTICE ' + from + ' :\001VERSION audreyirc v0.1\001\n');
									
								}
							} else if (!id.match(/^#$/)) {
								exists(t);

								if (m.match(nick))
									$(id).append("<span style=\"background:yellow;\">" + (new Date()).toLocaleTimeString() + " &lt;" + from + "&gt; " + m + '</span><br/>');
								else
									$(id).append((new Date()).toLocaleTimeString() + " &lt;" + from + "&gt; " + m + '<br/>');

								if (tablist[$('#content').tabs('option', 'selected')] && tablist[$("#content").tabs('option','selected')].text != t) {
									$('.tabs li a').each(function(i) {
										if (this.text == t) {
											$(this).css("color","#F00");
										}
									});
								}
							} else {
								$('#status').append(s + '<br/>');
							}

							window.scrollTo(0,document.body.scrollHeight);
						} else if (list[1].match(/^353$/)) {
							var t = list[4];
							var l = s.substr(1);
							l = l.substr(l.indexOf(':') + 1);
							var ppl = l.split(/\s+/);

							exists(t);
							$(t + ' .userlist').remove();
							$(t).prepend('<ul class="userlist"></ul>');
							for (i in ppl) {
								if (ppl[i].length > 0) {
									var n = ppl[i].replace(/^([\~\@\%\+]|\&amp;)/,""); 
									$(t + ' .userlist').prepend('<li><a href="#" onclick="return msg(this.innerHTML)">' + n + '</a></li>');
								}
							}

							$(t + ' .userlist').menu();
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/^332$/)) {
							var t = list[3];
							var l = s.substr(1);
							l = l.substr(l.indexOf(':') + 1);

							exists(t);
							$(t).append(t + ": " + l + "<br/>");
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/nick/i)) {
							var from = list[0].substr(1,list[0].indexOf('!')-1);
							var to = list[2].substr(1);

							$('.userlist li a').each(function(i) {
								if (this.innerHTML == from) {
									this.innerHTML = to;
								}
							});

							if (nick == from)
								nick = to;

						} else if (list[1].match(/join/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var chan = list[2].substr(1);

							$(chan + ' .userlist').prepend('<li><a href="#">' + who + '</a></li>');
							$(chan + ' .userlist').menu("refresh");
							$(chan).append((new Date()).toLocaleTimeString() + " " + who + " has joined " + chan + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[1].match(/part/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var chan = list[2].substr(1);

							$(chan + ' .userlist li').remove(":contains('" + who + "')");
							$(chan).append((new Date()).toLocaleTimeString() + " " + who + " has left " + chan + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);
						
						} else if (list[1].match(/quit/i)) {
							var who = list[0].substr(1,list[0].indexOf('!')-1);
							var msg = s.substr(s.substr(1).indexOf(':') + 2);

							$('.userlist li').remove(":contains('" + who + "')");
							$(panellist[target]).append((new Date()).toLocaleTimeString() + " " + who + ' has quit: ' + msg + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);

						} else if (list[0].match(/^error/i)) {
							$('#content').tabs("select", "status");
							$('#status').append("<span style=\"color:#F00\">" + s + '</span><br/>');
							window.scrollTo(0,document.body.scrollHeight);
						
						} else {
							$('#status').append(s + '<br/>');
							window.scrollTo(0,document.body.scrollHeight);
						}

					} else if (!s.match(/^$/) && !s.match(/^\s+$/)) {
						$('#status').append(s + '<br/>');
						window.scrollTo(0,document.body.scrollHeight);
					}

				}
			}

			s = "";
		}

		setTimeout('load()', 10);
	} catch(e) {
		document.getElementById('status').innerHTML += e;
		window.scrollTo(0,document.body.scrollHeight);
	}
}

function send(event) {
	if (event.keyCode == 13) {
		try {
			var l = document.getElementById('inbox').value;
			if (l.charAt(0) == '/') {
				if (l.substr(1).match(/^me\ /i) && target) {
					var tab = tablist[target];
					document.getElementById('IRCSocket').write('privmsg ' + tab.text + ' :'  + l.replace(/^\/me\ (.*)$/i, "\001ACTION $1\001") + '\n');
					l = l.replace(/^\/me\ /i,"").replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/http:\/\/(\S+)/g, "<a href=\"http://$1\">http://$1</a>");
					var panel = panellist[target];
					$(panel).append((new Date()).toLocaleTimeString() + " * <span style=\"color:#F00\">" + nick + "</span> " + l + '<br/>');

				} else
					document.getElementById('IRCSocket').write(l.substr(1) + '\n');

			} else if (target) {
				var tab = tablist[target];
				document.getElementById('IRCSocket').write('privmsg ' + tab.text + ' :'  + l + '\n');
				l = l.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/http:\/\/(\S+)/g, "<a href=\"http://$1\">http://$1</a>");
				var panel = panellist[target];
				$(panel).append((new Date()).toLocaleTimeString() + " &lt;<span style=\"color:#F00\">" + nick + "</span>&gt; " + l + '<br/>');
			}

			window.scrollTo(0,document.body.scrollHeight);
			
		} catch (e) {
			document.getElementById('status').innerHTML += e;
		}

		document.getElementById('inbox').value = '';
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
