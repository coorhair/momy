[![Build Status][circle-image]][circle-url]
[![NPM Status][npm-image]][npm-url]
[![Codecov Status][codecov-image]][codecov-url]

*Add support MySQL JSON type, Mongo authentication, works with Mongo 4.x, MySQL 8.x*

*Add support parallel import from collections to tables*

*Add support Mysql connection pool*

*Add support selectable some collections for importing instead of import all*

## Usages:

Sync
```bash
$ momy --config momymap.json
```

Import all collection then sync
```bash
$ momy --config momymap.json --import
```

Import some collections (no space, comma separator) then sync
```bash
$ momy --config momymap.json --import collection1,collection2,collection3
```

# Installation:

Installation via npm
```bash
$ npm install -g @regang/momy
```

or yarn
```bash
$ yarn global add @regang/momy
```

upgrade momy package
```bash
$ yarn global upgrade @regang/momy --latest
```

*Origin document below!*

# Momy

[Momy](https://goo.gl/maps/s9hXxKyoACv) is a simple cli tool for replicating MongoDB to MySQL in realtime.

- Enable SQL query on data in NoSQL database
- Enable to be accessed by Excel / Access

![Momy](images/concept.png)

## Installation

Install via npm:

```bash
$ npm install -g momy
```

Or use docker:

```bash
$ docker run -it --rm -v $(pwd):/workdir cognitom/momy
```

You might want to create an alias, for example

```bash
$ echo 'alias momy="docker run -it --rm -v $(pwd):/workdir cognitom/momy"' >> ~/.bashrc
```

See more detail about Docker configurations below.

## Preparation

### MongoDB

Momy uses [Replica Set](http://docs.mongodb.org/manual/replication/) feature in MongoDB. But you don't have to replicate between MongoDB actually. Just follow the steps below.

Start a new mongo instance with no data:

```bash
$ mongod --replSet "rs0" --oplogSize 100
```

Open another terminal, and go to MongoDB Shell:

```bash
$ mongo
....
> rs.initiate()
```

`rs.initiate()` command prepare the collections that is needed for replication.

### MySQL

Launch MySQL instance, and create the new database to use. The tables will be created or updated when syncing. You'll see `mongo_to_mysql`, too. This is needed to store the information for syncing. (don't remove it)

### Configuration

Create a new `momyfile.json` file like this:

```json
{
  "src": "mongodb://localhost:27017/dbname",
  "dist": "mysql://root:password@localhost:3306/dbname",
  "prefix": "t_",
  "case": "camel",
  "collections": {
    "collection1": {
      "_id": "number",
      "createdAt": "DATETIME",
      "field1": "number",
      "field2": "string",
      "field3": "boolean",
      "field4.subfield": "string"
    },
    "collection2": {
      "_id": "string",
      "createdAt": "DATETIME",
      "field1": "number",
      "field2": "string",
      "field3": "boolean",
      "field4": "TEXT"
    }
  }
}
```

- `src`: the URL of the MongoDB server
- `dist`: the URL of the MySQL server
- `prefix`: optional prefix for table name. The name of the table would be `t_collection1` in the example above.
- `fieldCase`: optional. `snake` or `camel`. See the section below.
- `exclusions`: optional. Chars or a range of chars to exclude: `"\uFFFD"`
- `inclusions`: optional. Chars or a range of chars to include: `"\u0000-\u007F"`
- `collections`: set the collections and fields to sync

`_id` field is required for each collection and should be `string` or `number`.

### Field names and types

```
"<field_name>": "<field_tipe>"
```
or, field_name could be dot-concatenated:
```
"<field_name>.<sub_name>": "<field_tipe>"
```

For example, if you have `{ a: { b: { c: 'hey!' } } }` then `"a.b.c": "string"`

Currently these native types are supported:

- `BIGINT`
- `TINYINT`
- `VARCHAR`
- `DATE`
- `DATETIME`
- `TIME`
- `TEXT`
- `JSON`

There're also some aliases:

- `number` => `BIGINT`
- `boolean` => `TINYINT`
- `string` => `VARCHAR`
- `array` => `JSON`

### Field name normalization: fieldCase

Some system like Microsoft Access don't allow *dot-concatenated field names*, so `address.street` will cause an error. For such a case, use `fieldCase`:

- `snake`: `address.street` --> `address_street`
- `camel`: `address.street` --> `addressStreet`

**Note**: if you set `fieldCase` value, the name of `_id` field will change into `id` without `_`, too.

## Usage

At the first run, we need to import all the data from MongoDB:

```bash
$ momy --config momyfile.json --import
```

Then start the daemon to streaming data:

```bash
$ momy --config momyfile.json
```

or

```bash
$ forever momy --config momyfile.json
```

## Usage with Docker

First thing first, create a network for your containers:

```bash
$ docker network create my-net
```

Then, launch database servers:

```bash
$ docker run \
    --name my-mongod \
    --detach --rm \
    --network my-net \
    --mount type=volume,source=my-mongo-store,target=/data/db \
    mongo --replSet "rs0"
$ docker run \
    --name my-mysqld \
    --detach --rm \
    --network my-net \
    --mount type=volume,source=my-mysql-store,target=/var/lib/mysql \
    --env MYSQL_ALLOW_EMPTY_PASSWORD=yes \
    mysql
```

If this is the first time to run the containers above, you need to initialize them:

```bash
$ docker exec my-mongod mongo --eval 'rs.initiate()'
$ docker exec my-mysqld mysql -e 'CREATE DATABASE momy;'
```

Create `momyfile.json` like this:

```json
{
  "src": "mongodb://my-mongod:27017/momy",
  "dist": "mysql://root@my-mysqld:3306/momy",
  "collections": {...}
}
```

**Note**: you must change username, password, port, ...etc. to fit your environment.

OK, let's run `momy` with `--import` option:

```bash
$ docker run \
    --interactive --tty --rm \
    --network my-net \
    --mount type=bind,source=$(pwd),target=/workdir \
    cognitom/momy --import
```

Everything goes well? Then, stop the container (Ctrl + C). Now you can run it as a daemon:

```bash
$ docker run \
    --detach --rm \
    --restart unless-stopped \
    --network my-net \
    --mount type=bind,source=$(pwd),target=/workdir \
    cognitom/momy
```

## For contributors

See [dev](dev) directory.

## License

MIT

This library was originally made by @doubaokun as [MongoDB-to-MySQL](https://github.com/doubaokun/MongoDB-to-MySQL) and rewritten by @cognitom.

[circle-image]:https://img.shields.io/circleci/project/github/cognitom/momy.svg?style=flat-square
[circle-url]:https://circleci.com/gh/cognitom/momy
[npm-image]:https://img.shields.io/npm/v/momy.svg?style=flat-square
[npm-url]:https://www.npmjs.com/package/momy
[codecov-image]:https://img.shields.io/codecov/c/github/cognitom/momy.svg?style=flat-square
[codecov-url]:https://codecov.io/gh/cognitom/momy
