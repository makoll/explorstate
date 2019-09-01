import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import styled from "styled-components";

import countries from "./data/countries";
import relations from "./data/relations";
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
  selectedMiddleRegion: string;
}

const getBlankMapObject = (): IMapObject => {
  const mapObject = Object.keys(countries).reduce((obj, areaCode) => Object.assign(obj, { [areaCode]: 0 }), {});
  return mapObject;
};

interface MapSelectProps {
  chartWrapper: any;
}

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);

    const mapObject: IMapObject = this.getParamMapObject() || getBlankMapObject();
    const mapData = this.transMapData(mapObject);
    const mapParameter: string = "";

    this.state = {
      region: "world",
      resolution: "",
      mapObject,
      mapParameter,
      mapData,
      selectedMiddleRegion: "",
    };
  }

  transMapData = (mapObject: IMapObject): Array<any> => {
    const mapArray = Object.entries(mapObject).map(m => {
      const areaName = countries[m[0]][0];
      const percentage = `${m[1]}%`;
      return [...m, `${areaName} ${percentage}`];
    });
    const mapData = [["Country", "Value", { role: "tooltip", p: { html: true } }], ...mapArray];
    return mapData;
  };

  getParamMapObject = (): IMapObject | null => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.mapGetParam) {
      return null;
    }
    const cdStr = typeof getParams.mapGetParam === "string" ? getParams.mapGetParam : "";
    const allDataObject: IMapObject = JSON.parse(decode(cdStr));
    return allDataObject;
  };

  onClickCountryNameHandler = (countryCode: string) => {
    this.choiseCountry(countryCode);
  };

  selectCountryOnMapHandler = ({ chartWrapper }: MapSelectProps) => {
    const { mapData } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = mapData[selectedAreaIndex][0];

    const { region } = chartWrapper.getOptions();
    if (region === "world" || !selectedAreaCode.startsWith(region)) {
      this.choiseCountry(selectedAreaCode);
      return;
    }

    this.choiseCountryDistrict(selectedAreaCode);
  };

  choiseCountry = (countryCode: string) => {
    const { mapObject, mapData } = this.state;
    const mapArray = Object.entries(mapObject);
    const countriesDistricts = mapArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    // 行政区がある場合
    if (0 < countriesDistricts.length) {
      this.setState({
        region: countryCode,
        resolution: "provinces",
      });
      return;
    }

    mapObject[countryCode] = mapObject[countryCode] ? 0 : 100;
    const updatedMapData = this.transMapData(mapObject);
    const mapParameter = `?mapGetParam=${encode(JSON.stringify(mapObject))}`;
    this.setState({
      mapObject,
      mapData: updatedMapData,
      mapParameter,
    });
  };

  choiseCountryDistrict = (countryDistrictCode: string) => {
    const { mapObject } = this.state;
    mapObject[countryDistrictCode] = mapObject[countryDistrictCode] ? 0 : 100;

    const countryCode: string = countryDistrictCode.split("-")[0];
    const mapArray = Object.entries(mapObject);

    const countriesDistricts = mapArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    const countriesDistrictsVisited = countriesDistricts.filter(areaData => areaData[1]);
    const countryScore: number = (countriesDistrictsVisited.length / countriesDistricts.length) * 100;
    mapObject[countryCode] = countryScore;

    const updatedMapData = this.transMapData(mapObject);

    const mapParameter = `?mapGetParam=${encode(JSON.stringify(mapObject))}`;

    this.setState({
      mapObject,
      mapData: updatedMapData,
      mapParameter,
    });
  };

  backHandler = () => {
    this.setState({
      region: "world",
      resolution: "",
    });
  };

  onClickMiddleRegionHandler = (middleRegionCode: string) => {
    const selectedMiddleRegion = middleRegionCode === this.state.selectedMiddleRegion ? "" : middleRegionCode;
    this.setState({ selectedMiddleRegion });
  };

  render() {
    const { mapData, mapObject } = this.state;

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none",
      colorAxis: { minValue: 0, colors: ["#C0D0E0", "#CCEDCC"] },
      backgroundColor: "#90C0E0",
    };

    const url = `http://matome-dev:8080/${this.state.mapParameter}`;

    return (
      <div>
        <Chart
          chartEvents={[
            {
              eventName: "select",
              callback: this.selectCountryOnMapHandler,
            },
          ]}
          chartType="GeoChart"
          width="100%"
          height="600px"
          options={options}
          data={mapData}
        />
        <input type="text" value={url} readOnly />
        <button onClick={this.backHandler}>戻る</button>
        <Countries>
          {Object.entries(relations).map((relation, i) => {
            return (
              <ContinentRegion key={i}>
                <div>{relation[0]}</div>
                {Object.entries(relation[1]).map((region, ri) => {
                  const middleRegionCode = region[0];
                  return (
                    <MiddleRegion onClick={() => this.onClickMiddleRegionHandler(middleRegionCode)} key={ri}>
                      <div>{middleRegionCode}</div>
                      {region[1].map((countryCode, ci) => {
                        const countryName = countries[countryCode];
                        if (!countryName) {
                          return null;
                        }
                        const isDisplay: boolean = this.state.selectedMiddleRegion === middleRegionCode;
                        const displayScore: number = Math.round(mapObject[countryCode] * 100) / 100;
                        return (
                          <Country
                            onClick={() => this.onClickCountryNameHandler(countryCode)}
                            isDisplay={isDisplay}
                            key={ci}
                          >
                            <div>
                              {countryName[0]}: {displayScore}
                            </div>
                          </Country>
                        );
                      })}
                    </MiddleRegion>
                  );
                })}
              </ContinentRegion>
            );
          })}
        </Countries>
      </div>
    );
  }
}

const Countries = styled.div`
  display: flex;
  max-width: 1505px;
  text-align: center;
`;

const ContinentRegion = styled.div`
  background-color: #edcccc;
  border: 1px solid #ddbcbc
  border-right: 0px;
  width: 300px;
  height: 100%;
`;

const MiddleRegion = styled.div`
  background-color: #edddcc;
  border: 1px solid #ddcdbc;
  border-right: 0px;
`;

interface CountryProps {
  isDisplay: boolean;
}

const Country = styled.div`
  background-color: #ededcc;
  border: 1px solid #ddddbc;
  border-right: 0px;
  display: ${(props: CountryProps) => (props.isDisplay ? "block" : "none")};
`;

export default Map;
