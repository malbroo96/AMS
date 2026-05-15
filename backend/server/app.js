const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { clientUrl, uploadDir } = require('./config/env');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(`/${uploadDir}`, express.static(path.join(__dirname, '..', uploadDir)));

app.use('/api', routes);

app.use(errorMiddleware);

module.exports = app;
