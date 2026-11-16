# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- StoryKeeper: keep rules for R8 (code shrinking turned on 2026-11-15) ---

# Methods the web pages call through WebView JavaScript bridges: Capacitor's own bridge
# and the in-app browser used for platform imports. Renaming or removing them breaks
# imports and plugin calls without any error.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface,*Annotation*,Signature,InnerClasses,EnclosingMethod

# Capacitor core and every plugin we use. They are small, and they are looked up by name
# at runtime, so keeping them whole is the safe choice. The rest of the app's
# dependencies are still shrunk and obfuscated.
-keep class com.getcapacitor.** { *; }
-keep class ee.forgr.capacitor_inappbrowser.** { *; }
-keep class com.revenuecat.purchases.capacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }

# Readable crash reports in Play Console (with the mapping file R8 writes).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
