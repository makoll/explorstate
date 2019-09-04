import * as React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import * as ReactGA from "react-ga";
// import * as H from "history";
// import createBrowserHistory from "history/createBrowserHistory";

import Map from "./Map";

ReactGA.initialize("UA-147024416-1");
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
      <BrowserRouter>
        <div>
          <Route exact path="/" component={Map} />
        </div>
      </BrowserRouter>
    );
  }
}
export default App;
