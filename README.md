# Electronic device store apis

<img src="./src/assets/logokma.png" align="left"
width="150" hspace="10" vspace="10">

||

BE for **_Phát Triển Ứng Dụng Web_** subject. This project uses Expressjs, typescript.

**_Khóa CT6_**

||

---

## ⇁ Table of content

[prerequisites](#-prerequisites)<br>
[setup](#-setup)<br>
[list of environent variable](#-list-of-available-environment-variables)<br>
[development](#-development)<br>
[database schema](#-database-schema)<br>
[deployment (comming soon)](#-deploy)<br>

## ⇁ Prerequisites

you must have npm installed<br>
database of your choice<br>

## ⇁ Setup

you need to have `.env` file in roor folder, in the file you
need `key=value` each line.<br>

## ⇁ List of available environment variables

| Variable      | Required | Purpose                                                                      |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| PORT          | NO       | port to run project, it is set to 8000 by default                            |
| DATABASE_URL  | YES      | your choosen database url                                                    |
| AT_SECRET_KEY | YES      | use to generate, verify accesstoken                                          |
| RT_SECRET_KEY | YES      | use to generate, verify refreshtoken                                         |
| APP_DOMAIN    | YES      | full domain when this come to deployment, also need to communicate with zalo |
| ZALO_APP_ID   | YES      | defined in zalopay document, refer to <code>app_id</code>                    |
| ZALO_KEY_1    | YES      | provided by zalopay                                                          |
| ZALO_KEY_2    | YES      | provided by zalopay                                                          |
| ZALO_ENDPOINT | YES      | defined in zalopay document, refer to <code>redirecturl</code>               |
| ZALO_REDIRECT | YES      | defined in zalopay document, refer to <code>redirecturl</code>               |

For the full .env file example, check
out [this template](./templates/.env.template) <br>
For the usage of these above zalo's properties, check
out [this document](https://docs.zalopay.vn/v2/general/overview.html#tao-don-hang_thong-tin-don-hang)

## ⇁ Development

first, clone this project<br>
next, config git hooks<br>

```shell
git config core.hooksPath '.git-hooks'
```

verify right hook directory:

```shell
git rev-parse --git-path hooks
```

setup husky:

```shell
npm run prepare
```

setup prisma:

```shell
npm run db-generate
```

you can check the invalid code with this command:

```shell
npm run lint
```

you can run the development server by this command:

```shell
npm run dev
```

you can test app in production environment by running:

```shell
make build
make server
```

## ⇁ Database schema

## ⇁ Deploy
