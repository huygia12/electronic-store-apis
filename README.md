# Electronic device store apis

<img src="./src/assets/logokma.png" align="left"
width="150" hspace="10" vspace="10">

||

BE for **_Web development_** subject. This project uses Expressjs, typescript and Socket.io

**_Khóa CT6_**

||

---

## ⇁ List of environment variables

| Variable      | Required | Purpose                                                                      |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| DATABASE_URL  | YES      | your choosen database url                                                    |
| AT_SECRET_KEY | YES      | use to generate, verify accesstoken                                          |
| RT_SECRET_KEY | YES      | use to generate, verify refreshtoken                                         |
| PORT          | NO       | port to run project, it is set to 8000 by default                            |
| NODE_ENV      | NO       | environment, can take value of development or production                     |
| APP_DOMAIN    | YES      | full domain when this come to deployment, also need to communicate with zalo |
| CLIENT_DOMAIN | NO       | client domain, need to specify to pass CORS                                  |
| CLIENT_PORT   | NO       | client port, like CLIENT_DOMAIN but used to develop in local                 |
| ZALO_APP_ID   | YES      | defined in zalopay document, refer to <code>app_id</code>                    |
| ZALO_KEY_1    | YES      | provided by zalopay                                                          |
| ZALO_KEY_2    | YES      | provided by zalopay                                                          |
| ZALO_ENDPOINT | YES      | defined in zalopay document, refer to <code>redirecturl</code>               |

For the full .env file example, check
out [this template](./templates/.env.template) <br>
For the usage of these above zalo's properties, check
out [this zalopay document](https://docs.zalopay.vn/v2/general/overview.html#tao-don-hang_thong-tin-don-hang)

## ⇁ Development

first, clone this project<br>
next, config your .env file<br>
then setup prisma:

```shell
npm run db-generate
```

you can check the invalid code with this command:

```shell
npm run lint
```

you can run the development server in local by this command:

```shell
npm run dev
```

you can test app in production environment by running:

```shell
npm run build
npm run start
```

## ⇁ Database schema

<img src="./src/assets/schema.svg">

## ⇁ Deploy

```shell
make build
make server
```
