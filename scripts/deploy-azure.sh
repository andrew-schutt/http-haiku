#!/bin/bash
set -e

# Azure Deployment Script for HTTP Haiku
# Prerequisites: Azure CLI installed and logged in

echo "🚀 HTTP Haiku - Azure Deployment Script"
echo "=========================================="

# Configuration
RESOURCE_GROUP="http-haiku-rg"
LOCATION="eastus"
ACR_NAME="httphaiku"
APP_NAME="http-haiku"
DB_SERVER_NAME="http-haiku-db"
DB_NAME="httphaiku"
DB_ADMIN_USER="haikuadmin"
DB_ADMIN_PASSWORD="${DB_ADMIN_PASSWORD:-$(openssl rand -base64 32)}"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  App Name: $APP_NAME"
echo "  Database Server: $DB_SERVER_NAME"
echo ""

# Step 1: Create Resource Group
echo "1️⃣  Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --output none

# Step 2: Create Azure Container Registry
echo "2️⃣  Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true \
  --output none

# Get ACR credentials
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

echo "  ✅ Registry created: $ACR_LOGIN_SERVER"

# Step 3: Build and Push Docker Image
echo "3️⃣  Building and pushing Docker image..."
az acr build \
  --registry $ACR_NAME \
  --image http-haiku:latest \
  --file Dockerfile \
  . \
  --output none

echo "  ✅ Image built and pushed"

# Step 4: Create PostgreSQL Flexible Server
echo "4️⃣  Creating PostgreSQL database..."
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --output none

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME \
  --output none

DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"

echo "  ✅ Database created"

# Step 5: Generate Rails Secret Key Base
SECRET_KEY_BASE=$(openssl rand -hex 64)

# Step 6: Create App Service Plan
echo "5️⃣  Creating App Service Plan..."
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name "${APP_NAME}-plan" \
  --is-linux \
  --sku B1 \
  --output none

# Step 7: Create Web App
echo "6️⃣  Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --deployment-container-image-name "${ACR_LOGIN_SERVER}/http-haiku:latest" \
  --output none

# Configure Web App
echo "7️⃣  Configuring Web App..."

# Set container registry credentials
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name "${ACR_LOGIN_SERVER}/http-haiku:latest" \
  --docker-registry-server-url "https://${ACR_LOGIN_SERVER}" \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD \
  --output none

# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    RAILS_ENV=production \
    DATABASE_URL="$DATABASE_URL" \
    SECRET_KEY_BASE="$SECRET_KEY_BASE" \
    RAILS_SERVE_STATIC_FILES=true \
    RAILS_LOG_TO_STDOUT=true \
  --output none

echo "  ✅ Configuration complete"

# Step 8: Restart the app
echo "8️⃣  Restarting application..."
az webapp restart \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output none

# Get the app URL
APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName --output tsv)

echo ""
echo "✅ Deployment Complete!"
echo "=========================================="
echo "🌐 Application URL: https://$APP_URL"
echo "📊 Database Server: $DB_SERVER_NAME.postgres.database.azure.com"
echo "🔑 Database Admin: $DB_ADMIN_USER"
echo "🔐 Database Password: $DB_ADMIN_PASSWORD"
echo "🔑 SECRET_KEY_BASE: $SECRET_KEY_BASE"
echo ""
echo "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo "To view logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "To redeploy after changes:"
echo "  az acr build --registry $ACR_NAME --image http-haiku:latest --file Dockerfile ."
echo "  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
