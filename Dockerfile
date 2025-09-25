# syntax=docker/dockerfile:1

# 1단계: React 앱 빌드
FROM node:20-alpine AS build
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 소스 복사
COPY . .

# VITE_API_BASE_URL을 빌드타임에 주입
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# 2단계: Nginx로 정적 파일 서빙
FROM nginx:1.27-alpine

# Nginx 기본 설정 교체 (필요 시 수정)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
