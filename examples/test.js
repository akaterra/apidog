/**
 * @apiDefine chapter Sample chapter
 * This is a sample chapter with a title and description
 */

/**
 * @apiDefine group Sample group
 * This is a sample group with a title and description
 */

/**
 * @apiDefine subgroup Sample subgroup
 * This is a sample subgroup with a title ans description
 */

/**
 * @apiDefine queryParameter Sample query parameter
 * This is a sample query parameter with a title and description
 */

/**
 * @apiDefine queryParameter2 Sample query parameter 2
 * This is a sample query parameter 2 with a title and description
 */

// Sample chapter

/**
 * @api {get} /test/:id?:param1 GET v0.0.1
 * @apiChapter chapter
 * @apiDescription GET v0.0.1 description
 * @apiGroup group
 * @apiName testGet
 * @apiSubgroup subgroup
 * @apiVersion 0.0.1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/:id?:param2 GET v0.0.2
 * @apiChapter chapter
 * @apiDescription GET v0.0.2 description
 * @apiGroup group
 * @apiName testGet
 * @apiSubgroup subgroup
 * @apiVersion 0.0.2
 * @apiParam {String} id Id
 * @apiParam (queryParameter2) {String} [param2=test] Query param 2
 * @apiParam (queryParameter2) {String} [param3=test] Query param 3
 * @apiParam (queryParameter2) {String} [param4=test] Query param 4
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 GET with no group
 * @apiChapter chapter
 * @apiSubgroup subgroup1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 GET with no subgroup
 * @apiChapter chapter
 * @apiGroup group1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 GET with no group and subgroup
 * @apiChapter chapter
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {post} /test/:id POST with multiple content types
 * @apiChapter chapter
 * @apiContentType form
 * @apiContentType json
 * @apiContentType xml
 * @apiGroup group1
 * @apiSubgroup subgroup1
 * @apiParam {String} id Id
 * @apiParam (bodyParameter) {String} [param1=test] Body param 1
 *
 * @apiParamExample {form} Body example:
 * param1=param1
 *
 * @apiParamExample {json} Body example:
 * {
 *   "param1": "param1"
 * }
 *
 * @apiParamExample {xml} Body example:
 * <xml><body param1="param1" /></xml>
 */

// RabbitMQ chapter

/**
 * @api {rabbitmq} publish Publish
 * @apiChapter RabbitMQ
 * @apiParam (bodyParameter) {String} [param1=test] Body param 1
 */

/**
 * @api {rabbitmqRpc} rpc RPC
 * @apiChapter RabbitMQ
 * @apiParam (bodyParameter) {String} [param1=test] Body param 1
 */

// WebSocket chapter

/**
 * @api {websocket} publish Publish
 * @apiChapter WebSocket
 * @apiParam (bodyParameter) {String} [param1=test] Body param 1
 */
