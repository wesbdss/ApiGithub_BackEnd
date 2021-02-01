var express = require('express');
var router = express.Router();
const consumer = require('./services/consumerApi');

/*
 * No Persistence Cache Logic
 */

const serverHost = true;

var timeQuery = 3600000; //miliseconds
var cacheData = {
  "cached": [
  ]
}


const cache = (req, res, data) => {

  let positions = cacheData.cached.map((elem, i) => {
    if (elem.url == req.originalUrl) return i
  })

  const have = positions[0]
  //remove duplicates
  if (positions.length > 1) {
    //remove first
    delete positions[0]
    //delete all duplicates
    for (x in positions) delete cacheData.cached[x]

  }

  // verify if exists
  if (have != undefined) {

    //if exists verify timestamp
    console.log(req.originalUrl + ": Falta " + ((cacheData.cached[have].timestamp + timeQuery) - new Date().getTime()) + " para expirar")
    if (new Date().getTime() > cacheData.cached[have].timestamp + timeQuery) {
      //else new request save data


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
      "data": null,
      "timestamp": new Date().getTime()
    }
  )
  return { valid: 'no', position: (cacheData.cached.length - 1) }
}

//check duplicates
setInterval(() => {
  var have = cacheData.cached.map((elem, i) => {
    if (elem.url == req.originalUrl) return i
  })
  if (have.length > 1) {
    //remove first
    delete have[0]
    //delete all duplicates
    for (x in have) delete cacheData.cached[x]

  }
}, 600000)

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
 * Return all Cached links and Datas
 */

router.get('/cached', (req, res, next) => {
  res.json(cacheData);
})

/*
 * --------------------------------
 */



/*
 * List users of github with since and per_page
 */

router.get('/users', async (req, res, next) => {

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

  //system cache

  var statusCache = await cache(req, res);
  if (statusCache.valid == "yes") {
    res.json({
      response: cacheData.cached[statusCache.position].data,
      updated_at: cacheData.cached[statusCache.position].timestamp,
      nextPage: (serverHost ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since + per_page}&per_page=${per_page}` : null),
      previousPage: ((since - per_page) >= 0 ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since - per_page}&per_page=${per_page}` : null)
    })
  } else {
    let response = null;
    try { response = await consumer(`https://api.github.com/users?since=${since}&per_page=${per_page}`); } catch (ex) { console.error(ex) }

    if (response) { //if have response, refresh
      cacheData.cached[statusCache.position].data = response
      cacheData.cached[statusCache.position].timestamp = new Date().getTime()
      res.json({
        response: cacheData.cached[statusCache.position].data,
        nextPage: (serverHost ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since + per_page}&per_page=${per_page}` : null),
        previousPage: ((since - per_page) >= 0 ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since - per_page}&per_page=${per_page}` : null),
        updated_at: cacheData.cached[statusCache.position].timestamp
      })
    } else { //if not have response, send last refresh
      if (cacheData.cached[statusCache.position].data)
        res.json({
          response: cacheData.cached[statusCache.position].data,
          updated_at: cacheData.cached[statusCache.position].timestamp,
          nextPage: (serverHost ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since + per_page}&per_page=${per_page}` : null),
          previousPage: ((since - per_page) >= 0 ? `https://backendfullstackapi.herokuapp.com/api/users?since=${since - per_page}&per_page=${per_page}` : null),
          valid: "not updated"
        })
      else res.status(404).send({ message: 'api limite rate used and no have cache data' })
    }

  }
})

/*
 * Show details of users github
 */
router.get('/users/:username/details', async (req, res, next) => {

  //params Check
  var username = "";
  if (req.params.username != undefined) {
    username = req.params.username
  } else return res.status(400).send({ message: 'missing params username' })

  //system cache

  var statusCache = await cache(req, res);
  if (statusCache.valid == "yes")
    return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
  else {
    let response;
    try { response = await consumer('https://api.github.com/users/' + username) } catch (ex) { console.error(ex); }
    if (response) {
      cacheData.cached[statusCache.position].data = response
      cacheData.cached[statusCache.position].timestamp = new Date().getTime()
      return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
    } else if (cacheData.cached[statusCache.position].data) {
      res.json({
        response: cacheData.cached[statusCache.position].data,
        updated_at: cacheData.cached[statusCache.position].timestamp,
        valid: "not updated"
      })
    } else res.status(404).send({ message: 'api limite rate used and no have cache data' })

  }
})



/*
 * Show repositorys of users github
 */
router.get('/users/:username/repos', async (req, res, next) => {
  var username = "";
  if (req.params.username != undefined) {
    username = req.params.username
  } else return res.status(400).send({ message: 'missing params username' })


  //system cache


  var statusCache = await cache(req, res);
  if (statusCache.valid == "yes")
    return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })
  else {
    let response;
    try {
      response = await consumer('https://api.github.com/users/' + username + '/repos')
    } catch (ex) { console.log(ex) }

    if (response) {
      cacheData.cached[statusCache.position].data = response
      cacheData.cached[statusCache.position].timestamp = new Date().getTime()
      return res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp })

    } else if (cacheData.cached[statusCache.position].data) {
      res.json({ response: cacheData.cached[statusCache.position].data, updated_at: cacheData.cached[statusCache.position].timestamp, valid: "not updated" })
    } else res.status(404).send({ message: 'api limite rate used and no have cache data' })

  }
})

module.exports = router;
