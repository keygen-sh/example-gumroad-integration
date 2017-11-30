// Be sure to add these ENV variables!
const {
  GUMROAD_ACCESS_TOKEN,
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  KEYGEN_PRODUCT_ID,
  KEYGEN_POLICY_ID,
  PORT = 8080
} = process.env

const fetch = require('node-fetch')
const crypto = require('crypto')
const express = require('express')
const bodyParser = require('body-parser')
const userAgent = require('express-useragent')
const morgan = require('morgan')
const app = express()

app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(morgan('combined'))

app.set('view engine', 'ejs')

// 1. Our Gumroad checkout form will redirect here after a successful purchase. Inside
//    this route, we'll verify that the passed sale is valid within Gumroad and then
//    create a Keygen license resource. After that has successfully been done, we'll
//    render a 'success' page containing our user's license key which they can use
//    inside of our software product, e.g.:
//
//    curl -X POST https://api.keygen.sh/v1/accounts/$KEYGEN_ACCOUNT_ID/licenses/actions/validate-key \
//      -H 'Content-Type: application/vnd.api+json' \
//      -H 'Accept: application/vnd.api+json' \
//      -d '{
//            "meta": {
//              "key": "$KEYGEN_LICENSE_KEY"
//            }
//          }'
app.get('/success', async (req, res) => {
  const { query } = req

  // If we aren't supplied with a sale and product ID, the request is invalid.
  if (!query.sale_id || !query.product_id) {
    res.render('error', {
      error: 'Missing order details.'
    })
    return
  }

  // 2. Fetch the Gumroad sale resource to make sure our request is valid.
  const gres = await fetch(`https://api.gumroad.com/v2/sales/${query.sale_id}?access_token=${GUMROAD_ACCESS_TOKEN}`)
  if (gres.status !== 200) { // Invalid! Bail early before we create a license.
    res.render('error', {
      error: 'Invalid sale ID.'
    })
    return
  }

  const { sale } = await gres.json()

  // 3. Create a user-less Keygen license for our new Gumroad customer.
  const kres = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      data: {
        type: 'licenses',
        attributes: {
          // Generate a short license key in the form of 'XXXX-XXXX-XXXX-XXXX' that we can
          // send to our customer via email and display on the success page.
          key: crypto.randomBytes(8).toString('hex').split(/(.{4})/).filter(Boolean).join('-'),
          metadata: {
            gumroadProductId: query.product_id,
            gumroadSaleId: query.sale_id
          }
        },
        relationships: {
          policy: {
            data: { type: 'policies', id: KEYGEN_POLICY_ID }
          }
        }
      }
    })
  })

  const { data: license, errors } = await kres.json()
  if (errors) {
    const error = errors.map(e => e.detail).toString()

    // If you receive an error here, then you may want to handle the fact the customer
    // may have been charged for a license that they didn't receive e.g. easiest way
    // would be to create the license manually, or refund their payment.
    console.error(`Received error while creating license for ${JSON.stringify(query)}:\n ${error}`)

    res.render('error', {
      error: 'There was an error while creating your license. Please contact support.'
    })
    return
  }

  // 4. All is good! License was successfully created for the new Gumroad customer.
  //    Next up we're going to send the user a download link to our product based
  //    on the "platform" variant they chose (assuming a release has been created
  //    for our product using Keygen Dist).
  const ua = userAgent.parse(req.headers['user-agent'])
  const { attributes: { key } } = license
  let platform

  if (ua.isMac) {
    platform = 'darwin'
  } else if (ua.isWindows) {
    platform = 'win32'
  } else {
    // … handle other platforms
  }

  const downloadLink = `https://dist.keygen.sh/v1/${KEYGEN_ACCOUNT_ID}/${KEYGEN_PRODUCT_ID}/latest/${platform}/zip?key=${key}&policy=${KEYGEN_POLICY_ID}`

  // 5. Render our success page with the new license resource and download link.
  res.render('success', {
    downloadLink,
    license,
    sale
  })
})

process.on('unhandledRejection', err => {
  console.error(`Unhandled rejection: ${err}`, err.stack)
})

const server = app.listen(PORT, 'localhost', () => {
  const { address, port } = server.address()

  console.log(`Listening at http://${address}:${port}`)
})