# Use official lightweight Node.js Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app
# Copy package management files to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Expose the internal port (Render defaults to 10000 or reads the PORT env)
EXPOSE 5000

# Start the application server
CMD ["node", "src/server.js"]