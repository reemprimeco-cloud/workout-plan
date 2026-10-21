/**
 * Where to send someone who needs a subscription.
 *
 * The web is not a storefront: Apple is the only payment path, so every
 * upgrade prompt on the web ends at the App Store rather than at a checkout
 * this product no longer runs.
 *
 * The numeric id is the app's Apple ID from App Store Connect, not the bundle
 * identifier — `com.primefit.ios` will not resolve as a listing URL.
 */
export const APP_STORE_URL = "https://apps.apple.com/app/id6794704719";
