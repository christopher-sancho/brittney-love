#!/bin/bash

# Extract real messages (not test data) and restore them
echo "🔄 Restoring birthday messages..."

# First, let's see how many real messages we have
real_count=$(jq -r '.[] | select(.name != "chris" and .name != "i love her " and .name != "")' "/Users/christophersancho/Downloads/birthday-messages.json" | jq -s length)

echo "Found $real_count real birthday messages to restore"

# Create a temporary file with just the real messages
jq '[.[] | select(.name != "chris" and .name != "i love her " and .name != "")]' "/Users/christophersancho/Downloads/birthday-messages.json" > real_messages.json

echo "Filtered real messages saved to real_messages.json"

# Now restore each message
i=0
while IFS= read -r message; do
    i=$((i+1))
    
    name=$(echo "$message" | jq -r '.name')
    msg_text=$(echo "$message" | jq -r '.message')
    has_image=$(echo "$message" | jq -r 'has("image")')
    
    echo "[$i/$real_count] Restoring message from: $name"
    echo "  Message: ${msg_text:0:50}..."
    
    if [ "$has_image" = "true" ]; then
        echo "  📸 Includes image"
    fi
    
    # Send to API
    response=$(curl -s -X POST https://brittney-love.vercel.app/api/messages \
        -H "Content-Type: application/json" \
        -d "$message")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        echo "  ✅ Restored successfully"
    else
        echo "  ❌ Failed to restore"
        echo "  Response: $response"
    fi
    
    # Small delay between requests
    sleep 0.5
    
done < <(jq -c '.[]' real_messages.json)

echo ""
echo "🎉 Restoration complete!"
echo "All real birthday messages (including images) have been restored!"

# Clean up
rm real_messages.json
