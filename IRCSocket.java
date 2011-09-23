import javax.net.ssl.*;
import java.security.cert.*;
import java.io.InputStream;
import java.util.Vector;

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
		return reader.read();
	}

	private class SSLReader implements Runnable {
		SSLSocket s;
		Vector<Byte> r = new Vector<Byte>();

		public SSLReader(SSLSocket sin) {
			s = sin;
		}

		public void run() {
			int i = -1;

			try {
				while ((i = s.getInputStream().read()) != -1)
					synchronized(r) {
						r.add((byte)i);
					}
			} catch (Exception e) {
				try {
					byte u[] = e.toString().getBytes("UTF-8");

					for (i = 0; i < u.length; i++)
						r.add(u[i]);
				} catch (Exception screwed) {
				}
			}
		}

		public String read() {
			String ret = null;
			synchronized(r) {
				if (r.size() != 0) {
					byte u[] = new byte[r.size()];

					for (int i = 0; i < r.size(); i++)
						u[i] = r.get(i).byteValue();

					try {
						ret = new String(u, 0, r.size(), "UTF-8");
					} catch (Exception e) {
						ret = e.toString();
					}

					r.clear();
				}
			}
			return ret;
		}
	}
}
