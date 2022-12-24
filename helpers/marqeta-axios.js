// FILE: marqeta-axios.js

require('dotenv').config();
const { APPLICATION_TOKEN, ADMIN_ACCESS_TOKEN } = process.env

const axios = require('axios');

const authString = Buffer.
  from(`${APPLICATION_TOKEN}:${ADMIN_ACCESS_TOKEN}`).
  toString('base64');

axios.defaults.headers.common['Authorization'] = `Basic ${authString}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';
axios.defaults.baseURL = 'https://sandbox-api.marqeta.com/v3';

const send = async (args = {}) => {
  const method = args.method || 'GET';
  try {
    const options = {
      method,
      url: args.endpoint
    }
    if (args.data) {
      options.data = args.data
    }
    const result = await axios(options);
    return result.data;
  } catch (e) {
    console.log(e.response);
  }
}

module.exports = send;
