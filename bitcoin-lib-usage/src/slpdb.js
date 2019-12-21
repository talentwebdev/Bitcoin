(() => {
  const configResult = require('dotenv').config()
  if (configResult.error) {
    throw configResult.error
  }
})()

const btoa = require('btoa')
const axios = require('axios')
const _ = require('lodash')

const slpdb = {
  regex: {
    TOKENIDHEX: '[0-9a-f]{64}',
    TXID: '[0-9a-f]{64}',
    UTXO: '[0-9a-f]{64}:[0-9]+'
  },
  query: (query) => new Promise((resolve, reject) => {
    if (!query) {
      return reject(new Error('no query provided'))
    }
    const b64 = btoa(JSON.stringify(query))
    const url = process.env.SLPSERVE_URL + b64

    // log to help debugging
    console.info(url)

    resolve(axios.get(url)
      .then(data => data.data,
        e => reject(e))
    )
  }),

  match: (prop, db, match, additional_requirements = {}) => {
    let find = {
      [prop]: match
    };

    _.merge(find, additional_requirements);

    return {
      'v': 3,
      'q': {
        'db': db,
        'find': find,
        'limit': 1
      }
    };
  },

  // helper query to check the property exists
  exists: (prop, db, additional_requirements = {}) => {
    let find = {
      [prop]: {
        '$exists': false
      }
    }
    _.merge(find, additional_requirements)

    return {
      'v': 3,
      'q': {
        'db': [db],
        'find': find,
        'limit': 1
      }
    }
  },

  inverse_regex: (regex) => `^((?!${regex}).)*$`,

  inverse_match_regex: (prop, db, regex) => ({
    'v': 3,
    'q': {
      'db': [db],
      'find': {
        [prop]: {
          '$regex': slpdb.inverse_regex(regex)
        }
      },
      'limit': 1
    }
  }),

  inverse_match_array: (prop, db, arr) => ({
    'v': 3,
    'q': {
      'db': [db],
      'find': {
        [prop]: {
          '$nin': arr
        }
      },
      'limit': 1
    }
  }),

  inverse_match_list: (prop, db, list, count = prop) => {
    let aggConditions = list.map(v => ({
      '$match': {
        [prop]: v
      }
    })).concat({
      '$count': count
    })

    return {
      'v': 3,
      'q': {
        'db': [db],
        'aggregate': aggConditions,
        'limit': 1
      }
    }
  },

  inverse_match_not_type: (prop, db, ntype) => ({
    'v': 3,
    'q': {
      'db': db,
      'find': {
        [prop]: {
          '$not': {
            '$type': ntype
          }
        }
      },
      'limit': 1
    }
  })
}

module.exports = slpdb
