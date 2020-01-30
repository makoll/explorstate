import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import { BrowserRouter, Route } from 'react-router-dom';
import { Reset } from 'styled-reset';

import Top from '@/components/pages/Top';

const Routes: React.FC = () => {
  // Mount時
  useEffect(() => {
    const pathname = '/';
    ReactGA.set({ page: pathname });
    ReactGA.pageview(pathname);
  }, []);

  return (
    <React.Fragment>
      <Reset />
      <BrowserRouter>
        <>
          <Route exact path='/' component={Top} />
        </>
      </BrowserRouter>
    </React.Fragment>
  );
};
export default Routes;
