import * as React from "react";
import Chart from "react-google-charts";
import countries from "./countries";

interface OuterProps {}
interface AppState {
  region: string;
  resolution: string;
}

class App extends React.Component<OuterProps, AppState> {
  state: AppState = {
    region: "world",
    resolution: ""
  };

  render() {
    const data = countries;

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none"
    };

    interface x {
      chartWrapper: any;
    }

    const selectHandler = ({ chartWrapper }: x) => {
      const chart = chartWrapper.getChart();
      const selection = chart.getSelection();
      const index = selection[0].row + 1;
      const region = data[index][0];
      console.log(index, region);
      this.setState({
        region: region.toString(),
        resolution: "provinces"
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
      </div>
    );
  }
}
export default App;
