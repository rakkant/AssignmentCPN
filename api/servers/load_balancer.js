const express = require('express');
const httpProxy = require('express-http-proxy');

const app = express();

const proxy = httpProxy('http://backend-server1:9000', {
  proxyReqPathResolver: (req) => {
    // You can implement custom logic for request path resolution here
    return '/api' + req.url;
  },
});

app.use('/api', proxy);


const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`Load balancer listening on port ${port}`);
});
