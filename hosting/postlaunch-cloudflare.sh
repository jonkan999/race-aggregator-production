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

    # Keep DNS proxying for DDoS protection
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
    
    # Keep SSL and HTTPS settings
    echo "Configuring SSL/HTTPS settings..."
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"full"}'
    
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'

    # Keep Brotli compression
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" \
         -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"value":"on"}'

    # Keep security settings
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