<p align="center">
  <img src="./apidog.png" alt="ApiDog">
</p>

apiDog
======

[![Build Status](https://travis-ci.org/akaterra/apidog.svg?branch=master)](https://travis-ci.org/akaterra/apidog)

apiDog is a API documentation generator alternative to the [apiDoc](http://apidocjs.com/).

Features:

* Templates for:
  * Minimalistic HTML file with dynamic assets loading
  * Single pre-compiled HTML file with no external dependencies
  * Markdown file
  * Swagger specification file (v2.0, v3.0)
* Server proxy
* Send sample request plugin for html template:
    * Transports support:
        * HTTP/HTTPS
        * Nats (via Server proxy)
        * Nats RPC (remote procedure call, via Server proxy)
        * RabbitMQ (via Server proxy)
        * RabbitMQ RPC (remote procedure call, via Server proxy)
        * Redis PUB/SUB (via Server proxy)
        * WebSocket/WebSocket Secure (W3C)
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
* Additional annotations
  * [@apiChapter](#apichapter)
  * [@apiContentType](#apicontenttype)
  * [@apiErrorValue](#apierrorvalue)
  * [@apiFamily](#apifamily)
  * [@apiHeaderValue](#apiheadervalue)
  * [@apiNote](#apinote)
  * [@apiParamPrefix](#apiparamprefix)
  * [@apiParamValue](#apiparamvalue)
  * [@apiSchema](#apischema)
  * [@apiSampleRequestOption](#apisamplerequestoption)
  * [@apiSampleRequestVariable](#apisamplerequestvariable)
  * [@apiSubgroup](#apisubgroup)
  * [@apiSuccessValue](#apisuccessvalue)
  * [@apiTag](#apitag)
* Built-in templates
  * [@apidoc](#apidoc)
  * [@html (default)](#html-default)
  * [@html.standalone](#htmlstandalone)
  * [@md](#md)
  * [@swagger.2.0](#swagger20)
  * [@swagger.3.0](#swagger30)
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

* **--description "description"** - Custom description that will be used as a description of the generated documentation

  Default is \[ package.json in input directory \].description or null by default.

* **-i, --input "input directory"** - Input source(-s) to be scanned for doc blocks

  Can be multiple. Default is current directory.

* **--jsonschema "source"** - JSON Schema source(-s) to be loaded for resolving the external references

  Can be multiple.

  ```sh
  apidog -i '@apiSchema {jsonschema=./schemas/my-schema.json#definitions.create} @apiParam' -o my-api/ --parser inline --jsonschema ./schemas/schema1.json --jsonschema ./schemas/schema2.json
  ```

* **--ordered** - Process titles as ordered titles

  Order index must be in format of "1.2.3." and must start the title.
  Titles will be sorted numerically by order index, then the order index will be removed.

* **-o, --output "output directory"** - Output directory where "apidoc.html" and additional files will be written

  Same as **input directory** by default.

* **--parser "dir" | "inline" | "swagger"** -- Parser to be used to parse the doc blocks sources

  Default is "dir".

  "dir" is used to scan the source files in the provided input directory for the doc blocks.

  ```sh
  apidog --parser dir
  ```

  "inline" is used to scan the input as lines of the doc block.

  ```sh
  apidog --parser inline -i "@api {get} /version"
  ```

  "swagger" is used to parse the provided Swagger specification sources.

  ```sh
  apidog --parser swagger -i ./api-v1.swagger.json -i ./api-v2.swagger.json
  ```

* **-p, --private \["tag"\]** -- Tags to filter doc blocks having all the private tags or entirely marked as private

  Can be multiple. By default takes all the doc blocks.

* **-s, --sampleRequestUrl, --sampleUrl** - Base URL that will be used as a prefix for all relative api paths (of HTTP/HTTPS and WebSocket types) in sample requests

  Default is \[ config.json in input directory \].sampleUrl

* **--sampleRequestProxy\[:http | :nats | :rabbitmq | :redisPub | :redisSub | :ws\]** - URL of apiDog proxy to be used to pass requests through it. "http", "nats", "rabbitmq", "redisPub", "redisSub" or "websocket" specifier provides a proxy for the specified transport

* **-t, --template** - Alias of the built-in template or the directory where the custom template be load from

  Default is "@html".

  Build-in templates:
    * @apidoc
    * @html
    * @html.standalone
    * @md
    * @swagger.2.0
    * @swagger.3.0

* **--title** - Custom title that will be used as a title of the generated documentation

  Default is \[ package.json in input directory \].name, \[ config.json in input directory \].title or "Untitled" by default

* **--withSrp, --withSampleRequestProxy \["update"\]** - Create (not rewrites existing) also "apidog_proxy.js", "apidog_proxy.config.js" and "package.json" in the output directory

  If the above files already exist, they will not be rewritten. To rewrite files use ```--withSampleRequestProxy=update```.

### Additional annotations

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

##### @apiErrorValue

Format:
```
@apiErrorValue [{type}] value [description]
```

Describes custom error value.

##### @apiHeaderValue

Format:
```
@apiHeaderValue [{type}] value [description]
```

Describes custom header value.

##### @apiFamily

Format:
```
@apiFamily uniqueIdentifier
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

##### @apiNote

Format:
```
@apiNote title
```

Adds note section that describes some additional information.

Can be used with **@apiDescription**.

##### @apiParamPrefix

Format:
```
@apiParamPrefix prefix
```

Prefixes all following **@apiParam**s with prefix.

Allows to reuse lists of **apiParams** between different doc blocks.

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

Another subsequent declaration adds a prefix to the previous one.
".." returns to the previous prefix, empty value resets the prefix.

Example:
```
/**
 * @api {post} test
 * @apiParamPrefix body.
 * @apiParam {String} a As "body.a"
 * @apiParamPrefix b.
 * @apiParam {String} c As "body.a.b.c"
 * @apiParamPrefix ..
 * @apiParam {String} d As "body.d"
 * @apiParamPrefix
 * @apiParam {String} e As "e"
 */
```

##### @apiParamValue

Format:
```
@apiParamValue [{type}] value [description]
```

Describes custom parameter value.

##### @apiSchema

Format:
```
@apiSchema [(group)] {jsonschema=pathToFile[#internal.path]} @apiParam
```

```
@apiSchema [(group)] {swagger=pathToFile#internal.path.to.api} operationNickname
```

```
@apiSchema [(group)] {swagger=pathToFile#internal.path.to.model} @apiParam
```

Uses external schema to fill doc block.

"jsonschema" also allows to use **$ref** definitions within schema.
"swagger" generates doc block by api operation or **@apiParam** list by model.

##### @apiSampleRequestOption

Format:
```
@apiSampleRequestOption key [val=true]
```

Defines custom options for the internal usage of the "Send sample request" plug-in.

**xmlRoot** - defines root namespace for params have to be send as XML.
If data structure is a plain object and have to be sent in XML format it should be wrapped into root namespace.

##### @apiSampleRequestVariable

Format:
```
@apiSampleRequestVariable [(namespace)] [{responsePath}] field[=defaultValue]
```

Defines variable of the "Send sample request" plug-in that can be used globally via placeholders in the **@apiHeader** or **@apiParam** values.

* **namespace** - name of the global bucket in which the variable value is stored
* **responsePath** - path inside the response data to the variable value, this value will be assigned to the variable automatically after the response
* **field** - variable name

Example:
```
/**
 * @api {post} /login
 * @apiSampleRequestVariable {data.accessToken} accessToken
 */

/**
 * @api {get} /goods
 * @apiHeader {String} Authorization="Bearer @accessToken"
 */
```

Example with global bucket:
```
/**
 * @api {post} /login
 * @apiSampleRequestVariable (accessBucket) {data.accessToken} accessToken
 */

/**
 * @api {get} /goods
 * @apiHeader {String} Authorization="Bearer @accessBucket:accessToken"
 */
```

##### @apiSubgroup

Format:
```
@apiSubgroup name
```

Defines to which subgroup the doc block belongs.
The subgroup will be shown as a sub navigation section of the menu.

##### @apiSuccessValue

Format:
```
@apiSuccessValue [{type}] value [description]
```

Describes custom success value.

##### @apiTag

Format:
```
@apiTag tag1,tag2,tag3
```

Defines tags. Can be multiple.

### Built-in templates

##### @apidoc

```sh
apidog -t @apidoc
```

Compiles to apiDoc annotations text file where the doc blocks separated by two "\n".

##### @html (default)

```sh
apidog -t @html
```

Complies to:

* apidoc.html - main index file
* apidoc.data.min.js - API data
* apidoc.i18n.min.js - I18N translations
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

Compiles to markdown file.

##### @swagger.2.0

```sh
apidog -t @swagger.2.0
```

Compiles to Swagger v2.0 specification JSON file.

##### @swagger.3.0

```sh
apidog -t @swagger.3.0
```

Compiles to Swagger v3.0 specification JSON file.

### Server proxy

The proxy can be created by providing **--withSampleRequestProxy** CLI flag:

```sh
apidog --withSampleRequestProxy
```

After which the following files will be copied to the output directory:

* **apidog_proxy.js** - start script file
* **apidog_proxy.config.js** - configuration file
* **package.json**

Configuration file is a js script that by default exports the object with next parameters:

* **allowPresets** - enables presets support for the built-in HTML template particularly
* **presetsDir** - directory where the presets are located
* **publicDir** - directory from which the HTML template files will be served
* **http** - HTTP/HTTPS configuration section:
  * **allow** - allowes proxing HTTP/HTTPS requests, also allows running of HTTP/HTTPS proxy
  * **allowHeaders** - list of allowed headers
  * **proxyPort** - the port that the HTTP/HTTPS proxy is listening on

* **nats** - Nats configuration section:
  * **allow** - allowes proxing Nats requests, depends on **http** section
  * **[connection alias]** - connection URI or settings to be used if its alias is passed

    Example:

    ```js
    module.exports = {
      nats: {
        connectionA: "nats://username:password@ip:4222",
      },
    }
    ```

    URI passed to the proxy:

    ```
    nats://connectionA/queue
    ```

* **rabbitmq** - RabbitMQ configuration section:
  * **allow** - allowes proxing RabbitMQ requests, depends on **http** section
  * **allowHeaders** - list of allowed headers
  * **drivers** - the drivers to be used for custom operations:
    * **rpc** - RPC (Remote Procedure Call) driver, "amqplibRpc" is only supported
  * **[connection alias]** - connection URI or settings to be used if its alias is passed

    Example:

    ```js
    module.exports = {
      rabbitmq: {
        connectionA: "amqp://username:password@ip:5672/virtualHost",
      },
    }
    ```

    URI passed to the proxy:

    ```
    amqp://connectionA/queue
    ```

* **redis** - Redis configuration section:
  * **allow** - allowes proxing Radis requests
  * **[connection alias]** - connection URI or settings to be used if its alias is passed

    Example:

    ```js
    module.exports = {
      redis: {
        connectionA: "redis://ip:6379",
      },
    }
    ```

    URI passed to the proxy:

    ```
    redis://connectionA/queue
    ```

* **websocket** - WebSocket configuration section:
  * **allow** - allowes proxing WebSocket requests, also allows running of WebSocket proxy
  * **proxyPort** - the port that the WebSocket proxy is listening on
  * **[connection alias]** - connection URI or settings to be used if its alias is passed

    Example:

    ```js
    module.exports = {
      websocket: {
        connectionA: "ws://ip:9999",
      },
    }
    ```

    URI passed to the proxy:

    ```
    ws://connectionA/queue
    ```

### @html template "Send sample request" plug-in

"Send sample request" plug-in allows to do sample requests with arbitrary or structured data via various transports.

##### Nats, RabbitMQ, and Redis
To send sample requests through the transports such as Nats, RabbitMQ, and Redis use the Server proxy.

**@api** annotation format for Nats PUB:

```
/**
 * @api {natsPub} endpoint
 */
```

**@api** annotation format for Nats RPC:

```
/**
 * @api {natsRpc} endpoint
 */
```

**@api** annotation format for RabbitMQ PUB:

```
/**
 * @api {rabbitmqPub[:exchange]} endpoint
 */
```

**@api** annotation format for RabbitMQ RPC:

```
/**
 * @api {rabbitmqRpc[:exchange]} endpoint
 */
```

**@api** annotation format for Redis PUB:

```
/**
 * @api {redisPub} endpoint
 */
```

**@api** annotation format for Redis SUB:

```
/**
 * @api {redisSub} endpoint
 */
```

##### WebSocket and HTTP/HTTPS

The WebSocket and HTTP/HTTPS requests also can be sent via Server proxy optionally.
