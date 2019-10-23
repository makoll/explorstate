import * as React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import * as ReactGA from "react-ga";
import { Reset } from "styled-reset";

import Map from "./Map";

const trackingId = process.env.NODE_ENV === "production" ? "UA-147024416-1" : "UA-147024416-2";
ReactGA.initialize(trackingId);
interface OuterProps {}
interface AppState {}
class App extends React.Component<OuterProps, AppState> {
  componentDidMount() {
    const pathname = "/";
    ReactGA.set({ page: pathname });
    ReactGA.pageview(pathname);
  }
  render() {
    return (
      <React.Fragment>
        <Reset />
        <BrowserRouter>
          <div>
            <Route exact path="/" component={Map} />
          </div>
        </BrowserRouter>
      </React.Fragment>
    );
  }
}
export default App;
