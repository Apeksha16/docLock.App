#!/bin/bash

# Xcode Setup and Build Helper for docLock
# This script helps you prepare and build for iPhone/TestFlight

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         docLock - Xcode Build Helper                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if iPhone is connected
echo ""
echo "Checking for connected devices..."
echo ""

DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep "iPhone" | grep -v "Simulator" | grep -v "Offline")

if [ -z "$DEVICES" ]; then
    print_warning "No iPhone detected or iPhone is offline"
    echo ""
    echo "Please ensure:"
    echo "  1. iPhone is connected via USB cable"
    echo "  2. iPhone is unlocked"
    echo "  3. You've tapped 'Trust This Computer' on iPhone"
    echo "  4. iPhone is not in sleep mode"
    echo ""
    read -p "Press Enter after connecting your iPhone..."
    
    # Check again
    DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep "iPhone" | grep -v "Simulator" | grep -v "Offline")
    if [ -z "$DEVICES" ]; then
        print_error "Still no iPhone detected"
        echo ""
        echo "Troubleshooting steps:"
        echo "  1. Unplug and replug the USB cable"
        echo "  2. Try a different USB port"
        echo "  3. Restart your iPhone"
        echo "  4. Check if iPhone appears in Finder sidebar"
        echo ""
        exit 1
    fi
fi

print_success "iPhone detected!"
echo "$DEVICES"
echo ""

# Menu
echo "What would you like to do?"
echo ""
echo "1) Open Xcode and prepare for iPhone build"
echo "2) Open Xcode and prepare for TestFlight archive"
echo "3) Clean build and open Xcode"
echo "4) Check project configuration"
echo "5) View connected devices"
echo "6) Open Xcode Build Guide"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        print_info "Opening Xcode for iPhone build..."
        echo ""
        echo "Next steps in Xcode:"
        echo "  1. Select your iPhone from device dropdown (top bar)"
        echo "  2. Click ▶️ Play button (or Cmd+R)"
        echo "  3. Wait for build and app will launch on iPhone"
        echo ""
        open ios/docLock.xcworkspace
        print_success "Xcode opened!"
        ;;
    2)
        print_info "Opening Xcode for TestFlight archive..."
        echo ""
        echo "Next steps in Xcode:"
        echo "  1. Select 'Any iOS Device (arm64)' from device dropdown"
        echo "  2. Go to Product > Archive (or Cmd+Shift+B)"
        echo "  3. Wait for archive to complete"
        echo "  4. In Organizer, click 'Distribute App'"
        echo "  5. Select 'App Store Connect' > Upload"
        echo ""
        open ios/docLock.xcworkspace
        print_success "Xcode opened!"
        ;;
    3)
        print_warning "Cleaning build..."
        cd ios
        rm -rf build
        print_success "Build cleaned!"
        
        print_info "Opening Xcode..."
        open docLock.xcworkspace
        cd ..
        print_success "Done!"
        ;;
    4)
        print_info "Checking project configuration..."
        echo ""
        echo "Project: docLock"
        echo "Bundle ID: com.techvriksha.doclock"
        echo "Workspace: ios/docLock.xcworkspace"
        echo ""
        
        if [ -f "ios/docLock.xcworkspace" ]; then
            print_success "Workspace exists"
        else
            print_error "Workspace not found!"
        fi
        
        if [ -d "ios/Pods" ]; then
            print_success "Pods installed"
        else
            print_warning "Pods not found - run: cd ios && pod install"
        fi
        
        echo ""
        echo "App Configuration (app.json):"
        if [ -f "app.json" ]; then
            VERSION=$(grep -A 1 '"version"' app.json | tail -1 | sed 's/.*: "\(.*\)".*/\1/')
            BUNDLE=$(grep -A 1 '"bundleIdentifier"' app.json | tail -1 | sed 's/.*: "\(.*\)".*/\1/')
            echo "  Version: $VERSION"
            echo "  Bundle ID: $BUNDLE"
        fi
        ;;
    5)
        print_info "Connected devices:"
        echo ""
        xcrun xctrace list devices
        ;;
    6)
        print_info "Opening Xcode Build Guide..."
        if command -v code &> /dev/null; then
            code XCODE_BUILD_GUIDE.md
        else
            open XCODE_BUILD_GUIDE.md
        fi
        print_success "Guide opened!"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Ready to build!"
echo ""
print_info "Need help? Check XCODE_BUILD_GUIDE.md for detailed instructions"
