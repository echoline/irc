/**
SSLSocket applet for use with javascript.
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

import javax.net.ssl.*;
import java.security.cert.*;
import java.io.InputStream;
import java.util.Vector;

public class SSLApplet extends java.applet.Applet {
	SSLSocket s = null;
	SSLReader reader = null;

	public void init() {
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

		try {
			SSLContext sc = SSLContext.getInstance("SSL");
			sc.init(null, certs, new java.security.SecureRandom());
			String srv = getParameter("server");
			int port = Integer.parseInt(getParameter("port"));
			s = (SSLSocket)sc.getSocketFactory().createSocket(srv, port);

			reader = new SSLReader(s);
			Thread rthread = new Thread(reader);
			rthread.start();
		} catch(Exception e) {
		}
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
					int i;

					for (i = 0; i < r.size(); i++) {
						u[i] = r.get(i).byteValue();
					}

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
