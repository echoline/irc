IRCSocket.jar: IRCSocket.class
	jar cmf manifest.txt IRCSocket.jar IRCSocket*.class server.cert.crt

IRCSocket.class: IRCSocket.java
	javac IRCSocket.java

clean:
	rm -f IRCSocket.jar *.class
