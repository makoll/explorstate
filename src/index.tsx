import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';

import Routes from '@/routes';

const trackingId = process.env.NODE_ENV === 'production' ? 'UA-147024416-1' : 'UA-147024416-2';
ReactGA.initialize(trackingId, {
  debug: process.env.NODE_ENV !== 'production',
});

ReactDOM.render(<Routes />, document.getElementById('app'));
