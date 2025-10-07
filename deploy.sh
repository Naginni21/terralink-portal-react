#!/bin/bash

# Deployment Script for TerraLink Portal
# Backend: Render (Git-based)
# Frontend: Vercel (CLI)

set -e

echo "🚀 TerraLink Portal Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${RED}⚠️  Warning: Not on main branch (current: $BRANCH)${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to deploy backend to Render
deploy_backend() {
    echo -e "\n${BLUE}📦 Backend Deployment (Render)${NC}"
    echo "--------------------------------"
    echo "Render uses Git-based deployment."
    echo ""
    echo "To deploy backend:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New+' → 'Blueprint'"
    echo "3. Connect your GitHub repo: Naginni21/terralink-portal-react"
    echo "4. Render will detect render.yaml automatically"
    echo "5. Add these environment variables:"
    echo "   - GOOGLE_CLIENT_ID"
    echo "   - GOOGLE_CLIENT_SECRET"
    echo "   - COOKIE_DOMAIN (leave empty for .onrender.com)"
    echo ""
    echo "Or if already deployed, just push to main:"
    git push origin main
    echo -e "${GREEN}✅ Code pushed to GitHub. Render will auto-deploy.${NC}"
}

# Function to deploy frontend to Vercel
deploy_frontend() {
    echo -e "\n${BLUE}📦 Frontend Deployment (Vercel)${NC}"
    echo "--------------------------------"

    # Check if vercel is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not installed${NC}"
        echo "Install with: npm i -g vercel"
        exit 1
    fi

    # Deploy with Vercel
    echo "Deploying to Vercel..."
    vercel --prod

    echo -e "${GREEN}✅ Frontend deployed to Vercel${NC}"
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}📊 Deployment Status${NC}"
    echo "----------------------"
    echo ""
    echo "Backend (Render):"
    echo "  Check status at: https://dashboard.render.com"
    echo ""
    echo "Frontend (Vercel):"
    vercel ls 2>/dev/null | head -5 || echo "  Run 'vercel ls' to see deployments"
}

# Main menu
echo ""
echo "What would you like to deploy?"
echo "1) Backend only (Render)"
echo "2) Frontend only (Vercel)"
echo "3) Both"
echo "4) Show deployment status"
echo "5) Exit"
echo ""
read -p "Select option (1-5): " option

case $option in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        deploy_frontend
        ;;
    4)
        show_status
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update Google OAuth redirect URLs"
echo "2. Set environment variables in both platforms"
echo "3. Test the deployment"