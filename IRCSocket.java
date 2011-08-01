import javax.net.ssl.*;
import java.security.cert.*;
import java.io.InputStream;

public class IRCSocket extends java.applet.Applet {
	SSLSocket s = null;
	SSLReader reader = null;

	public IRCSocket() throws Exception {
		TrustManager[] certs = new TrustManager[]{
		new X509TrustManager() {
			public X509Certificate[] getAcceptedIssuers() {
				return null;
			}

			public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
			}

			public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
				boolean throwit = true;
				X509Certificate cert = null;

				try {
					InputStream inStream = getClass().getResourceAsStream("server.cert.crt");
					CertificateFactory cf = CertificateFactory.getInstance("X.509");
					cert = (X509Certificate)cf.generateCertificate(inStream);
					inStream.close();
				} catch (Exception e) {
					throw new CertificateException(e.toString());
				}

				for (int j = 0; j < chain.length; j++)
					if (chain[j].equals(cert))
						throwit = false;

				if (throwit)
					throw new CertificateException("invalid ssl certificate");
			}
		}
		};

		SSLContext sc = SSLContext.getInstance("SSL");
		sc.init(null, certs, new java.security.SecureRandom());
		s = (SSLSocket)sc.getSocketFactory().createSocket("echoline.org", 6697);

		reader = new SSLReader(s);
		Thread rthread = new Thread(reader);
		rthread.start();
	}

	public void write(String out) throws Exception {
		s.getOutputStream().write(out.getBytes("UTF-8"));
	}

	public String read() throws Exception {
		int i;
		String r = reader.read();

		if (r.length() == 0)
			return null;

		return r;
	}

	private class SSLReader implements Runnable {
		SSLSocket s;
		String r = "";

		public SSLReader(SSLSocket sin) {
			s = sin;
		}

		public void run() {
			int i = -1;

			try {
				while ((i = s.getInputStream().read()) != -1)
					synchronized(r) {
						r = (new StringBuffer(r)).append((char)i).toString();
					}
			} catch (Exception e) {
				r = e.toString();
			}
		}

		public String read() {
			String ret = "";
			synchronized(r) {
				ret = r;
				r = "";
			}
			return ret;
		}
	}
}
