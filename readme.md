![alt ApiDog](https://github.com/akaterra/apidog/blob/master/apidog.png?raw=true)

ApiDog
======

ApiDog is a API documentation generator alternative to the ApiDoc.

* Templates for:
  * Minimalistic html file with dynamic loading of template and bootstrap
  * Single pre-compiled html file with no external dependencies
  * Mark down file
* Minimalistic embedded proxy
* Sample request plugin for html template:
    * Transports support:
        * HTTP
        * HTTPS
        * AMQP (via ApiDog proxy)
        * AMQP RPC (via ApiDog proxy)
        * Nats (via ApiDog proxy)
        * WebSocket
    * Content types support:
        * Form
        * JSON
        * XML
    * Presets (saved requests)

Table of contents
-----------------

* Installation
* CLI
* Tokens
* Embedded templates

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

* **-i, --input "input directory"** - input directory to be scanned for blocks

  Current directory by default.

* **-o, --output "output directory"** - output directory where **apidoc.html** and additional files will be saved

  Same as **input directory** by default.

* **-p, --private \["tag1, tag2,.."\]** -- filters blocks having all the private tags (see **@apiPrivate**) or entirely marked as private

  By default takes all the blocks.

* **-s, --sampleRequestUrl, --sampleUrl** - base url that will be used as prefix for all relative api paths in sample requests

  Default is \[ config.json in input directory \].sampleUrl

* **--sampleRequestProxy** - url of ApiDog proxy to be used for requests

* **-t, --template** - alias of embedded template or directory where the custom template be load from

  "@html" by default.

* **--title** - custom title that will be used as title of the generated documentation

  Default is \[ package.json in input directory \].name, \[ config.json in input directory \].title or "Untitled" by default

* **-srp, --withSampleRequestProxy \["update"\]** - creates also **apidog_proxy.js**, **apidog_proxy_config.js** and **package.json** in the output directory

  If the above files already exist, they will not be rewritten. To rewrite files use ```--withSampleRequestProxy=update```.

### Tokens

##### @apiChapter

Format:
```
@apiChapter chapter
```

Defines chapter.

Can be used to split blocks between multiple namespaces.

##### @apiContentType

Format:
```
@apiContentType contentType
```

Defines content type.
Can be defined multiply.

Content type will be used as filter the **@apiExample** token having corresponding {type}.
Also the data of the sample request will be formatted according to it.
Currently supported data format of the sample request are FORM, JSON and XML.

##### @apiOption

Format:
```
@apiOption key [val=true]
```

Defines custom options for internal usage.

**sampleRequestXmlRoot** - defines root namespace for params have to be send as XML.
If data structure is a plain object and have to be sent in XML format it should be wrapped into root namespace.

##### @apiParamPrefix

Prefixes all following **@apiParam**s with prefix.

This allows also to reuse lists of **apiParams** between different blocks.

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
