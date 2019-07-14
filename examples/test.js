/**
 * @apiDefine chapter Sample chapter
 * This is a sample chapter with title and description
 */

/**
 * @apiDefine group Sample group
 * This is a sample group with title and description
 */

/**
 * @apiDefine subgroup Sample subgroup
 * This is a sample subgroup with title ans description
 */

/**
 * @apiDefine queryParameter Sample query parameter
 * This is a sample query parameter with title and description
 */

/**
 * @api {get} /test/:id?:param1 Test GET v0.0.1
 * @apiChapter chapter
 * @apiDescription Test GET v0.0.1
 * @apiGroup group
 * @apiName testGet
 * @apiSubgroup subgroup
 * @apiVersion 0.0.1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/:id?:param2 Test GET v0.0.2
 * @apiChapter chapter
 * @apiDescription Test GET v0.0.2
 * @apiGroup group
 * @apiName testGet
 * @apiSubgroup subgroup
 * @apiVersion 0.0.2
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param2=test] Query param 2
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 Test GET with no group
 * @apiChapter chapter
 * @apiSubgroup subgroup1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 Test GET with no subgroup
 * @apiChapter chapter
 * @apiGroup group1
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {get} /test/with/no/group/:id?:param1 Test GET with no group and subgroup
 * @apiChapter chapter
 * @apiParam {String} id Id
 * @apiParam (queryParameter) {String} [param1=test] Query param 1
 */

/**
 * @api {post} /test/:id Test POST
 * @apiChapter chapter1
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
