import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import styled from "styled-components";

import countries from "./data/countries";
import relations from "./data/relations";
import region_mapping from "./data/region_mapping";
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
  lastMapData: Array<any>;
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
    const mapObject: IMapObject = Object.assign(getBlankMapObject(), this.getParamMapObject());
    this.state = {
      region: "world",
      resolution: "",
      mapObject,
      lastMapData: [],
      selectedMiddleRegion: "",
    };
  }

  componentDidMount = () => {
    const { mapObject } = this.state;
    const mapData = this.transMapData(mapObject);
    this.setState({ lastMapData: mapData });
  }

  transMapData = (mapObject: IMapObject): Array<any> => {
    const mapArray = Object.entries(mapObject).map(m => {
      const areaName = countries[m[0]][0];
      const areaNameSub = countries[m[0]][1];
      const displayAreaNameSub = areaNameSub ? ` (${areaNameSub})` : "";
      const displayAreaName = `${areaName}${displayAreaNameSub}`;
      const percentage = `${m[1]}%`;
      return [...m, `${displayAreaName} ${percentage}`];
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

  onClickCountryNameHandler = (e: React.MouseEvent, countryCode: string) => {
    this.choiseCountry(countryCode);
    e.stopPropagation();
  };

  selectCountryOnMapHandler = ({ chartWrapper }: MapSelectProps) => {
    const { lastMapData } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = lastMapData[selectedAreaIndex][0];

    const { region } = chartWrapper.getOptions();
    if (region === "world" || !selectedAreaCode.startsWith(region)) {
      this.choiseCountry(selectedAreaCode);
      return;
    }

    this.choiseCountryDistrict(selectedAreaCode);
  };

  choiseCountry = (countryCode: string) => {
    const { mapObject } = this.state;
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
    this.setState({ mapObject });
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

    this.setState({ mapObject });
  };

  generateMapParameter = (mapObject: IMapObject): string => {
    const hasValueMapArray: Array<any> = Object.entries(mapObject).filter(m => 0 < m[1]);
    const hasValueMapObject = hasValueMapArray.reduce((obj, data) => ({ ...obj, [data[0]]: data[1] }), {});
    return `?mapGetParam=${encode(JSON.stringify(hasValueMapObject))}`;
  }

  backHandler = () => {
    this.setState({
      region: "world",
      resolution: "",
    });
  };

  onClickContinentRegionHandler = (continentRegionCode: string) => {
    const region: string = region_mapping[continentRegionCode];
    const resolution = "";
    this.setState({ region, resolution });
  };

  onClickMiddleRegionHandler = (e: React.MouseEvent, middleRegionCode: string) => {
    const selectedMiddleRegion = middleRegionCode === this.state.selectedMiddleRegion ? "" : middleRegionCode;
    const region: string = region_mapping[middleRegionCode];
    const resolution = "";
    this.setState({ selectedMiddleRegion, region, resolution });
    e.stopPropagation();
  };

  CountriesList = () => {
    return (
      <CountriesListWrapper>
        {Object.entries(relations).map((relation, i) => {
          const continentRegionCode = relation[0];
          const continentRelations = relation[1];
          return (
            <this.ContinentRegion
              continentRegionCode={continentRegionCode}
              continentRelations={continentRelations}
              key={i}
            />
          );
        })}
      </CountriesListWrapper>
    )
  };

  ContinentRegion = (props: ContinentRegionProps) => {
    const {
      continentRegionCode,
      continentRelations,
    } = props;
    return (
      <ContinentRegionWrapper onClick={() => this.onClickContinentRegionHandler(continentRegionCode)}>
        <div>{continentRegionCode}</div>
        {Object.entries(continentRelations).map((region, i) => {
          const middleRegionCode = region[0];
          const middleRegionCountries = region[1];
          return (
            <this.MiddleRegion
              middleRegionCode={middleRegionCode}
              middleRegionCountries={middleRegionCountries}
              key={i}
            />
          );
        })}
      </ContinentRegionWrapper>
    )
  };

  MiddleRegion = (props: MiddleRegionProps) => {
    const { mapObject } = this.state;
    const {
      middleRegionCode,
      middleRegionCountries,
    } = props;
    return (
      <MiddleRegionWrapper onClick={(e) => this.onClickMiddleRegionHandler(e, middleRegionCode)}>
        <div>{middleRegionCode}</div>
        {middleRegionCountries.map((countryCode, i) => {
          const countryName = countries[countryCode];
          if (!countryName) {
            return null;
          }
          const isDisplay: boolean = this.state.selectedMiddleRegion === middleRegionCode;
          const displayScore: number = Math.round(mapObject[countryCode] * 100) / 100;
          return (
            <this.Country
              isDisplay={isDisplay}
              countryCode={countryCode}
              countryName={countryName[0]}
              countryNameSub={countryName[1]}
              countryScore={displayScore}
              key={i}
            />
          );
        })}
      </MiddleRegionWrapper>
    )
  };

  Country = (props: CountryProps) => {
    const {
      isDisplay,
      countryCode,
      countryName,
      countryNameSub,
      countryScore,
    } = props;
    return (
      <CountryWrapper
        onClick={(e) => this.onClickCountryNameHandler(e, countryCode)}
        isDisplay={isDisplay}
      >
        <div>
          {countryName} ({countryNameSub}): {countryScore}
        </div>
      </CountryWrapper>
    )
  };

  render() {
    const { mapObject } = this.state;

    const mapData = this.transMapData(mapObject);

    const options = {
      region: this.state.region,
      resolution: this.state.resolution,
      legend: "none",
      colorAxis: { colors: ["white", "#EDEDCC", "#CCEDCC"] },
      backgroundColor: "#90C0E0",
    };

    const mapParameter = this.generateMapParameter(mapObject);
    const url = `${document.domain}/${mapParameter}`;

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
        <button onClick={this.backHandler}>Topへ</button>
        <UrlCopy type="text" value={url} readOnly />
        <this.CountriesList />
      </div>
    );
  }
}

const CountriesListWrapper = styled.div`
  display: flex;
  max-width: 1505px;
  text-align: center;
`;

const ContinentRegionWrapper = styled.div`
  background-color: #edcccc;
  border: 1px solid #ddbcbc
  border-right: 0px;
  width: 300px;
  height: 100%;
`;

const MiddleRegionWrapper = styled.div`
  background-color: #edddcc;
  border: 1px solid #ddcdbc;
  border-right: 0px;
`;

interface CountryWrapperProps {
  isDisplay: boolean;
}

const CountryWrapper = styled.div`
  background-color: #ededcc;
  border: 1px solid #ddddbc;
  border-right: 0px;
  display: ${(props: CountryWrapperProps) => (props.isDisplay ? "block" : "none")};
`;

const UrlCopy = styled.input`
  width: 100%;
`;

interface ContinentRegionProps {
  continentRegionCode: string;
  continentRelations: { [key: string]: Array<string> };
}

interface MiddleRegionProps {
  middleRegionCode: string;
  middleRegionCountries: Array<string>;
}

interface CountryProps {
  isDisplay: boolean;
  countryCode: string;
  countryName: string;
  countryNameSub: string;
  countryScore: number;
};

export default Map;
