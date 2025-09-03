# Use Node.js
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install

# Copy source
COPY . .

# Expose your server port (change if not 3000)
EXPOSE 3000

# Start app
CMD ["npm", "start"]
