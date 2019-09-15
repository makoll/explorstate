import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import styled from "styled-components";

import countries from "./data/countries";
import relations from "./data/relations";
import region_mapping from "./data/region_mapping";
// import { decode, encode } from "./util/util";

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
  countryMiddleRegion: { [key: string]: string };
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
    const countryMiddleRegion = Object.keys(relations).reduce((o1, continentRegion) => {
      return Object.keys(relations[continentRegion]).reduce((o2, middleRegion) => {
        return relations[continentRegion][middleRegion].reduce((o3, country) => {
          return Object.assign(o3, { [country]: middleRegion })
        }, o2)
      }, o1);
    }, {});
    this.state = {
      region: "world",
      resolution: "",
      mapObject,
      lastMapData: [],
      selectedMiddleRegion: "",
      countryMiddleRegion,
    };
  }

  componentDidMount = () => {
    const { mapObject } = this.state;
    const mapData = this.transMapDataForDisplay(mapObject);
    this.setState({ lastMapData: mapData });
  }

  transMapDataForDisplay = (mapObject: IMapObject): Array<any> => {
    const mapArray = Object.entries(mapObject).map(m => {
      const { region } = this.state;
      const areaCode = m[0];
      const areaScore = m[1];
      const areaName = countries[areaCode][0];
      const areaNameSub = countries[areaCode][1];
      const displayAreaNameSub = areaNameSub ? ` (${areaNameSub})` : "";
      const displayAreaName = `${areaName}${displayAreaNameSub}`;
      let append = null;
      if (region === "world" || !areaCode.startsWith(region)) {
        const score: number = Math.round(areaScore * 1000) / 10;
        append = `${score}%`;
      } else {
        const check = areaScore ? "☑️" : "⬛️";
        append = check;
      }
      return [...m, `${displayAreaName} ${append}`];
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
    const allDataObject: IMapObject = JSON.parse(cdStr);
    return allDataObject;
  };

  onClickAreaNameHandler = (e: React.MouseEvent, countryCode: string) => {
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

    mapObject[countryCode] = mapObject[countryCode] ? 0 : 1;
    this.setState({ mapObject });
  };

  choiseCountryDistrict = (countryDistrictCode: string) => {
    const { mapObject } = this.state;
    mapObject[countryDistrictCode] = mapObject[countryDistrictCode] ? 0 : 1;

    const countryCode: string = countryDistrictCode.split("-")[0];
    const mapArray = Object.entries(mapObject);

    const countriesDistricts = mapArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    const countriesDistrictsVisited = countriesDistricts.filter(areaData => areaData[1]);
    const countryScore: number = Math.round((countriesDistrictsVisited.length / countriesDistricts.length) * 1000) / 1000;
    mapObject[countryCode] = countryScore;

    this.setState({ mapObject });
  };

  generateMapParameter = (mapObject: IMapObject): string => {
    const hasValueMapArray: Array<any> = Object.entries(mapObject).filter(m => 0 < m[1]);
    const hasValueMapObject = hasValueMapArray.reduce((obj, data) => ({ ...obj, [data[0]]: data[1] }), {});
    return `?mapGetParam=${JSON.stringify(hasValueMapObject)}`;
  }

  goToTopHandler = () => {
    this.setState({
      region: "world",
      resolution: "",
    });
  };

  goToMiddleRegionHandler = () => {
    const { region, countryMiddleRegion } = this.state;
    this.setState({
      region: region_mapping[countryMiddleRegion[region]],
      resolution: "",
    });
  }

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
    const isDisplay: boolean = !(this.state.region in countries);
    if (!isDisplay) {
      return null;
    }
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
          return (
            <this.Country
              isDisplay={isDisplay}
              countryCode={countryCode}
              countryName={countryName[0]}
              countryNameSub={countryName[1]}
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
    } = props;
    const { mapObject } = this.state;
    const score: number = Math.round(mapObject[countryCode] * 1000) / 10;
    return (
      <CountryWrapper
        onClick={(e) => this.onClickAreaNameHandler(e, countryCode)}
        isDisplay={isDisplay}
      >
        <div>
          {countryName} ({countryNameSub}): {score}%
        </div>
      </CountryWrapper>
    )
  };

  SubdivisionList = () => {
    const isDisplay: boolean = this.state.region in countries;
    if (!isDisplay) {
      return null;
    }
    const { mapObject } = this.state;
    const mapArray = Object.entries(countries);
    const countryCode = this.state.region;
    const subdivisions = mapArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    return (
      <SubdivisionListWrapper>
        {subdivisions.map((subdivision, i) => {
          const subdivisionCode = subdivision[0];
          const subdivisionName = subdivision[1][0];
          const subdivisionNameSub = subdivision[1][1];
          return (
            <this.Subdivision
              subdivisionCode={subdivisionCode}
              subdivisionName={subdivisionName}
              subdivisionNameSub={subdivisionNameSub}
              key={i}
            />
          );
        })}
      </SubdivisionListWrapper>
    )
  };

  Subdivision = (props: SubdivisionProps) => {
    const { mapObject } = this.state;
    const {
      subdivisionCode,
      subdivisionName,
      subdivisionNameSub,
    } = props;
    const displayingSubdivisionNameSub = subdivisionNameSub ? `(${subdivisionNameSub})` : "";
    const check = mapObject[subdivisionCode] ? "☑️" : "⬛️";
    return (
      <SubdivisionWrapper
        onClick={(e) => this.onClickAreaNameHandler(e, subdivisionCode)}
      >
        <div>
          <span>{subdivisionCode}: {subdivisionName} {displayingSubdivisionNameSub}</span>
          <SubdivisionCheck>{check}</SubdivisionCheck>
        </div>
      </SubdivisionWrapper>
    )
  };

  render() {
    const { mapObject, region, resolution, countryMiddleRegion } = this.state;

    const mapData = this.transMapDataForDisplay(mapObject);

    const options = {
      region,
      resolution,
      legend: "none",
      colorAxis: { colors: ["white", "#EDEDCC", "#CCEDCC"] },
      backgroundColor: "#90C0E0",
    };

    const mapParameter = this.generateMapParameter(mapObject);
    const url = `${document.domain}/${mapParameter}`;

    const isDisplayCountry = region in countryMiddleRegion;

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
        <button onClick={this.goToTopHandler}>Topへ</button>
        {isDisplayCountry && <button onClick={this.goToMiddleRegionHandler}>上へ</button>}
        <UrlCopy type="text" value={url} readOnly />
        <this.CountriesList />
        <this.SubdivisionList />
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

const SubdivisionListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap
`;

const SubdivisionWrapper = styled.div`
  background-color: #ededcc;
  border: 1px solid #ddddbc;
  border-right: 0px;
  width: 280px;
  text-align: left;
  padding: 0 10px
`;

const UrlCopy = styled.input`
  width: 100%;
`;

const SubdivisionCheck = styled.span`
  float: right;
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
};

interface SubdivisionProps {
  subdivisionCode: string;
  subdivisionName: string;
  subdivisionNameSub: string;
};

export default Map;
