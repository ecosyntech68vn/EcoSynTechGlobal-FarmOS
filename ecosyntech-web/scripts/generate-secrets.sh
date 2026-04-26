#!/bin/bash
# Generate secure secrets for EcoSynTech

generate_secret() {
  openssl rand -hex 32
}

# Check if .env exists
if [ ! -f .env ]; then
  echo "Creating .env from defaults.properties..."
  cp defaults.properties .env
fi

# Generate JWT_SECRET if empty
if grep -q "^JWT_SECRET=$" .env || grep -q "^JWT_SECRET=$" .env 2>/dev/null; then
  echo "Generating JWT_SECRET..."
  JWT_SECRET=$(generate_secret)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
fi

# Generate HMAC_SECRET if empty
if grep -q "^HMAC_SECRET=$" .env || grep -q "^HMAC_SECRET=$" .env 2>/dev/null; then
  echo "Generating HMAC_SECRET..."
  HMAC_SECRET=$(generate_secret)
  sed -i "s|^HMAC_SECRET=.*|HMAC_SECRET=$HMAC_SECRET|" .env
fi

# Generate WEBHOOK_SECRET if empty
if grep -q "^WEBHOOK_SECRET=$" .env || grep -q "^WEBHOOK_SECRET=$" .env 2>/dev/null; then
  echo "Generating WEBHOOK_SECRET..."
  WEBHOOK_SECRET=$(generate_secret)
  sed -i "s|^WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$WEBHOOK_SECRET|" .env
fi

echo "✅ Secrets generated:"
grep "^JWT_SECRET=" .env | cut -d= -f2 | head -c 20
echo "..."
grep "^HMAC_SECRET=" .env | cut -d= -f2 | head -c 20
echo "..."
echo ""
echo "Run: cp .env .env.production && edit production values"