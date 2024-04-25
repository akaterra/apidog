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
  * apidoc.apidoc text file
  * Markdown file
  * OpenAPI specification file (v2.0, v3.0)
* Server proxy
* Send sample request plugin for html template:
    * Transports support:
        * HTTP/HTTPS (via Server proxy only HTTP)
        * Nats PUB/SUB (via Server proxy)
        * Nats RPC (remote procedure call, via Server proxy)
        * RabbitMQ PUB/SUB (via Server proxy)
        * RabbitMQ RPC (remote procedure call, via Server proxy)
        * Redis PUB/SUB (via Server proxy)
        * Socket.IO
        * WebSocket/WebSocket Secure (W3C) (via Server proxy only WebSocket)
    * Content types support:
        * Form
        * JSON
        * XML
    * Nested typed params
    * Type variants
    * Presets (saved requests)
    * Variables

Table of contents
-----------------

* Installation
* CLI
* Additional annotations
  * [@apiAuthHeader](#apiauthheader)
  * [@apiAuthParam](#apiauthparam)
  * [@apiAuthQuery](#apiauthquery)
  * [@apiChapter](#apichapter)
  * [@apiContentType](#apicontenttype)
  * [@apiDefine](#apidefine)
  * [@apiErrorPrefix](#apierrorprefix)
  * [@apiErrorRoot](#apierrorroot)
  * [@apiErrorValue](#apierrorvalue)
  * [@apiFamily](#apifamily)
  * [@apiHeaderValue](#apiheadervalue)
  * [@apiNote](#apinote)
  * [@apiParamPrefix](#apiparamprefix)
  * [@apiParamRoot](#apiparamroot)
  * [@apiParamValue](#apiparamvalue)
  * [@apiSchema](#apischema)
  * [@apiSampleRequestOption](#apisamplerequestoption)
  * [@apiSampleRequestVariable](#apisamplerequestvariable)
  * [@apiSubgroup](#apisubgroup)
  * [@apiSuccessPrefix](#apisuccessprefix)
  * [@apiSuccessRoot](#apisuccessroot)
  * [@apiSuccessValue](#apisuccessvalue)
  * [@apiTag](#apitag)
  * [@apiUse](#apiuse)
* Built-in templates
  * [@apidoc](#apidoc)
  * [@html (default)](#html-default)
  * [@html.standalone](#htmlstandalone)
  * [@md](#md)
  * [@openapi.2.0](#openapi20)
  * [@openapi.3.0](#openapi30)
* @html template "Send sample request" plug-in
  * [Type variants](#type-variants)
* [Sunsetting apiDoc](#sunsetting-apidoc)

### Installation

```sh
npm i @akaterra.co/apidog -g
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

* **--parser "dir" | "inline" | "openapi"** -- Parser to be used to parse the doc blocks sources

  Default is "dir".

  "dir" is used to scan the source files in the provided input directory for the doc blocks.

  ```sh
  apidog --parser dir
  ```

  "inline" is used to scan the input as lines of the doc block.

  ```sh
  apidog --parser inline -i "@api {get} /version"
  ```

  "openapi" is used to parse the provided OpenAPI specification sources.

  ```sh
  apidog --parser openapi -i ./api-v1.openapi.json -i ./api-v2.openapi.json
  ```

* **-p, --private \["tag"\]** -- Tags to filter doc blocks having all the private tags or entirely marked as private

  Can be multiple. By default takes all the doc blocks.

* **-s, --sampleRequestUrl, --sampleUrl** - Base URL that will be used as a prefix for all relative api paths (of HTTP/HTTPS and WebSocket types) in sample requests

  Default is \[ config.json in input directory \].sampleUrl

* **--sampleRequestPreset** - URL of apiDog preset backend for presets management

* **--sampleRequestProxy\[:http | :natsPub | :natsSub | :rabbitmqPub | :rabbitmqSub | :redisPub | :redisSub | :ws\]** - URL of apiDog proxy backend to be used to pass requests through it.
"http", "natsPub" (RPC also), "natsSub", "rabbitmqPub" (RPC also), "rabbitmqSub", "redisPub", "redisSub" or "websocket" specifier provides a proxy for the specified transport

* **-t, --template** - Alias of the built-in template or the directory where the custom template be load from

  Default is "@html".

  Build-in templates:
    * @apidoc
    * @asyncapi
    * @html
    * @html.standalone
    * @md
    * @openapi

* **--title** - Custom title that will be used as a title of the generated documentation

  Default is \[ package.json in input directory \].name, \[ config.json in input directory \].title or "Untitled" by default

* **--withSrp, --withSampleRequestProxy \["update"\]** - Create (not rewrites existing) also "apidog_proxy.js", "apidog_proxy.config.js" and "package.json" in the output directory

  If the above files already exist, they will not be rewritten. To rewrite files use ```--withSampleRequestProxy=update```.

### Additional annotations

##### @apiAuthHeader

Format:
```
@apiAuthHeader {authType} name description
```

Defines authorization type through header.

##### @apiAuthParam

Format:
```
@apiAuthParam {authType} name description
```

Defines authorization type through param.

##### @apiAuthQuery

Format:
```
@apiAuthQuery {authType} name description
```

Defines authorization type through query param.

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

##### @apiDefine

Format:
```
@apiDefine definition
```

Works same as well as original **@apiDefine** but supports embedded **@apiUse**.

##### @apiErrorPrefix

Format:
```
@apiErrorPrefix prefix
```

Prefixes all following **@apiError**s with prefix.

Can be combined with **@apiUse** to reuse lists of **apiError** between different doc blocks.

Example:
```
/**
 * @apiDefine sharedParams
 * @apiError a
 * @apiError b
 * @apiError c
 */

/**
 * @api {post} test1
 * @apiDescription Parameters are prefixed by "body" - body.a, body.b, body.c
 * @apiErrorPrefix body.
 * @apiUse sharedParams
 */

/**
 * @api {post} test2
 * @apiDescription Parameters are prefixed by "payload" - payload.a, payload.b, payload.c
 * @apiErrorPrefix payload.
 * @apiUse sharedParams
 */
```

Another subsequent declaration adds a prefix to the previous one.
".." returns to the previous prefix, empty value resets the prefix.

Example:
```
/**
 * @api {post} test
 * @apiErrorPrefix body.
 * @apiError {String} a As "body.a"
 * @apiErrorPrefix b.
 * @apiError {String} c As "body.b.c"
 * @apiErrorPrefix ..
 * @apiError {String} d As "body.d"
 * @apiErrorPrefix
 * @apiError {String} e As "e"
 */
```

##### @apiErrorRoot

Format:
```
@apiErrorRoot (group) {type} description
```

Defines "root" type for the error response.

Used when the response contains a primitive value, an array of primitive values or an array of **@apiError** definitions.

Example:
```
/**
 * @apiErrorRoot {Object[]} List of objects
 * @apiError a
 * @apiError b
 * @apiError c
 */
```

```
/**
 * @apiErrorRoot {String[]} List of strings
 */
```

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

Can be combined with **@apiUse** to reuse lists of **apiParam** between different doc blocks.

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
 * @apiParam {String} c As "body.b.c"
 * @apiParamPrefix ..
 * @apiParam {String} d As "body.d"
 * @apiParamPrefix
 * @apiParam {String} e As "e"
 */
```

##### @apiParamRoot

Format:
```
@apiParamRoot (group) {type} description
```

Defines "root" type for the request.

Used when the request contains a primitive value, an array of primitive values or an array of **@apiParam** definitions.

Example:
```
/**
 * @apiParamRoot {Object[]} List of objects
 * @apiParam {String} a
 * @apiParam {String} b
 * @apiParam {String} c
 */
```

```
/**
 * @apiParamRoot {String[]} List of strings
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
@apiSchema [(group)] {openapi=pathToFile#internal.path.to.api} operationNickname
```

```
@apiSchema [(group)] {openapi=pathToFile#internal.path.to.model} @apiParam
```

Uses external schema to fill doc block.

"jsonschema" also allows to use **$ref** definitions within schema.
"openapi" generates doc block by api operation or **@apiParam** list by model.

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

##### @apiSuccessPrefix

Format:
```
@apiSuccessPrefix prefix
```

Prefixes all following **@apiSuccess**s with prefix.

Can be combined with **@apiUse** to reuse lists of **apiSuccess** between different doc blocks.

Example:
```
/**
 * @apiDefine sharedParams
 * @apiSuccess a
 * @apiSuccess b
 * @apiSuccess c
 */

/**
 * @api {post} test1
 * @apiDescription Parameters are prefixed by "body" - body.a, body.b, body.c
 * @apiSuccessPrefix body.
 * @apiUse sharedParams
 */

/**
 * @api {post} test2
 * @apiDescription Parameters are prefixed by "payload" - payload.a, payload.b, payload.c
 * @apiSuccessPrefix payload.
 * @apiUse sharedParams
 */
```

Another subsequent declaration adds a prefix to the previous one.
".." returns to the previous prefix, empty value resets the prefix.

Example:
```
/**
 * @api {post} test
 * @apiSuccessPrefix body.
 * @apiSuccess {String} a As "body.a"
 * @apiSuccessPrefix b.
 * @apiSuccess {String} c As "body.b.c"
 * @apiSuccessPrefix ..
 * @apiSuccess {String} d As "body.d"
 * @apiSuccessPrefix
 * @apiSuccess {String} e As "e"
 */
```

##### @apiSuccessRoot

Format:
```
@apiSuccessRoot (group) {type} description
```

Defines "root" type for the success response.

Used when the response contains a primitive value, an array of primitive values or an array of **@apiSuccess** definitions.

Example:
```
/**
 * @apiSuccessRoot {Object[]} List of objects
 * @apiSuccess a
 * @apiSuccess b
 * @apiSuccess c
 */
```

```
/**
 * @apiSuccessRoot {String[]} List of strings
 */
```

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

##### @apiUse

Format:
```
@apiUse definition
```

Works same as well as original **@apiUse** but can be used multiply.


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
* favicon.png
* handlebars.min.js - Handlebars bundle
* socket.io.js - Socket.IO bundle

Supports nav jumping to a chapter, group, subgroup and block version.
Supports locale selection (en, he, ru) via "locale=..." query string param.
Supports version selection via "version=..." query string param.

##### @html.standalone

```sh
apidog -t @html.standalone
```

Compiles to standalone html file without external dependencies.

Supports nav jumping to a chapter, group, subgroup and block version.
Supports locale selection (en, he, ru) via "locale=..." query string param.
Supports version selection via "version=..." query string param.

##### @md

```sh
apidog -t @md
```

Compiles to markdown file.

##### @openapi.2.0

```sh
apidog -t @openapi.2.0
```

Compiles to OpenAPI v2.0 specification JSON file.

##### @openapi.3.0

```sh
apidog -t @openapi.3.0
```

Compiles to OpenAPI v3.0 specification JSON file.

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

##### Type variants

"Send sample request" plug-in allows to define multiple type variants for the specified field.
This can be useful when some part of the request data structure should be various.

Example:
```
@apiParam {Type1} field
@apiParam {Number} field.a
@apiParam {Type2} field
@apiParam {String} field.b
```

Now the "field" will have two options of type to select:
  * First with the subfield "a" with type "Number"
  * Second with the subfield "b" with type "String"

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

**@api** annotation format for Nats SUB:

```
/**
 * @api {natsSub} endpoint
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

**@api** annotation format for RabbitMQ SUB:

```
/**
 * @api {rabbitmqSub[:exchange]} endpoint
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

**@api** annotation format for Socket.IO:

```
/**
 * @api {socketio} endpoint
 */
```

**@api** annotation format for WebSocket:

```
/**
 * @api {webSocket} endpoint
 */
```

##### WebSocket and HTTP/HTTPS

The WebSocket and HTTP/HTTPS requests also can be sent via Server proxy optionally.

##### Sunsetting apiDoc

Despite the [discussion](https://github.com/apidoc/apidoc/issues/1436) about ending support for apiDoc mainly due to the more popular OpenAPI standard, I still believe that using apiDoc nevertheless makes sense because:
  1. Finally no one forces to keep apiDoc annotations directly in the code - they may well be in a separate text file.
  2. These annotations can be easily converted into a OpenAPI spec at any time and vice versa.
  3. In my humble opinion, the OpenAPI specification is not entirely human-friendly (although no doubt it is more strict than apiDoc), reading it can be quite difficult due to the specific format, while the apiDoc is much simpler for most cases.
