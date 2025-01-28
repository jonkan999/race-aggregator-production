#!/bin/bash

# Load environment variables
source credentials/.env

cleanup_zone_settings() {
    local ZONE_ID=$1
    echo "Cleaning up zone: $ZONE_ID"

    # Get domain name for this zone
    DOMAIN=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" | jq -r '.result.name')
    
    echo "Cleaning up settings for domain: $DOMAIN"

    # Reset cache settings to default
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/browser_cache_ttl" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":14400}'

    # Delete custom rulesets
    RULESET_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
        -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
        -H "Content-Type: application/json")

    echo "$RULESET_RESPONSE" | jq -r '.result[].id' | while read -r RULESET_ID; do
        curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID" \
            -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
            -H "Content-Type: application/json"
    done

    # Delete page rules
    PAGE_RULES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json")
    
    echo "$PAGE_RULES" | jq -r '.result[].id' | while read -r RULE_ID; do
        curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules/$RULE_ID" \
             -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
             -H "Content-Type: application/json"
    done

    # Reset performance settings
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/minify" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":{"css":false,"html":false,"js":false}}'

    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"off"}'

    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/early_hints" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"off"}'

    # Delete CNAME record for images if it exists
    DNS_RECORDS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json")
    
    IMAGE_RECORD_ID=$(echo "$DNS_RECORDS" | jq -r '.result[] | select(.name=="images.'$DOMAIN'") | .id')
    if [ ! -z "$IMAGE_RECORD_ID" ]; then
        curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$IMAGE_RECORD_ID" \
             -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
             -H "Content-Type: application/json"
    fi

    echo "Cleanup completed for $DOMAIN"
    echo "----------------------------------------"
}

# Main execution
echo "Starting Cloudflare cleanup for all zones..."

# Loop through all zone IDs
for ZONE_ID in "${ZONE_IDS[@]}"; do
    cleanup_zone_settings "$ZONE_ID"
done

echo "All zones have been cleaned up!"