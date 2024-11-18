## Development Setup

1. Copy the environment template:

cp keys/environment.template.js keys/environment.js

2. Add your API keys to `keys/environment.js`

## Set up hosting

firebase target:apply hosting se loppkartan-se
firebase target:apply hosting no loppkartan-no

## Deployment

[![Deploy to Production](https://github.com/your-username/race-aggregator/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/your-username/race-aggregator/actions/workflows/deploy-production.yml)

Click the button above to deploy to production, or run manually:

```bash
gh workflow run deploy-production.yml -f environment=production -f countries=se
```
