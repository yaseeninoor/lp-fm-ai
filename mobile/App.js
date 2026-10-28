import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator, Text, BackHandler, Platform, ImageBackground } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const PORTAL_URL = 'https://noor.yaseenis.com/';

export default function App() {
  const webViewRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2600);
    return () => clearTimeout(timer);
  }, []);

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
        {showSplash && (
          <View style={styles.splashOverlay}>
            <ImageBackground source={{ uri: 'https://commons.wikimedia.org/wiki/Special:FilePath/Green%20Dome%2C%20Masjid%20Al%20Nabawi.jpg?width=1200' }} resizeMode="cover" style={styles.splashImage}>
              <View style={styles.splashShade}>
                <Text style={styles.splashArabic}>☾</Text>
                <Text style={styles.splashBrand}>YASEENIS</Text>
                <Text style={styles.splashSub}>NOOR PORTAL</Text>
                <View style={styles.splashDivider} />
                <Text style={styles.splashMade}>Made By</Text>
                <Text style={styles.splashName}>Noor Mohammed Yaseeni</Text>
                <Text style={styles.splashPhone}>+91 90808 31302</Text>
                <ActivityIndicator size="small" color="#E7CE8B" style={{ marginTop: 22 }} />
                <Text style={styles.splashLoading}>Islamic Knowledge · Books · Media</Text>
              </View>
            </ImageBackground>
          </View>
        )}
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
  splashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20, backgroundColor: '#052D27' },
  splashImage: { flex: 1, justifyContent: 'flex-end' },
  splashShade: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: 'rgba(3, 31, 24, 0.53)' },
  splashArabic: { color: '#E7CE8B', fontSize: 66, marginBottom: 18 },
  splashBrand: { color: '#FFF8E8', fontSize: 36, fontWeight: '900', letterSpacing: 4, textShadowColor: '#001A13', textShadowRadius: 12 },
  splashSub: { color: '#E7CE8B', fontSize: 17, fontWeight: '700', letterSpacing: 3, marginTop: 4 },
  splashDivider: { width: 90, height: 2, backgroundColor: '#E7CE8B', marginVertical: 28, borderRadius: 2 },
  splashMade: { color: '#E8D7A5', fontSize: 13 },
  splashName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  splashPhone: { color: '#FFF3D0', fontSize: 16, fontWeight: '700', marginTop: 6 },
  splashLoading: { color: '#FFF3D0', fontSize: 12, marginTop: 12, letterSpacing: 0.5 },
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
