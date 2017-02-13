FROM nginx:alpine
COPY static /usr/share/nginx/html

# Start up nginx server
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
