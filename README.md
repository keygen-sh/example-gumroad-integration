# Example Keygen + Gumroad integration
The following web app is written in Node.js and shows how to integrate
[Keygen](https://keygen.sh) and [Gumroad](https://gumroad.com) together
using Gumroad's custom delivery fulfillment method. After a buyer purchases
our software, we will create a license for the new customer and redirect
them to a "success" page containing their license key and a download link
to our product distributed using [Keygen Dist](https://keygen.sh/distribution).

**Note: This integration requires that you have an [upgraded Gumroad account](http://help.gumroad.com/custom-delivery-products)
in order to use their "Custom Delivery" method.**

> **This example application is not 100% production-ready**, but it should
> get you 90% of the way there. You may need to add additional logging,
> error handling, validation, features, etc.

## Running the app locally

First up, configure a few environment variables:
```bash
# Your Gumroad API credentials (available under Settings->Advanced->Create Application)
export GUMROAD_ACCESS_TOKEN="YOUR_GUMROAD_ACCESS_TOKEN"

# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"

# The Keygen product to create licenses for and which product we'll
# be delivering download links for
export KEYGEN_PRODUCT_ID="YOUR_KEYGEN_PRODUCT_ID"

# The Keygen policy to use when creating licenses for new customers
# after they successfully purchase your product
export KEYGEN_POLICY_ID="YOUR_KEYGEN_POLICY_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):
```
yarn
```

Then start the app:
```
yarn start
```

## Testing redirects locally

For local development, create an [`ngrok`](https://ngrok.com) tunnel:
```
ngrok http 8080
```

Next up, add the secure `ngrok` URL to your Gumroad product.

1. **Gumroad:** add `https://{YOUR_NGROK_URL}/success` as the redirect
   URL to your "Custom Delivery" product ([more info](http://help.gumroad.com/custom-delivery-products))

## Testing the integration

Set up a Gumroad purchase form and create a test purchase.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!