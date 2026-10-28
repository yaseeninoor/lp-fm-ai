import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator, Text, BackHandler, Platform, ImageBackground } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const PORTAL_URL = 'https://noor.yaseenis.com/';

export default function App() {
  const webViewRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" backgroundColor="#052D27" />
      <View style={styles.container}>
        <WebView
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
          onLoadStart={() => { setLoading(true); setError(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          renderLoading={() => (
            <View style={styles.loading}>
              <Text style={styles.brand}>NOOR PORTAL</Text>
              <ActivityIndicator size="large" color="#D9B45B" />
              <Text style={styles.loadingText}>Yaseenis • ஏற்றப்படுகிறது…</Text>
            </View>
          )}
          startInLoadingState
        />
        {loading && (
          <View pointerEvents="none" style={styles.progress}>
            <View style={styles.progressBar} />
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>இணையதளத்தைத் திறக்க முடியவில்லை</Text>
            <Text style={styles.errorText}>இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.</Text>
            <Text style={styles.retry} onPress={() => webViewRef.current?.reload()}>மீண்டும் முயற்சி செய்க</Text>
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
  progress: { height: 3, backgroundColor: '#174C43' },
  progressBar: { height: 3, width: '48%', backgroundColor: '#D9B45B' },
  errorBox: { position: 'absolute', bottom: 28, left: 18, right: 18, padding: 18, borderRadius: 16, backgroundColor: '#FFF8E7', elevation: 8 },
  errorTitle: { color: '#073B32', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  errorText: { color: '#374741', fontSize: 14, marginBottom: 12 },
  retry: { color: '#087A63', fontSize: 15, fontWeight: '700' }
});
