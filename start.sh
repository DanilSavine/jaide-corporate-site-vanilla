#!/bin/bash

# Contact Form Server Startup Script
echo "🚀 Starting Jaide Contact Form Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📋 Please copy env.example to .env and configure your email settings:"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "📋 Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Starting server..."
echo "🌐 Contact form will be available at: http://localhost:3000/contact-form.html"
echo "❤️  Health check available at: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
