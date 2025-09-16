#!/bin/bash

# Netomi API Integration - HTTPS Server Launcher
# ===============================================

set -e  # Exit on any error

echo ""
echo "====================================================="
echo "  Netomi API Integration - HTTPS Server Launcher"
echo "====================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if SSL certificates exist
if [ ! -f "certs/server.crt" ]; then
    echo "SSL certificates not found. Generating self-signed certificates..."
    node generate-ssl.js
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to generate SSL certificates"
        exit 1
    fi
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: .env file not found"
    echo "Please copy env.example to .env and configure your Netomi API settings"
    echo ""
    echo "Starting server with default configuration..."
    echo ""
fi

# Start the HTTPS server
echo "Starting HTTPS server..."
echo ""
echo "Server will be available at:"
echo "  - HTTPS: https://localhost:3443"
echo "  - HTTP:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node https-server.js

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Server failed to start"
    echo "Check the error messages above for details"
    exit 1
fi
