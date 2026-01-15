#!/bin/bash

# iOS TestFlight Build Script for docLock
# This script helps you build and submit your app to TestFlight

set -e

echo "🚀 docLock iOS TestFlight Build Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
    print_success "EAS CLI installed"
fi

# Check if logged into EAS
if ! eas whoami &> /dev/null; then
    print_warning "Not logged into EAS"
    echo "Please login to EAS:"
    eas login
fi

echo ""
echo "Select build option:"
echo "1) Build for TestFlight (Production)"
echo "2) Build for Internal Testing (Preview)"
echo "3) Build and Submit to TestFlight"
echo "4) Clean and Rebuild iOS"
echo "5) Open in Xcode"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_warning "Building for TestFlight (Production)..."
        eas build --platform ios --profile production
        print_success "Build complete! Check EAS dashboard for download link."
        ;;
    2)
        print_warning "Building for Internal Testing..."
        eas build --platform ios --profile preview
        print_success "Build complete! Check EAS dashboard for download link."
        ;;
    3)
        print_warning "Building and submitting to TestFlight..."
        eas build --platform ios --profile production --auto-submit
        print_success "Build and submit complete!"
        ;;
    4)
        print_warning "Cleaning iOS build..."
        cd ios
        rm -rf Pods Podfile.lock build
        print_success "Cleaned iOS build files"
        
        print_warning "Reinstalling pods..."
        pod install
        print_success "Pods reinstalled"
        
        cd ..
        print_success "iOS rebuild complete!"
        ;;
    5)
        print_warning "Opening in Xcode..."
        open ios/docLock.xcworkspace
        print_success "Xcode opened"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Done!"
