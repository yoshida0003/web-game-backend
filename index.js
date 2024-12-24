const express = require('express');
const app = express();

app.get('/api', (req, res) => {
  res.send('hello World');
});

app.get('/api/test', (req, res) => {
  res.send('test');
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
