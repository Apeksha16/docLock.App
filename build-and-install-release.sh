#!/bin/bash

# Build and Install Release APK Script
# This script builds a release APK and installs it on your connected Android device

set -e  # Exit on error

echo "🚀 Starting Release APK Build and Install Process..."
echo ""

# Step 1: Check if device is connected
echo "📱 Step 1: Checking for connected device..."
if ! adb devices | grep -q "device$"; then
    echo "❌ No device found! Please connect your Android device via USB and enable USB debugging."
    echo "   Run: adb devices"
    exit 1
fi
echo "✅ Device connected!"
echo ""

# Step 2: Clean previous builds (optional but recommended)
echo "🧹 Step 2: Cleaning previous builds..."
cd android
./gradlew clean
cd ..
echo "✅ Clean completed!"
echo ""

# Step 3: Build release APK
echo "🔨 Step 3: Building release APK (this may take a few minutes)..."
cd android
./gradlew assembleRelease
cd ..
echo "✅ Build completed!"
echo ""

# Step 4: Check if APK exists
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at $APK_PATH"
    exit 1
fi

# Get APK size
APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "📦 APK created: $APK_PATH ($APK_SIZE)"
echo ""

# Step 5: Install on device
echo "📲 Step 4: Installing APK on device..."
adb install -r "$APK_PATH"
echo "✅ Installation completed!"
echo ""

# Step 6: Launch the app (optional)
echo "🎯 Step 5: Launching app..."
adb shell am start -n com.techvriksha.doclock/.MainActivity
echo "✅ App launched!"
echo ""

echo "🎉 Success! Your release APK has been built and installed on your device!"
echo ""
echo "APK location: $APK_PATH"
echo "You can share this APK file with others or install it on other devices."
