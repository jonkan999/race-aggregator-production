#!/bin/bash

# Load environment variables
source credentials/.env

# Function to apply settings to a single zone
apply_zone_settings() {
    local ZONE_ID=$1
    echo "Configuring zone: $ZONE_ID"

    # Get domain name for this zone
    DOMAIN=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" | jq -r '.result.name')
    
    echo "Applying settings for domain: $DOMAIN"

    # Update DNS records to be proxied
    echo "Updating DNS records..."
    curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" | \
    jq -r '.result[] | select(.type=="A" or .type=="CNAME") | .id' | \
    while read -r DNS_RECORD_ID; do
        curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$DNS_RECORD_ID" \
             -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
             -H "Content-Type: application/json" \
             --data '{"proxied":true}'
    done
    

    # Configure caching settings
    echo "Configuring cache settings..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/browser_cache_ttl" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":31536000}'

    # Configure SSL settings
    echo "Configuring SSL settings..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"full"}'
    
        # Always use HTTPS
    echo "Configuring HTTPS settings..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'

    # Automatic HTTPS rewrites
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/automatic_https_rewrites" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'

    # Create cache rule for images
    echo "Creating image cache rules..."

    # First, get the ruleset ID for http_request_cache_settings phase
    RULESET_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
        -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
        -H "Content-Type: application/json")

    RULESET_ID=$(echo "$RULESET_RESPONSE" | jq -r '.result[] | select(.phase=="http_request_cache_settings") | .id')

    if [ -z "$RULESET_ID" ]; then
        # Create new ruleset if it doesn't exist
        echo "Creating new ruleset..."
        RULESET_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
            -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
            "name": "Image Caching",
            "description": "Cache rules for image files",
            "kind": "zone",
            "phase": "http_request_cache_settings"
            }')
        RULESET_ID=$(echo "$RULESET_RESPONSE" | jq -r '.result.id')
    fi

    # Update the ruleset with our cache rules
    echo "Updating ruleset with ID: $RULESET_ID"
    curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID" \
        -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
        "rules": [
            {
            "expression": "ends_with(http.request.uri.path, \".webp\") or ends_with(http.request.uri.path, \".jpg\") or ends_with(http.request.uri.path, \".jpeg\") or ends_with(http.request.uri.path, \".png\")",
            "description": "Cache all image files",
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": true,
                "edge_ttl": {
                "mode": "override_origin",
                "default": 2628000
                },
                "browser_ttl": {
                "mode": "override_origin",
                "default": 31536000
                }
            }
            }
        ]
        }'

    # Enable performance optimizations
    echo "Enabling performance optimizations..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/minify" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":{"css":true,"html":true,"js":true}}'

    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'

    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/early_hints" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'


    # Create page rule for race images - first check if it exists
    echo "Creating page rules..."
    PAGE_RULES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json")
    
    # Check if a rule with race-images exists
    if ! echo "$PAGE_RULES" | jq -e ".result[] | select(.targets[].constraint.value | contains(\"race-images\"))" > /dev/null; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
             -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
             -H "Content-Type: application/json" \
             --data "{
               \"targets\": [
                 {
                   \"target\": \"url\",
                   \"constraint\": {
                     \"operator\": \"matches\",
                     \"value\": \"*${DOMAIN}/race-images/*\"
                   }
                 }
               ],
               \"actions\": [
                 {
                   \"id\": \"cache_level\",
                   \"value\": \"cache_everything\"
                 },
                 {
                   \"id\": \"edge_cache_ttl\",
                   \"value\": 2628000
                 },
                 {
                   \"id\": \"browser_cache_ttl\",
                   \"value\": 31536000
                 }
               ]
             }"
    else
        echo "Page rule for race-images already exists, skipping..."
    fi

    # Set security settings (removed bot_fight_mode as it's not supported)
    echo "Configuring security settings..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"medium"}'

    echo "Configuration completed for $DOMAIN"
    echo "----------------------------------------"
}

# Main execution
echo "Starting Cloudflare configuration for all zones..."

# Loop through all zone IDs
for ZONE_ID in "${ZONE_IDS[@]}"; do
    apply_zone_settings "$ZONE_ID"
done

echo "All zones have been configured!"