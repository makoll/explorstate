import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import { BrowserRouter, Route } from 'react-router-dom';
import { Reset } from 'styled-reset';

import Top from '@/components/pages/Top';

const Routes: React.FC = () => {
  useEffect(() => {
    const pathname = '/';
    ReactGA.set({ page: pathname });
    ReactGA.pageview(pathname);
  }, []);

  return (
    <>
      <Reset />
      <BrowserRouter>
        <Route exact path='/' component={Top} />
      </BrowserRouter>
    </>
  );
};
export default Routes;
