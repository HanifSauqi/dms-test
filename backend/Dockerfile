FROM node:20-alpine

WORKDIR /app

# Menyalin package.json dan package-lock.json
COPY package*.json ./

# Install dependensi
RUN npm install --production

# Menyalin seluruh source code
COPY . .

# Expose port yang digunakan aplikasi (sesuai .env)
EXPOSE 3001

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
