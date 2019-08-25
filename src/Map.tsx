import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import countries from "./data/countries";
import { decode, encode } from "./util/util";

interface OuterProps {
  location: H.Location;
}

interface IMapObject {
  [key: string]: number;
}

interface AppState {
  region: string;
  resolution: string;
  mapObject: IMapObject;
  mapParameter: string;
  mapData: Array<any>;
}

const getBlankMapObject = (): IMapObject => {
  const mapObject = Object.keys(countries).reduce(
    (obj, areaCode) => Object.assign(obj, { [areaCode]: 0 }),
    {}
  );
  return mapObject;
};

interface MapSelectProps {
  chartWrapper: any;
}

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);

    const mapObject: IMapObject =
      this.getParamMapObject() || getBlankMapObject();
    const mapData = this.transMapData(mapObject);
    const mapParameter: string = "";

    this.state = {
      region: "world",
      resolution: "",
      mapObject,
      mapParameter,
      mapData
    };
  }

  transMapData = (mapObject: IMapObject): Array<any> => {
    const mapArray = Object.entries(mapObject).map(m => {
      const areaName = countries[m[0]][0];
      const percentage = `${m[1]}%`;
      return [...m, `${areaName} ${percentage}`];
    });
    const mapData = [
      ["Country", "Value", { role: "tooltip", p: { html: true } }],
      ...mapArray
    ];
    return mapData;
  };

  getParamMapObject = (): IMapObject | null => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.mapGetParam) {
      return null;
    }
    let cdStr: string | string[] = getParams.mapGetParam;
    if (typeof cdStr !== "string") {
      cdStr = "";
    }
    const allDataObject: IMapObject = JSON.parse(decode(cdStr));
    return allDataObject;
  };

  selectHandler = ({ chartWrapper }: MapSelectProps) => {
    const { mapObject, mapData } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = mapData[selectedAreaIndex][0];

    const { region } = chartWrapper.getOptions();
    if (region === "world" || !selectedAreaCode.startsWith(region)) {
      this.setState({
        region: selectedAreaCode,
        resolution: "provinces"
      });
      return;
    }

    mapObject[selectedAreaCode] = mapObject[selectedAreaCode] ? 0 : 100;

    const countryCode: string = selectedAreaCode.split("-")[0];
    const mapArray = Object.entries(mapObject);

    const countriesDistricts = mapArray.filter(areaData =>
      areaData[0].startsWith(countryCode)
    );
    const countriesDistrictsVisited = countriesDistricts.filter(
      areaData => areaData[1]
    );
    const countryScore: number =
      (countriesDistrictsVisited.length / countriesDistricts.length) * 100;
    mapObject[countryCode] = countryScore;

    const updatedMapData = this.transMapData(mapObject);

    const mapParameter = `?mapGetParam=${encode(JSON.stringify(mapObject))}`;

    this.setState({
      mapObject,
      mapData: updatedMapData,
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
    const { mapData } = this.state;

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none",
      colorAxis: { minValue: 0, colors: ["#C0D0E0", "#CCEDCC"] },
      backgroundColor: "#90C0E0"
    };

    const url = `{http://matome-dev:8080/${this.state.mapParameter}`;

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
          data={mapData}
        />
        <input type="text" value={url} />
        <button onClick={this.backHandler}>戻る</button>
      </div>
    );
  }
}
export default Map;
