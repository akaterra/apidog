# ApiDog

ApiDog is a API documentation generator alternative to the ApiDoc.

* Single html file with no external dependencies

* AMQP (via proxy.js), AMQP RPC (via proxy.js), WebSocket support

### Tokens

##### @apiContentType

Sets content type of payload.

##### @apiOption

Defines custom options.

**sampleRequestXmlRoot** - defines root namespace for params have to be send as XML.

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
 * @apiParamPrefix body
 * @apiUse sharedParams
 */

/**
 * @api {post} test2
 * @apiDescription Parameters are prefixed by "payload" - payload.a, payload.b, payload.c
 * @apiParamPrefix payload
 * @apiUse sharedParams
 */
```