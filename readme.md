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
  * AsyncAPI specification file (v3.0)
  * OpenAPI specification file (v3.0)
* Server proxy
* Extended typing and type variants
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
  * [@apiDescription](#apidescription)
  * [@apiErrorPrefix](#apierrorprefix)
  * [@apiErrorRoot](#apierrorroot)
  * [@apiErrorValue](#apierrorvalue)
  * [@apiFamily](#apifamily)
  * [@apiHeaderValue](#apiheadervalue)
  * [@apiNote](#apinote)
  * [@apiParam](#apiparam)
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
  * [@asyncapi](#asyncapi)
  * [@html (default)](#html-default)
  * [@html.standalone](#htmlstandalone)
  * [@md](#md)
  * [@openapi](#openapi)
* [Extended typing and type variants](#extended-typing-and-type-variants)
* @html template "Send sample request" plug-in
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

* **--compressionLevel** - Generalize the fields declared with **@apiParam**, **@apiError** and **@apiSuccess** aggregating them into separate schemas (`components.schemas` section of OpenAPI spec for example), bigger value means bigger depth of traverse

  0 means "no compression", default is 1.

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

```
@apiAuthHeader {authType} name description
```

Defines authorization type through header.

##### @apiAuthParam

```
@apiAuthParam {authType} name description
```

Defines authorization type through param.

##### @apiAuthQuery

```
@apiAuthQuery {authType} name description
```

Defines authorization type through query param.

##### @apiChapter

```
@apiChapter name
```

Defines chapter.
Can be used to split doc blocks between multiple namespaces.

* @html template shows the chapter on a separate page.
* @openapi, @asyncapi use only first chapter or allow to generate multiple schema files.

If **@apiDefine** declares definition with the same name also includes its title and description.

##### @apiContentType

```
@apiContentType contentType
```

Defines content type.
Can be defined multiply.

Content type will be used as a filter of the **@apiExample** content having corresponding `{contentType}`.
Also the data of the sample request will be formatted according to it.
Currently supported data format of the sample request are FORM, JSON and XML.

##### @apiDefine

```
@apiDefine definition
```

Works same as well as original **@apiDefine** but supports embedded **@apiUse**.

##### @apiDescription

```
@apiDescription description
```

Works same as well as original **@apiDescription** but treats the description content as Markdown for @html template.

##### @apiErrorPrefix

```
@apiErrorPrefix [(group)] prefix
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
To update only group use `@apiErrorPrefix (group)` syntax.

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

```
@apiErrorValue [{type}] value [description]
```

Describes custom error value.

##### @apiHeaderValue

```
@apiHeaderValue [{type}] value [description]
```

Describes custom header value.

##### @apiFamily

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

```
@apiNote title
```

Adds note section that describes some additional information. Similar to **@api**.

Can be used with **@apiDescription**.

##### @apiParam

Works same as well as original **@apiParam** but in case of **@apiQuery** presented in the same group the **@apiParam** will define only body parameters.
For query or path parameters **@apiQuery** usage is expected.

##### @apiParamPrefix

```
@apiParamPrefix [(group)] prefix
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
To update only group use `@apiParamPrefix (group)` syntax.

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

```
@apiParamValue [{type}] value [description]
```

Describes custom parameter value.

##### @apiSchema

```
@apiSchema [(group)] {jsonschema=pathToFile[#internal.path]} @apiParam
```

```
@apiSchema [(group)] {openapi=pathToFile#internal.path.to.api} operationNickname
```

Uses external schema to fill the doc block.

"jsonschema" allows to use **$ref** definitions within schema.

##### @apiSampleRequestOption

```
@apiSampleRequestOption key [val=true]
```

Defines custom options for the internal usage of the "Send sample request" plug-in.

**xmlRoot** - defines root namespace for params have to be send as XML.
If data structure is a plain object and have to be sent in XML format it should be wrapped into root namespace.

##### @apiSampleRequestVariable

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

```
@apiSubgroup name
```

Defines to which subgroup the doc block belongs.

* @html template shows it as a sub navigation section of the menu.

##### @apiSuccessPrefix

```
@apiSuccessPrefix [(group)] prefix
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
To update only group use `@apiSuccessPrefix (group)` syntax.

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

```
@apiSuccessValue [{type}] value [description]
```

Describes custom success value.

##### @apiTag

```
@apiTag tag1,tag2,tag3
```

Defines tags. Can be multiple.

##### @apiUse

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

##### @asyncapi

```sh
apidog -t @asyncapi
```

Compiles to AsyncAPI v3.0 specification JSON file.

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
* showdown.min.js - Showdown bundle
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

##### @openapi

```sh
apidog -t @openapi
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

### Extended typing and type variants

* Nullable type.

  ```
  @apiParam {String:Null} string
  ```

* Array definition.

  ```
  @apiParam {String[]} strings
  ```

* Nested arrays contraints.

  ```
  @apiParam {String{1..5}[]{1-2}[]{-7}} strings Arrays with dimensions [1-2 items][0-7 items]string[1-5 chars]
  ```

* Type variants.
  This can be useful when the type of the field should be various.

  ```
  @apiParam {Type1} field
  @apiParam {Number} field.a
  @apiParam {Type2} field
  @apiParam {String} field.b
  ```

  Now the "field" will have two options:
    * First with the subfield "a" with type "Number"
    * Second with the subfield "b" with type "String"

  * @html template "Send sample request" plug-in shows them as two options to select.
  * @openapi, @asyncapi templates generate "$oneOf" definition.

* apiDoc types to @openapi, @asyncapi jsonschema types mapping.

  * Boolean - { "type": "boolean" }
  * Date - { "type": "date" }
  * DateTime - { "type": "date-time" }
  * Double - { "type": "number", "format": "double" }
  * Email - { "type": "email" }
  * File - { "type": "string", "format": "binary" }
  * Hostname - { "type": "hostname" }
  * ID - { "type": "integer", "minimum": 0 }
  * Integer - { "type": "integer" }
  * Int32 - { "type": "integer", "format": "int32" }
  * Int64 - { "type": "integer", "format": "int64" }
  * IPv4 - { "type": "ipv4" }
  * IPv6 - { "type": "ipv6" }
  * Longitude - { "type": "number", "minimum": -180, "maximum": 180 }
  * Latitude - { "type": "number", "minimum": -90, "maximum": 90 }
  * Natural - { "type": "integer", "minimum": 1 }
  * Negative - { "type": "number", "exclusiveMaximum": 0 }
  * NegativeInteger - { "type": "integer", "exclusiveMaximum": 0 }
  * Number - { "type": "number" }
  * Positive - { "type": "number", "minimum": 0 }
  * PositiveInteger - { "type": "integer", "minimum": 0 }
  * Password - { "type": "string", "format": "password" }
  * String - { "type": "string" }
  * Time - { "type": "time" }
  * URI - { "type": "uri" }
  * UUID - { "type": "uuid" }

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
