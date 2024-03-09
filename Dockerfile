FROM node:20-alpine as builder

WORKDIR /build

# Copy this first to allow for caching
COPY package.json yarn.lock ./

RUN yarn install

COPY . .
RUN yarn build



FROM nginx:alpine

COPY --from=builder /build/dist /usr/share/nginx/html


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
