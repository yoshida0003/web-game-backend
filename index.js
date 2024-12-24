const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Heelo World');
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});