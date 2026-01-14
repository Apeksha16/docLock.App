# Step-by-Step: Build and Install Release APK

## Quick One-Line Command (Easiest)

```bash
./build-and-install-release.sh
```

This script does everything automatically!

---

## Manual Step-by-Step Commands

Run these commands **one by one** in your terminal:

### Step 1: Check Device Connection
```bash
adb devices
```
**Expected output:** You should see your device listed. If not, connect your phone via USB and enable USB debugging.

---

### Step 2: Navigate to Android Directory
```bash
cd android
```

---

### Step 3: Clean Previous Builds (Optional but Recommended)
```bash
./gradlew clean
```
**Wait for:** "BUILD SUCCESSFUL"

---

### Step 4: Build Release APK
```bash
./gradlew assembleRelease
```
**Wait for:** "BUILD SUCCESSFUL" (This takes 3-5 minutes)

---

### Step 5: Go Back to Project Root
```bash
cd ..
```

---

### Step 6: Check APK was Created
```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
```
**Expected output:** You should see the APK file with its size (e.g., 50MB)

---

### Step 7: Install APK on Device
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```
**Expected output:** "Success" or "Performing Streamed Install"

---

### Step 8: Launch the App (Optional)
```bash
adb shell am start -n com.techvriksha.doclock/.MainActivity
```

---

## All Commands in One Block (Copy & Paste)

```bash
# Step 1: Check device
adb devices

# Step 2-4: Build APK
cd android && ./gradlew clean && ./gradlew assembleRelease && cd ..

# Step 5: Install
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Step 6: Launch (optional)
adb shell am start -n com.techvriksha.doclock/.MainActivity
```

---

## Troubleshooting

### If "adb: command not found"
- Make sure Android SDK platform-tools is in your PATH
- Or use full path: `~/Library/Android/sdk/platform-tools/adb`

### If "No device found"
1. Connect phone via USB
2. Enable USB Debugging: Settings → Developer Options → USB Debugging
3. Accept the USB debugging prompt on your phone
4. Run `adb devices` again

### If build fails
- Make sure you're in the project root directory
- Check that `android/` directory exists
- Try: `cd android && ./gradlew clean && ./gradlew assembleRelease`

### If installation fails
- Make sure device is still connected: `adb devices`
- Uninstall old version first: `adb uninstall com.techvriksha.doclock`
- Then install again: `adb install -r android/app/build/outputs/apk/release/app-release.apk`

---

## APK Location

After building, your APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

You can:
- Share this file with others
- Install on other devices
- Upload to Play Store (after signing)

---

## Success Indicators

✅ **Build successful:** "BUILD SUCCESSFUL in Xs"
✅ **APK created:** File exists at the path above
✅ **Installation successful:** "Success" message
✅ **App launches:** App opens on your device

---

## Notes

- **First build takes longer** (5-10 minutes) - subsequent builds are faster
- **APK size:** Usually 30-80MB depending on your app
- **Standalone:** This APK works completely offline - no Metro needed!
- **Release build:** Optimized and minified for production
