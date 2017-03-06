FROM nginx:alpine
COPY static /usr/share/nginx/html

# Custom nginx config to setup CORS headers
COPY nginx.template /etc/nginx/nginx.conf
#CMD /bin/sh -c “/etc/nginx/nginx.template > /etc/nginx/nginx.conf 

# Start up nginx server
CMD ["nginx", "-g", "daemon off;"]
