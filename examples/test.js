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
 * @api {get} /v1/test/:id?:param1 GET v1
 * @apiChapter chapter
 * @apiDescription GET v1 description
 * @apiGroup group
 * @apiKind testGet
 * @apiSubgroup subgroup
 * @apiVersion v1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /v2/test/:id?:param2 GET v2
 * @apiChapter chapter
 * @apiDescription GET v2 description
 * @apiGroup group
 * @apiKind testGet
 * @apiSubgroup subgroup
 * @apiVersion v2
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
 * @api {get} /test/with/no/subgroup/:id?:param1 GET with no subgroup
 * @apiChapter chapter
 * @apiGroup group1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/no/group/subgroup/:id?:param1 GET with no group and subgroup
 * @apiChapter chapter
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/name/:id?:param1 GET with name
 * @apiChapter chapter
 * @apiName GET_WITH_NAME
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
 * <xml>
 *   <body param1="param1" />
 * </xml>
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
