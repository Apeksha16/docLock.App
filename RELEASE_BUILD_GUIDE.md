# Creating Standalone Release Builds

## Understanding Metro Bundler

**Why Metro is used:**
- Metro bundles your JavaScript/TypeScript code into a single file
- It's needed during **build time** to create the JS bundle
- In **release builds**, the bundle is **embedded in the APK** - Metro doesn't run at runtime
- In **development builds**, Metro runs as a server for hot reloading

## Release Build Process

### What Happens in a Release Build:
1. **Metro bundles JS** → Creates `index.android.bundle` (embedded in APK)
2. **Gradle compiles native code** → Creates native Android libraries
3. **Everything is packaged** → Single standalone APK/AAB file
4. **No Metro needed at runtime** → App runs completely offline

## Creating Standalone Release APK

### Option 1: Local Build (Recommended for Testing)

```bash
# Build release APK (Metro bundles JS, then Gradle creates APK)
cd android && ./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

**This creates a standalone APK that:**
- ✅ Contains all JavaScript bundled inside
- ✅ Contains all native code compiled
- ✅ Works offline (no Metro needed)
- ✅ Can be installed on any Android device
- ✅ Ready for distribution

### Option 2: Using Expo Commands

```bash
# Build and create release APK
npx expo run:android --variant release --no-install

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Option 3: EAS Build (Cloud Build - Best for Production)

```bash
# Build production APK in the cloud
npx eas build --platform android --profile production

# This creates a production-ready APK with:
# - Optimized bundle
# - Code signing
# - Ready for Play Store
```

## Key Differences

| Build Type | Metro at Runtime? | JS Bundle Location | Use Case |
|------------|-------------------|-------------------|----------|
| **Development** | ✅ Yes (for hot reload) | Loaded from Metro server | Development |
| **Debug APK** | ❌ No (but debuggable) | Embedded in APK | Testing |
| **Release APK** | ❌ No (optimized) | Embedded in APK | Production |

## Creating Your Standalone Release APK

### Step-by-Step:

1. **Build the release APK:**
   ```bash
   cd android && ./gradlew assembleRelease
   ```

2. **Find your APK:**
   ```bash
   ls -lh android/app/build/outputs/apk/release/app-release.apk
   ```

3. **Install on device:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Or transfer to device:**
   - Copy APK to your phone
   - Install manually
   - Works completely offline!

## Important Notes

- ✅ **Release APK is standalone** - No Metro needed after installation
- ✅ **JS bundle is embedded** - All code is in the APK
- ✅ **Works offline** - No network connection required
- ✅ **Optimized** - Code is minified and optimized
- ⚠️ **Code signing** - For Play Store, you need a proper keystore

## For Play Store Distribution

If you want to publish to Google Play Store, you need:

1. **Create a keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/app/build.gradle`**

3. **Build signed APK/AAB:**
   ```bash
   cd android && ./gradlew bundleRelease  # Creates AAB for Play Store
   ```

## Summary

**Metro is only used during BUILD TIME** to bundle JavaScript. The final release APK contains everything embedded and works completely standalone - no Metro server needed!
