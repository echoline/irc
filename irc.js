function begin() {
	try {
		var nick = "guest" + Math.floor(Math.random() * 1000);
		document.IRCSocket.write("user " + nick + " \"\" " + nick + " :" + nick + "\nnick " + nick + "\n");
		load();
	} catch(e) {
		document.getElementById('main').innerHTML += e;
		window.scrollTo(0,document.body.scrollHeight);
	}
}

var s = "";

function load() {
	try {
		var chunk = document.IRCSocket.read();

		if (chunk != null)
			s += chunk;

		if ((s != "")  && (s.charAt(s.length-1) == '\n')) {
			if (ping = s.match(/PING\s+\S+\s+/)) {
				ping = ping[0].replace("PING", "PONG");
				document.IRCSocket.write(ping);

			} else {
				s = s.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
				document.getElementById('main').innerHTML += s;
				window.scrollTo(0,document.body.scrollHeight);
			}

			s = "";
		}

		setTimeout('load()', 10);
	} catch(e) {
		document.getElementById('main').innerHTML += e;
		window.scrollTo(0,document.body.scrollHeight);
	}
}

function send(event) {
	if (event.keyCode == 13) {
		var l = document.getElementById('input').value + "\n";
		document.IRCSocket.write(l);
		l = l.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		document.getElementById('main').innerHTML += l;

		window.scrollTo(0,document.body.scrollHeight);

		privmsg = l.match(/privmsg[^:]+/i);
		if (privmsg != null)
			document.getElementById('input').value = privmsg[0] + ":";
		else
			document.getElementById('input').value = "";
			
		return false;
	}
}
