FROM ubuntu:latest

# Install traceroute
RUN apt-get update && \
    apt-get install -y traceroute

# Install Node.js and npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install



# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=8080

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
