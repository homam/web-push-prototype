
const express = require('express');
const cors = require("cors")
import { subscribeToPush, sendPush, analyticsDeliveryNotification, analyticsClicked, analyticsClosed } from './handlers';

const app = express();
app.use(cors({
  origin: "*"
}))
app.use(require('cookie-parser')());
app.use(require('body-parser')());


app.post("/api/v1/subscribe", subscribeToPush)
app.post("/api/v1/push", sendPush)
app.post("/api/v1/analytics/push-delivery-notification", analyticsDeliveryNotification)
app.post("/api/v1/analytics/push-clicked", analyticsClicked)
app.post("/api/v1/analytics/push-closed", analyticsClosed)


app.enable('trust proxy') // http://expressjs.com/en/guide/behind-proxies.html
const port = process.env.PORT || 3050
const server = app.listen(port)
server.setTimeout(10 * 60 * 1000)
console.log(`app started at port ${port}`)