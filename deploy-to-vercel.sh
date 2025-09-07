#!/bin/bash

# Terralink Portal - Vercel Deployment Script

echo "🚀 Terralink Portal - Vercel Deployment"
echo "========================================"
echo ""

# Step 1: Check Vercel CLI
echo "Step 1: Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
else
    echo "✅ Vercel CLI installed ($(vercel --version))"
fi
echo ""

# Step 2: Login check
echo "Step 2: Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  You need to login to Vercel first"
    echo "Running: vercel login"
    echo "Choose your preferred login method (GitHub recommended)"
    vercel login
else
    echo "✅ Already logged in as: $(vercel whoami)"
fi
echo ""

# Step 3: Deploy
echo "Step 3: Starting deployment..."
echo "This will:"
echo "  - Link your project to Vercel"
echo "  - Configure build settings"
echo "  - Deploy to a preview URL"
echo ""

# Check if already linked
if [ -d ".vercel" ]; then
    echo "Project already linked to Vercel"
    echo "Deploying to preview..."
    vercel
else
    echo "First time deployment - linking project..."
    echo ""
    echo "When prompted:"
    echo "  1. Set up and deploy? → Y"
    echo "  2. Select your scope (your username)"
    echo "  3. Link to existing project? → N"
    echo "  4. Project name? → terralink-portal (or press Enter)"
    echo "  5. In which directory? → . (press Enter)"
    echo "  6. Override settings? → N"
    echo ""
    vercel
fi

echo ""
echo "========================================"
echo "📝 Next Steps:"
echo ""
echo "1. Your preview URL will be shown above"
echo "2. Go to https://vercel.com/dashboard"
echo "3. Click on your project"
echo "4. Go to Settings → Environment Variables"
echo "5. Add these variables:"
echo ""
echo "   VITE_GOOGLE_CLIENT_ID = [Your Google Client ID]"
echo "   JWT_SECRET = WxgPREAY5vPONdCrjBMvAqvsFEAqYhLXD5LJMee+Na0="
echo "   ALLOWED_DOMAINS = terralink.com.br"
echo "   ADMIN_EMAILS = admin@terralink.com.br"
echo ""
echo "6. Redeploy after adding environment variables:"
echo "   vercel --prod"
echo ""
echo "========================================"