import * as React from "react";
import { BrowserRouter, Route } from "react-router-dom";

import Map from "./Map";

const App = () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={Map} />
    </div>
  </BrowserRouter>
);
export default App;
