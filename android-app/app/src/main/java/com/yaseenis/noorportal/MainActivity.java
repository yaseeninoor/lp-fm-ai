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
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://noor.yaseenis.com/";
    private static final int GREEN = Color.rgb(7, 59, 50);
    private static final int GOLD = Color.rgb(218, 178, 91);
    private static final int INK = Color.rgb(32, 48, 43);
    private WebView webView;
    private LinearLayout root;
    private LinearLayout webShell;
    private ProgressBar progress;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showHome();
    }

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private TextView label(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private LinearLayout vertical() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    private void showHome() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        root = vertical();
        root.setPadding(dp(18), dp(18), dp(18), dp(22));
        root.setBackgroundColor(Color.rgb(246, 247, 242));
        scroll.addView(root);

        LinearLayout hero = vertical();
        hero.setGravity(Gravity.CENTER);
        hero.setPadding(dp(18), dp(28), dp(18), dp(26));
        hero.setBackgroundColor(GREEN);
        TextView arabic = label("يَا يَسِينِي نُور", 27, Color.WHITE, true);
        arabic.setGravity(Gravity.CENTER);
        hero.addView(arabic);
        TextView brand = label("YASEENI NOOR", 13, GOLD, true);
        brand.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams brandParams = new LinearLayout.LayoutParams(-1, -2);
        brandParams.topMargin = dp(5);
        hero.addView(brand, brandParams);
        TextView tagline = label("இஸ்லாமிய அறிவும் ஆன்மிகப் பயணமும்", 16, Color.WHITE, true);
        tagline.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tagParams = new LinearLayout.LayoutParams(-1, -2);
        tagParams.topMargin = dp(10);
        hero.addView(tagline, tagParams);
        root.addView(hero, new LinearLayout.LayoutParams(-1, -2));

        TextView heading = label("உங்களுக்கான உள்ளடக்கங்கள்", 21, GREEN, true);
        LinearLayout.LayoutParams hp = new LinearLayout.LayoutParams(-1, -2);
        hp.topMargin = dp(22);
        hp.bottomMargin = dp(5);
        root.addView(heading, hp);
        root.addView(label("தேர்ந்தெடுத்துப் பாருங்கள்; இணைய இணைப்பு தேவை.", 13, Color.DKGRAY, false));

        addCard("📚", "இஸ்லாமிய கட்டுரைகள்", "ஆன்மிகக் கட்டுரைகள் மற்றும் பயனுள்ள பதிவுகள்");
        addCard("📖", "புத்தக நூலகம்", "புத்தகங்கள் மற்றும் PDF வாசிப்பு");
        addCard("🖼️", "படங்கள் & போஸ்டர்கள்", "இஸ்லாமிய படங்கள் மற்றும் வடிவமைப்புகள்");
        addCard("▶", "வீடியோ & ஆடியோ", "வீடியோக்கள், உரைகள் மற்றும் ஆடியோ");
        addCard("🕋", "வரலாறு & ஞானிகள்", "இஸ்லாமிய வரலாறுகள் மற்றும் வாழ்க்கை வரலாறுகள்");

        Button open = new Button(this);
        open.setText("NOOR இணையதளத்தைத் திறக்கவும்  →");
        open.setTextColor(Color.WHITE);
        open.setAllCaps(false);
        open.setTextSize(15);
        open.setBackgroundTintList(android.content.res.ColorStateList.valueOf(GREEN));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-1, dp(54));
        bp.topMargin = dp(20);
        root.addView(open, bp);
        open.setOnClickListener(v -> openSite(HOME_URL));

        TextView footer = label("Made with ♥ by Yaseeni Noor", 12, Color.GRAY, false);
        footer.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams fp = new LinearLayout.LayoutParams(-1, -2);
        fp.topMargin = dp(20);
        root.addView(footer, fp);
        setContentView(scroll);
    }

    private void addCard(String icon, String title, String detail) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setPadding(dp(12), dp(13), dp(12), dp(13));
        card.setBackgroundColor(Color.WHITE);

        TextView iconView = label(icon, 26, GREEN, false);
        iconView.setGravity(Gravity.CENTER);
        card.addView(iconView, new LinearLayout.LayoutParams(dp(48), dp(48)));

        LinearLayout labels = vertical();
        labels.setPadding(dp(10), 0, dp(4), 0);
        labels.addView(label(title, 16, GREEN, true));
        TextView desc = label(detail, 12, INK, false);
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(-1, -2);
        dlp.topMargin = dp(4);
        labels.addView(desc, dlp);
        card.addView(labels, new LinearLayout.LayoutParams(0, -2, 1));
        TextView arrow = label("›", 28, GOLD, true);
        card.addView(arrow, new LinearLayout.LayoutParams(dp(25), -2));

        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, -2);
        cp.topMargin = dp(10);
        root.addView(card, cp);
        card.setElevation(dp(2));
        card.setOnClickListener(v -> openSite(HOME_URL));
    }

    private void openSite(String url) {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        webShell = vertical();
        webShell.setBackgroundColor(Color.WHITE);
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(8), dp(4), dp(8), dp(4));
        toolbar.setBackgroundColor(GREEN);

        Button home = new Button(this);
        home.setText("⌂ முகப்பு");
        home.setAllCaps(false);
        home.setTextColor(Color.WHITE);
        home.setBackgroundTintList(android.content.res.ColorStateList.valueOf(GREEN));
        toolbar.addView(home, new LinearLayout.LayoutParams(-2, dp(48)));
        home.setOnClickListener(v -> {
            if (webView != null) webView.loadUrl(HOME_URL);
        });
        TextView title = label("YASEENI NOOR", 14, Color.WHITE, true);
        title.setGravity(Gravity.CENTER);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, -1, 1));
        Button refresh = new Button(this);
        refresh.setText("↻");
        refresh.setTextSize(22);
        refresh.setTextColor(Color.WHITE);
        refresh.setBackgroundTintList(android.content.res.ColorStateList.valueOf(GREEN));
        toolbar.addView(refresh, new LinearLayout.LayoutParams(dp(48), dp(48)));
        refresh.setOnClickListener(v -> { if (webView != null) webView.reload(); });
        webShell.addView(toolbar);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(android.content.res.ColorStateList.valueOf(GOLD));
        webShell.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
        });
        webView.setDownloadListener((downloadUrl, userAgent, contentDisposition, mimeType, contentLength) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))); }
            catch (ActivityNotFoundException e) {
                Toast.makeText(MainActivity.this, "பதிவிறக்க இணைப்பைத் திறக்க முடியவில்லை", Toast.LENGTH_LONG).show();
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
                String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
                if ("https".equals(scheme) && (host.equals("yaseenis.com") || host.endsWith(".yaseenis.com"))) return false;
                if ("http".equals(scheme) || "https".equals(scheme) || "whatsapp".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException e) {
                        Toast.makeText(MainActivity.this, "இந்த இணைப்பைத் திறக்க முடியவில்லை", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }
                return true;
            }
        });
        webShell.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));
        webView.loadUrl(url);
        setContentView(webShell);
    }

    @Override public void onBackPressed() {
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

    @Override protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}