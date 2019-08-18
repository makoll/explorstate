import * as React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import countries from "./countries";

const App = () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={Map} />
    </div>
  </BrowserRouter>
);

interface OuterProps {
  location: H.Location;
}
interface AppState {
  region: string;
  resolution: string;
  data: Array<any>;
}

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);
    console.log(queryString.parse(this.props.location.search));
    const paramsData = { JP: 1 };
    const allData = { ...countries, ...paramsData };
    const data = Object.entries(allData);
    this.state = {
      region: "world",
      resolution: "",
      data
    };
  }
  render() {
    const { data } = this.state;

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none"
      // enableRegionInteractivity: false
    };

    interface x {
      chartWrapper: any;
    }

    const selectHandler = ({ chartWrapper }: x) => {
      console.log(chartWrapper.getOptions());
      const { region } = chartWrapper.getOptions();
      const chart = chartWrapper.getChart();
      const selection = chart.getSelection();
      const index = selection[0].row + 1;
      const target = data[index];
      const newRegion = target[0].toString();
      console.log(target);

      if (region === "world" || !newRegion.startsWith(region)) {
        const newRegion = target[0].toString();
        this.setState({
          region: newRegion,
          resolution: "provinces"
        });
        return;
      }

      target[1] = !target[1];
      this.setState({
        data
      });
    };

    const backHandler = () => {
      this.setState({
        region: "world",
        resolution: ""
      });
    };

    return (
      <div>
        <Chart
          chartEvents={[
            {
              eventName: "select",
              callback: selectHandler
            }
          ]}
          chartType="GeoChart"
          width="100%"
          height="600px"
          options={options}
          data={data}
        />
        <button onClick={backHandler}>戻る</button>
      </div>
    );
  }
}
export default App;
