#!/bin/bash

# StoryKeeper iOS Build Upload Script
# Uploads IPA directly to App Store Connect

set -e

# Configuration
IPA_PATH="/Users/michellebrattin/storykeeper-library/ios/App/build/ipaExport-v19/App.ipa"
BUNDLE_ID="co.thestorykeeper.app"
APPLE_ID="${APPLE_ID:-msbratt23@gmail.com}"

# Check if IPA exists
if [ ! -f "$IPA_PATH" ]; then
    echo "Error: IPA file not found at $IPA_PATH"
    exit 1
fi

# Check if password is provided
if [ -z "$APP_STORE_PASSWORD" ]; then
    echo "Error: APP_STORE_PASSWORD environment variable not set"
    echo ""
    echo "Usage:"
    echo "  export APP_STORE_PASSWORD='your-app-specific-password'"
    echo "  $0"
    echo ""
    echo "To generate an app-specific password:"
    echo "  1. Go to appleid.apple.com"
    echo "  2. Security → App Passwords"
    echo "  3. Generate new app password for App Store Connect"
    exit 1
fi

echo "📱 Uploading StoryKeeper Build 19 to App Store Connect..."
echo "   IPA: $(basename $IPA_PATH)"
echo "   Size: $(ls -lh $IPA_PATH | awk '{print $5}')"
echo "   Apple ID: $APPLE_ID"
echo ""

# Upload using xcrun altool
xcrun altool --upload-app \
    --file "$IPA_PATH" \
    --type ios \
    --username "$APPLE_ID" \
    --password "$APP_STORE_PASSWORD"

echo ""
echo "✅ Upload complete!"
echo "📊 Check App Store Connect: https://appstoreconnect.apple.com/apps/1234567890/testflight/ios"
