package com.yaseenis.noorportal;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://yaseenis.com/";
    private static final int GREEN = Color.rgb(7, 59, 50);
    private static final int GOLD = Color.rgb(218, 178, 91);
    private WebView webView;
    private LinearLayout root;
    private int pageViewId = 7101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showHome();
    }

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private void showHome() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(24), dp(20), dp(24));
        root.setBackgroundColor(Color.rgb(246, 247, 242));
        scroll.addView(root);

        TextView brand = text("يَا يَسِينِي نور", 25, Color.WHITE, true);
        brand.setGravity(Gravity.CENTER);
        TextView subtitle = text("YASEENI NOOR", 13, GOLD, true);
        subtitle.setGravity(Gravity.CENTER);
        TextView tagline = text("இஸ்லாமிய அறிவும் ஆன்மிகப் பயணமும்", 16, Color.WHITE, true);
        tagline.setGravity(Gravity.CENTER);
        LinearLayout hero = new LinearLayout(this);
        hero.setOrientation(LinearLayout.VERTICAL);
        hero.setGravity(Gravity.CENTER);
        hero.setPadding(dp(16), dp(24), dp(16), dp(24));
        hero.setBackgroundColor(GREEN);
        hero.addView(brand);
        hero.addView(subtitle);
        hero.addView(tagline);
        root.addView(hero, new LinearLayout.LayoutParams(-1, -2));

        TextView heading = text("உள்ளடக்கங்கள்", 21, GREEN, true);
        LinearLayout.LayoutParams headingParams = new LinearLayout.LayoutParams(-1, -2);
        headingParams.topMargin = dp(22);
        headingParams.bottomMargin = dp(8);
        root.addView(heading, headingParams);
        TextView intro = text("கட்டுரைகள், புத்தகங்கள் மற்றும் ஊடகங்களை ஒரே இடத்தில் அணுகுங்கள்.", 14, Color.DKGRAY, false);
        root.addView(intro);

        addCard("📚", "இஸ்லாமிய கட்டுரைகள்", "ஆன்மிகக் கட்டுரைகள் மற்றும் பயனுள்ள பதிவுகள்", HOME_URL);
        addCard("📖", "புத்தக நூலகம்", "புத்தகங்கள் மற்றும் PDF வாசிப்பு", HOME_URL);
        addCard("🖼️", "படங்கள்", "இஸ்லாமிய படங்கள் மற்றும் போஸ்டர்கள்", HOME_URL);
        addCard("▶️", "வீடியோ & ஆடியோ", "வீடியோக்கள், உரைகள் மற்றும் ஆடியோ", HOME_URL);
        addCard("🕋", "வரலாறு & ஞானிகள்", "இஸ்லாமிய வரலாறுகள் மற்றும் வாழ்க்கை வரலாறுகள்", HOME_URL);

        Button open = new Button(this);
        open.setText("Yaseenis இணையதளத்தைத் திறக்கவும்");
        open.setTextColor(Color.WHITE);
        open.setBackgroundTintList(android.content.res.ColorStateList.valueOf(GREEN));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-1, dp(54));
        bp.topMargin = dp(18);
        root.addView(open, bp);
        open.setOnClickListener(v -> openSite(HOME_URL));

        TextView note = text("Made with ♥ by Yaseeni Noor", 12, Color.GRAY, false);
        note.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams np = new LinearLayout.LayoutParams(-1, -2);
        np.topMargin = dp(22);
        root.addView(note, np);
        setContentView(scroll);
    }

    private void addCard(String icon, String title, String detail, String url) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setPadding(dp(14), dp(14), dp(12), dp(14));
        card.setBackgroundTintList(null);
        card.setBackgroundColor(Color.WHITE);
        TextView iconView = text(icon, 27, GREEN, false);
        iconView.setGravity(Gravity.CENTER);
        card.addView(iconView, new LinearLayout.LayoutParams(dp(54), dp(54)));
        LinearLayout labels = new LinearLayout(this);
        labels.setOrientation(LinearLayout.VERTICAL);
        labels.setPadding(dp(10), 0, 0, 0);
        labels.addView(text(title, 16, GREEN, true));
        TextView desc = text(detail, 12, Color.DKGRAY, false);
        LinearLayout.LayoutParams dpParams = new LinearLayout.LayoutParams(-1, -2);
        dpParams.topMargin = dp(4);
        labels.addView(desc, dpParams);
        card.addView(labels, new LinearLayout.LayoutParams(0, -2, 1));
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, -2);
        cp.topMargin = dp(10);
        root.addView(card, cp);
        card.setElevation(dp(2));
        card.setOnClickListener(v -> openSite(url));
    }

    private void openSite(String url) {
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
                if ("https".equals(scheme) && (host.equals("yaseenis.com") || host.endsWith(".yaseenis.com"))) return false;
                if ("http".equals(scheme) || "https".equals(scheme) || "whatsapp".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException e) { Toast.makeText(MainActivity.this, "இந்த இணைப்பைத் திறக்க முடியவில்லை", Toast.LENGTH_SHORT).show(); }
                    return true;
                }
                return true;
            }
        });
        webView.loadUrl(url);
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else if (webView != null) {
            webView.destroy();
            webView = null;
            showHome();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}