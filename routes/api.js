var express = require('express');
var router = express.Router();
const consumer = require('./services/consumerApi');

/*
 * No Persistence Cache Logic
 */
var timeQuery = 3600000; //miliseconds
var cacheData = {
  "cached": [
  ]
}
var cache = (req, res, data) => {
  console.log(req.originalUrl)


  const have = cacheData.cached.map((elem, i) => {
    if (elem.url == req.originalUrl) return i
  })[0]

  // verify if exists
  if (have != undefined) {

    //if exists verify timestamp
    if (Date.now() > cacheData.cached[0].timestamp + timeQuery) {
      //else new request save data
      console.log("Invalid timestamp")

      return { valid: 'no', position: have }
    } else {
      //if is ok ,return
      return { valid: 'yes', position: have }
    }
    // if not exists
    //new request save data
  }
  cacheData.cached.push(
    {
      "url": req.originalUrl,
      "data": "",
      "timestamp": Date.now()
    }
  )
  return { valid: 'no', position: (cacheData.cached.length - 1) }

}

/*
 * End No Persistence Cache Logic
 */


/*
 * Show all routes
 */
router.get('/', async (req, res, next) => {
  res.json({ routes: ['/api/users?since={number}', "/api/users/:username/details", "/api/users/:username/repos"] });
  // res.json(await consumer('http://localhost:4000/api/users?since=teste'))
});

/*
 * Return all Cached links and Datas
 */
router.get('/cached', (req, res, next) => {
  res.json(cacheData);
})


/*
 * List users of github with since and per_page
 */

router.get('/users', async (req, res, next) => {
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



  var statusCache = await cache(req, res);
  if (statusCache.valid == "yes") {
    res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
  }
  else {
    try {
      let response = await consumer(`https://api.github.com/users?since=${since}&per_page=${per_page}`);
      cacheData.cached[statusCache.position].data = response
      cacheData.cached[statusCache.position].timestamp = Date.now()
      res.json({ response: cacheData.cached[statusCache.position].data, next: `https://api.github.com/users?since=${since + per_page}&per_page=${per_page}`, updated_at: cacheData.cached[statusCache.position].timestamp })
    } catch (ex) {
      console.error(ex)
      res.status(404).send({ message: 'api limite rate used' })
    }
  }
})

/*
 * Show details of users github
 */
router.get('/users/:username/details', async (req, res, next) => {
  const params = req.params;
  if (params.username) {

    var statusCache = await cache(req, res);
    if (statusCache.valid == "yes") {
      return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
    }
    else {
      try {
        let response = await consumer('https://api.github.com/users/' + params.username)
        cacheData.cached[statusCache.position].data = response
        cacheData.cached[statusCache.position].timestamp = Date.now()
        return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
      } catch (ex) {
        console.error(ex)
        res.status(404).send({ message: 'api limite rate used' })
      }

    }
  }
  return res.status(400).send({ message: 'missing params username' })
})



/*
 * Show repositorys of users github
 */
router.get('/users/:username/repos', async (req, res, next) => {
  const params = req.params;
  if (params.username) {

    var statusCache = await cache(req, res);
    if (statusCache.valid == "yes") {
      return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
    }
    else {
      try {
        let response = await consumer('https://api.github.com/users/' + params.username + '/repos')
        cacheData.cached[statusCache.position].data = response
        cacheData.cached[statusCache.position].timestamp = Date.now()
        return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
      } catch (ex) {
        console.error(ex)
        res.status(404).send({ message: 'api limite rate used' })
      }
    }
  }
  return res.status(400).send({ message: 'Missing Params username' })
})

module.exports = router;
