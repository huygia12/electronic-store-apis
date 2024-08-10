# Electronic device store apis

<img src="./src/assets/logokma.png" align="left"
width="150" hspace="10" vspace="10">

||

BE for **_Phát Triển Ứng Dụng Web_** subject. This project uses Expressjs, typescript.

**_Khóa CT6_**

||

---

# Table of content

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

first, clone this project<br>
next, config git hooks<br>

```shell
git config core.hooksPath '.git-hooks'
```

verify right hook directory:

```shell
git rev-parse --git-path hooks
```

you need to have `.env` file in roor folder, in the file you
need `key=value` each line.<br>

## ⇁ List of available environment variables

| Variable      | Required | Purpose                                           |
| ------------- | -------- | ------------------------------------------------- |
| PORT          | NO       | port to run project, it is set to 8000 by default |
| DATABASE_URL  | YES      | your choosen database url                         |
| AT_SECRET_KEY | YES      | use to generate, verify accesstoken               |
| RT_SECRET_KEY | YES      | use to generate, verify refreshtoken              |

For the full .env file example, check
out [this template](./templates/.env.template)

## ⇁ Development

setup husky:

```shell
npm run prepare
```

you can run the development server by this command:

```shell
npm run dev
```

## ⇁ Database schema

## ⇁ Deploy
