# Use official Node.js LTS image with Python included (some have python pre-installed)
FROM node:18-bullseye

# Install python3 and pip (yt-dlp requires python)
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip
RUN pip3 install yt-dlp

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose port (should match the one your app uses, default 3000)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
