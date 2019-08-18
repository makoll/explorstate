import * as React from "react";
import Chart from "react-google-charts";
import countries from "./countries";

interface OuterProps {}
interface AppState {
  region: string;
  resolution: string;
  data: Array<any>;
}

class App extends React.Component<OuterProps, AppState> {
  state: AppState = {
    region: "world",
    resolution: "",
    data: countries
  };

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
