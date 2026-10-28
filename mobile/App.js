import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  BackHandler,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const PORTAL_URL = 'https://noor.yaseenis.com/';

export default function App() {
  const webViewRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);
  const [webViewKey, setWebViewKey] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, []);

  const retry = () => {
    setError(false);
    setLoading(true);
    setWebViewKey((key) => key + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" backgroundColor="#052D27" />
      <View style={styles.container}>
        <WebView
          key={webViewKey}
          ref={webViewRef}
          source={{ uri: PORTAL_URL }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          originWhitelist={['https://*', 'http://*']}
          mixedContentMode="never"
          onLoadStart={() => { setLoading(true); setError(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setError(true);
            }
          }}
          onRenderProcessGone={() => retry()}
          onContentProcessDidTerminate={() => retry()}
          renderLoading={() => (
            <View style={styles.loading}>
              <Text style={styles.brand}>NOOR PORTAL</Text>
              <ActivityIndicator size="large" color="#D9B45B" />
              <Text style={styles.loadingText}>Yaseenis • ஏற்றப்படுகிறது…</Text>
            </View>
          )}
          startInLoadingState
        />

        {showSplash && (
          <View style={styles.splashOverlay}>
            <View style={styles.splashPattern}>
              <Text style={styles.moon}>☾</Text>
              <Text style={styles.splashBrand}>YASEENIS</Text>
              <Text style={styles.splashSub}>NOOR PORTAL</Text>
              <View style={styles.divider} />
              <Text style={styles.made}>Made By</Text>
              <Text style={styles.name}>Noor Mohammed Yaseeni</Text>
              <Text style={styles.phone}>+91 90808 31302</Text>
              <ActivityIndicator size="small" color="#E7CE8B" style={{ marginTop: 18 }} />
              <Text style={styles.splashLoading}>Islamic Knowledge · Books · Media</Text>
            </View>
          </View>
        )}

        {loading && !showSplash && (
          <View pointerEvents="none" style={styles.progress}>
            <View style={styles.progressBar} />
          </View>
        )}

        {error && !showSplash && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>இணையதளத்தைத் திறக்க முடியவில்லை</Text>
            <Text style={styles.errorText}>இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.</Text>
            <Text style={styles.retry} onPress={retry}>மீண்டும் முயற்சி செய்க</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#052D27' },
  container: { flex: 1, backgroundColor: '#073B32' },
  webview: { flex: 1, backgroundColor: '#073B32' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#073B32', gap: 16 },
  brand: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  loadingText: { color: '#E8D7A5', fontSize: 14 },
  splashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20, backgroundColor: '#052D27' },
  splashPattern: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#073B32' },
  moon: { color: '#E7CE8B', fontSize: 66, marginBottom: 18 },
  splashBrand: { color: '#FFF8E8', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  splashSub: { color: '#E7CE8B', fontSize: 17, fontWeight: '700', letterSpacing: 3, marginTop: 4 },
  divider: { width: 90, height: 2, backgroundColor: '#E7CE8B', marginVertical: 28, borderRadius: 2 },
  made: { color: '#E8D7A5', fontSize: 13 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  phone: { color: '#FFF3D0', fontSize: 16, fontWeight: '700', marginTop: 6 },
  splashLoading: { color: '#FFF3D0', fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
  progress: { height: 3, backgroundColor: '#174C43' },
  progressBar: { height: 3, width: '48%', backgroundColor: '#D9B45B' },
  errorBox: { position: 'absolute', bottom: 28, left: 18, right: 18, padding: 18, borderRadius: 16, backgroundColor: '#FFF8E7', elevation: 8 },
  errorTitle: { color: '#073B32', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  errorText: { color: '#374741', fontSize: 14, marginBottom: 12 },
  retry: { color: '#087A63', fontSize: 15, fontWeight: '700' }
});
