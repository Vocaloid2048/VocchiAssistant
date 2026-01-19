FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create db directory
RUN mkdir -p db

# Expose port (if needed, but Discord bot doesn't need to expose ports)
# EXPOSE 3000

# Run the bot
CMD ["npm", "start"]