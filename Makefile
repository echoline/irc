SSLApplet.jar: SSLApplet.class
	jar cmf manifest.txt SSLApplet.jar SSLApplet*.class server.cert.crt

SSLApplet.class: SSLApplet.java
	javac SSLApplet.java

clean:
	rm -f SSLApplet.jar *.class
