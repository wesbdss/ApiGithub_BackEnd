
const fetch = require('node-fetch');

module.exports = async (endpoint, method = 'GET', content = null) => {
  console.log("Pediu Request")
  let response;
  if (method != 'GET') {
    response = await fetch(endpoint, {
      method: method,
      body: JSON.stringify(content),
      headers: { 'Content-Type': 'application/json' }
    })
  } else {
    response = await fetch(endpoint)
  }
  if (response.statusText != 'OK') {
    console.error(response.body.message)
    throw new Error('EndPoint Problem ');
  }
  return response.json()
}