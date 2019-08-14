<p align="center">
  <img src="./apidog.png" alt="ApiDog">
</p>

apiDog
======

apiDog is a API documentation generator alternative to the [apiDoc](http://apidocjs.com/).

Features:

* Templates for:
  * Minimalistic html file with dynamic loading of assets
  * Single pre-compiled html file with no external dependencies
  * Mark down file
* Server-side proxy
* Send sample request plugin for html template:
    * Transports support:
        * HTTP
        * HTTPS
        * RabbitMQ (via server-side proxy)
        * RabbitMQ RPC (remote procedure call, via server-side proxy)
        * Nats (via server-side proxy)
        * WebSocket (W3C)
    * Content types support:
        * Form
        * JSON
        * XML
    * Nested typed params
    * Presets (saved requests)
    * Variables

Table of contents
-----------------

* Installation
* CLI
* Tokens
  * [@apiChapter](#apichapter)
  * [@apiContentType](#apicontenttype)
  * [@apiFamily](#apiFamily)
  * [@apiParamPrefix](#apiparamprefix)
  * [@apiSubgroup](#apisubgroup)
* Embedded templates
  * [@html (default)](#html-default)
  * [@html.standalone](#html-standalone)
  * [@md](#md)
* @html template "Send sample request" plug-in

### Installation

```sh
npm i apidog -g
```

### CLI

```sh
apidog -h
```

Parameters:

* **--description "description"** - custom description that will be used as description of the generated documentation

  Default is \[ package.json in input directory \].description or null by default.

* **-i, --input "input directory"** - input source(-es) to be scanned for doc blocks

  Can be multiple. Default is current directory.

* **-o, --output "output directory"** - output directory where **apidoc.html** and additional files will be saved

  Same as **input directory** by default.

* **--parser "dir" | "swagger"** -- parser to be used to parse doc blocks sources

  Default is "dir".

  "dir" is used to scan the source files in the provided input directory for the doc blocks.

  ```sh
  apidog --parser dir
  ```

  "swagger" is used to parse the provided swagger specification file(s) as input source.

  ```sh
  apidog --parser swagger -i ./api-v1.swagger.json -i ./api-v2.swagger.json
  ```

* **-p, --private \["tag1,tag2,.."\]** -- tags to filters doc blocks having all the private tags (see **@apiPrivate**) or entirely marked as private

  By default takes all the doc blocks.

* **-s, --sampleRequestUrl, --sampleUrl** - base url that will be used as prefix for all relative api paths in sample requests

  Default is \[ config.json in input directory \].sampleUrl

* **--sampleRequestProxy\[:http | :rabbitmq | :ws\]** - url of ApiDog proxy to be used for requests. "http", "rabbitmq" or "ws" specifier provides proxy for specified transport

* **-t, --template** - alias of embedded template or directory where the custom template be load from

  Default is "@html".

* **--title** - custom title that will be used as title of the generated documentation

  Default is \[ package.json in input directory \].name, \[ config.json in input directory \].title or "Untitled" by default

* **--withSrp, --withSampleRequestProxy \["update"\]** - creates also **apidog_proxy.js**, **apidog_proxy.config.js** and **package.json** in the output directory

  If the above files already exist, they will not be rewritten. To rewrite files use ```--withSampleRequestProxy=update```.

### Tokens

##### @apiChapter

Format:
```
@apiChapter name
```

Defines chapter.
Can be used to split doc blocks between multiple namespaces.

If **@apiDefine** declares definition with the same name also includes its title and description.

##### @apiContentType

Format:
```
@apiContentType contentType
```

Defines content type.
Can be defined multiply.

Content type will be used as a filter of the **@apiExample** content having corresponding {type}.
Also the data of the sample request will be formatted according to it.
Currently supported data format of the sample request are FORM, JSON and XML.

##### @apiFamily

Format:
```
@apiFamily unique-identifier
```

Defines unique identifier of the doc block within its chapter, group and subgroup.
It can be used to distinguish between several doc blocks with the same descriptors to show them separately or combine the different doc blocks under versioning.

Example:
```
/**
 * @api {post} /test
 * @apiVersion v1
 * @apiFamily a
 */

/**
 * @api {post} /test
 * @apiVersion v1
 * @apiFamily b
 */
```

The second one does not override the first and is shown separately.

Example:
```
/**
 * @api {post} /v1/test
 * @apiVersion v1
 * @apiFamily a
 */

/**
 * @api {post} /v2/test
 * @apiVersion v2
 * @apiFamily a
 */
```

The second one is combined with the first and is shown under version.

##### @apiOption

Format:
```
@apiOption key [val=true]
```

Defines custom options for internal usage.

**sampleRequestXmlRoot** - defines root namespace for params have to be send as XML.
If data structure is a plain object and have to be sent in XML format it should be wrapped into root namespace.

##### @apiParamPrefix

Format:
```
@apiParamPrefix prefix
```

Prefixes all following **@apiParam**s with prefix.

This allows also to reuse lists of **apiParams** between different doc blocks.

Example:

```
/**
 * @apiDefine sharedParams
 * @apiParam a
 * @apiParam b
 * @apiParam c
 */

/**
 * @api {post} test1
 * @apiDescription Parameters are prefixed by "body" - body.a, body.b, body.c
 * @apiParamPrefix body.
 * @apiUse sharedParams
 */

/**
 * @api {post} test2
 * @apiDescription Parameters are prefixed by "payload" - payload.a, payload.b, payload.c
 * @apiParamPrefix payload.
 * @apiUse sharedParams
 */
```

### @apiSubgroup

Format:
```
@apiSubgroup name
```

Defines to which subgroup the doc block belongs.
The subgroup will be shown as a sub navigation section of the menu.

### Embedded templates

##### @html (default)

```sh
apidog -t @html
```

Complies to:

* apidoc.html - main index file
* apidoc.min.js - bootstrap
* apidoc.template.min.js - handlebars template
* handlebars.min.js - handlebars bundle

##### @html.standalone

```sh
apidog -t @html.standalone
```

Compiles to standalone html file without external dependencies.

##### @md

```sh
apidog -t @md
```

Compiles to mark down file.

### Server-side proxy

The proxy can be created by providing **--withSampleRequestProxy** CLI flag:

```sh
apidog --withSampleRequestProxy=http://localhost:8088
```

Or by **apidoc.json** option "sampleRequestProxy".

### @html template "Send sample request" plug-in

"Send sample request" plug-in allows to do sample requests with arbitrary or structured data via various transports.

##### Nats and RabbitMQ
To make possible to send sample requests through the transports such as Nats and RabbitMQ the server-side proxy must be used.

**@api** token format for Nats:

```
/**
 * @api {nats} endpoint
 */
```

**@api** token format for RabbitMQ:

```
/**
 * @api {rabbitmq[:exchange]} endpoint
 */
```

**@api** token format for RabbitMQ RPC:

```
/**
 * @api {rabbitmqRpc[:exchange]} endpoint
 */
```

##### WebSocket and HTTP/HTTPS

The WebSocket and HTTP/HTTPS requests also can be sent via server-side proxy optionally.
