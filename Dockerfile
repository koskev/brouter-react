FROM node:18-alpine as builder

WORKDIR /build

# Copy this first to allow for caching
COPY package.json package-lock.json ./

RUN npm install

COPY . .
RUN npm run build



FROM nginx:alpine

COPY --from=builder /build/dist /usr/share/nginx/html


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
