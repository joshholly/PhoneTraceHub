
# PhoneTraceHub

**PhoneTraceHub** is a social engineering tool designed to get user's to share their location by generating links that, when opened on a mobile device, prompt users to grant location access. This tool uses the browser's `navigator.geolocation` API to send users' location data, which is then logged for viewing. 



## Demo

https://phonetracehub.com

## Installation

Install PhoneTraceHub with npm

```bash
  git clone https://github.com/joshholly/PhoneTraceHub.git
  cd PhoneTraceHub
  npm install
```


## Deployment

To deploy this project run

```bash
  mv .env.example .env
```

Edit the .env file with your MONGO_DB_URL, SITE_URL, and DECOY_URL. 

NOTE: If no decoy URL, simply set the DECOY_URL as your SITE_URL. 

### Running The Server
```bash
  npm run start
```
This will start it on 
`https://localhost:3000`


### OPTIONAL: Setup reverse proxy to route your domain to localhost:3000

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Replace with your domain or IP address

    location / {
        proxy_pass https://localhost:3000;   # Forward requests to your app
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```




