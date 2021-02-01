var express = require('express');
var router = express.Router();
const consumer = require('./services/consumerApi');
var mcache = require('memory-cache');

/*
 * No Persistence Cache Logic
 */

const serverHost = true;

var timeQuery = 3600; //miliseconds

/*
 * Cache logic
 */

var cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
        return
      }
      next()
    }
  }
}

/*
 * --------------------------------
 */


/*
 * Show all routes
 */
router.get('/', async (req, res, next) => {
  res.json({ routes: ['/api/users?since={number}', "/api/users/:username/details", "/api/users/:username/repos"] });
  // res.json(await consumer('http://localhost:4000/api/users?since=teste'))
});

/*
 * --------------------------------
 */



/*
 * List users of github with since and per_page
 */

router.get('/users', cache(timeQuery), async (req, res, next) => {

  //Check params

  let since = 0;
  let per_page = 20;
  if (req.query.since != undefined) {
    if (parseInt(req.query.since) >= 0) since = parseInt(req.query.since)
    else return res.status(400).send({ message: "parameter since incorrect" })
  }

  if (req.query.per_page != undefined) {
    if (parseInt(req.query.per_page) >= 0) per_page = parseInt(req.query.per_page);
    else return res.status(400).send({ message: "parameter per_page incorrect" })
  }


  let response;
  try {
    response = await consumer(`https://api.github.com/users?since=${since}&per_page=${per_page}`);
  } catch (ex) {
    console.error(ex);
    res.status(404).send({ message: 'api limite rate used and no have cache data' })
    return
  }

  res.json({
    response: response,
    nextPage: (serverHost ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since + per_page}&per_page=${per_page}` : `https://localhost:4000/api/users?since=${since + per_page}&per_page=${per_page}`),
    previousPage: ((since - per_page) >= 0 ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since - per_page}&per_page=${per_page}` : `https://localhost:4000/api/users?since=${since + per_page}&per_page=${per_page}`),
    updated_at: new Date().getTime()
  })

})

/*
 * Show details of users github
 */
router.get('/users/:username/details', cache(timeQuery), async (req, res, next) => {

  //params Check
  var username = "";
  if (req.params.username != undefined) {
    username = req.params.username
  } else return res.status(400).send({ message: 'missing params username' })


  let response;
  try {
    response = await consumer('https://api.github.com/users/' + username)
  } catch (ex) {
    console.error(ex);
    res.status(404).send({ message: 'api limite rate used and no have cache data' })
    return
  }
  return res.json({
    response: response,
    updated_at: new Date().getTime()
  })

})



/*
 * Show repositorys of users github
 */
router.get('/users/:username/repos', cache(timeQuery), async (req, res, next) => {
  var username = "";
  if (req.params.username != undefined) {
    username = req.params.username
  } else return res.status(400).send({ message: 'missing params username' })



  let response;
  try {
    response = await consumer('https://api.github.com/users/' + username + '/repos')
  } catch (ex) {
    console.log(ex)
    res.status(404).send({ message: 'api limite rate used and no have cache data' })
    return
  }

  return res.json({
    response: response,
    updated_at: new Date().getTime()
  })
})

module.exports = router;
