# Browser Push Message Test

1. Configure `.env`

At root: (`./.env`)

```
PRIVATE_VAPID_KEY=
PUBLIC_VAPID_KEY=
DB_CONNECTION_STRING=
```

At client (`./client/.env`)

```
API_ROOT=http://localhost:3050
```

2. Start both Server and Client:

```
cd server
yarn start
```

```
cd client
yarn start
```

## Client Usage Example
Check `client/index.html`