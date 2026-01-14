# Build and Test Commands

## Quick Commands

### 1. Check if your device is connected
```bash
adb devices
```
You should see your device listed. If not, connect your phone via USB and enable USB debugging.

### 2. Build and install on your device
```bash
npx expo run:android --device
```
This will:
- Build the Android app
- Install it on your connected device
- Launch the app automatically

### 3. Build and install (release variant)
```bash
npx expo run:android --device --variant release
```

### 4. Check build logs in real-time
```bash
cd android && ./gradlew assembleDebug --info
```

### 5. Install already built APK
```bash
# Debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Release APK  
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 6. Launch the app after installation
```bash
adb shell am start -n com.techvriksha.doclock/.MainActivity
```

### 7. View app logs (useful for debugging)
```bash
npx react-native log-android
# OR
adb logcat | grep -i "react\|expo\|firebase"
```

### 8. Clean and rebuild (if build fails)
```bash
cd android && ./gradlew clean && cd .. && npx expo run:android --device
```

### 9. Check if Firebase config files are in place
```bash
ls -la android/app/google-services.json
ls -la ios/docLock/GoogleService-Info.plist
```

### 10. Restart Metro bundler (if JS changes don't reflect)
```bash
npx expo start --clear
```

## Troubleshooting

### If device not detected:
1. Enable USB Debugging: Settings > About Phone > Tap Build Number 7 times
2. Go to Settings > Developer Options > Enable USB Debugging
3. Connect phone via USB
4. Accept the USB debugging prompt on your phone

### If build fails:
1. Check the error message in terminal
2. Try: `cd android && ./gradlew clean`
3. Rebuild: `npx expo run:android --device`

### If Firebase Auth doesn't work:
- Verify `google-services.json` is in `android/app/`
- Check that React Native Firebase packages are installed: `npm list @react-native-firebase/app @react-native-firebase/auth`
