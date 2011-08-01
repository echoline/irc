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

function load() {
	try {
		var s = document.IRCSocket.read();

		if (s != null) {
			if (ping = s.match(/PING\s+\S+\s+/)) {
				ping = ping[0].replace("PING", "PONG");
				document.IRCSocket.write(ping);

			} else {
				document.getElementById('main').innerHTML += s;
				window.scrollTo(0,document.body.scrollHeight);
			}
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
		document.getElementById('main').innerHTML += l;
		document.IRCSocket.write(l);

		window.scrollTo(0,document.body.scrollHeight);

		privmsg = l.match(/privmsg[^:]+/);
		if (privmsg != null)
			document.getElementById('input').value = privmsg[0] + ":";
		else
			document.getElementById('input').value = "";
			
		return false;
	}
}
