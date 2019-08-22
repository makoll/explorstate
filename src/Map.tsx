import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import countries from "./data/countries";
import { decode, encode } from "./util/util";

interface OuterProps {
  location: H.Location;
}
interface AppState {
  region: string;
  resolution: string;
  mapArray: Array<Array<string | number>>;
  mapParameter: string;
}

const getBlankMapArray = () => {
  let mapObj = Object.keys(countries).reduce(
    (obj, countryCode) => Object.assign(obj, { [countryCode]: 0 }),
    { Region: "Data" }
  );
  for (const country of Object.keys(countries)) {
    mapObj = Object.keys(countries[country]).reduce(
      (obj, subdivisionCode) => Object.assign(obj, { [subdivisionCode]: 0 }),
      mapObj
    );
  }
  return Object.entries(mapObj);
};

interface MapSelectProps {
  chartWrapper: any;
}

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);

    const mapArray: Array<Array<string | number>> =
      this.getParamMapArray() || getBlankMapArray();
    const mapParameter: string = "";
    this.state = {
      region: "world",
      resolution: "",
      mapArray,
      mapParameter
    };
  }

  getParamMapArray = () => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.mapGetParam) {
      return null;
    }
    let cdStr: string | string[] = getParams.mapGetParam;
    if (typeof cdStr !== "string") {
      cdStr = "";
    }
    const allData: Array<Array<string | number>> = JSON.parse(decode(cdStr));
    return allData;
  };

  selectHandler = ({ chartWrapper }: MapSelectProps) => {
    const { mapArray } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedArea = mapArray[selectedAreaIndex];

    const { region } = chartWrapper.getOptions();
    const newRegion = selectedArea[0].toString();
    if (region === "world" || !newRegion.startsWith(region)) {
      this.setState({
        region: newRegion,
        resolution: "provinces"
      });
      return;
    }

    selectedArea[1] = selectedArea[1] ? 0 : 1;

    const areaCode = selectedArea[0];
    let _mapArray = mapArray;
    if (typeof areaCode === "string") {
      const countryCode: string = areaCode.split("-")[0];
      _mapArray = _mapArray.map(areaData => {
        if (areaData[0] === countryCode) {
          return [countryCode, 1];
        }
        return areaData;
      });
    }

    const mapParameter = `?mapGetParam=${encode(JSON.stringify(_mapArray))}`;
    this.setState({
      mapArray: _mapArray,
      mapParameter
    });
  };

  backHandler = () => {
    this.setState({
      region: "world",
      resolution: ""
    });
  };

  render() {
    const { mapArray } = this.state;

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none"
    };

    return (
      <div>
        <Chart
          chartEvents={[
            {
              eventName: "select",
              callback: this.selectHandler
            }
          ]}
          chartType="GeoChart"
          width="100%"
          height="600px"
          options={options}
          data={mapArray}
        />
        <button onClick={this.backHandler}>戻る</button>
        <div>http://matome-dev:8080/{this.state.mapParameter}</div>
      </div>
    );
  }
}
export default Map;
