import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import styled from "styled-components";

import countries from "./data/countries";
import relations from "./data/relations";
import regions from "./data/regions";
// import { decode, encode } from "./util/util";

interface OuterProps {
  location: H.Location;
}

interface IRecords {
  [key: string]: number;
}

interface AppState {
  displayingAreaCode: string;
  resolution: string;
  records: IRecords;
  lastGoogleChartsData: Array<any>;
  selectedMiddleRegion: string;
  countryMiddleRegion: { [key: string]: string };
}

const getInitRecords = (): IRecords => {
  const records = Object.keys(countries).reduce((obj, areaCode) => Object.assign(obj, { [areaCode]: 0 }), {});
  return records;
};

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);
    const records: IRecords = Object.assign(getInitRecords(), this.lastParametersRecords());
    const countryMiddleRegion = Object.keys(relations).reduce((o1, continentRegion) => {
      return Object.keys(relations[continentRegion]).reduce((o2, middleRegion) => {
        return relations[continentRegion][middleRegion].reduce((o3, country) => {
          return Object.assign(o3, { [country]: middleRegion })
        }, o2)
      }, o1);
    }, {});
    this.state = {
      displayingAreaCode: "world",
      resolution: "",
      records,
      lastGoogleChartsData: [],
      selectedMiddleRegion: "",
      countryMiddleRegion,
    };
  }

  componentDidMount = () => {
    const { records } = this.state;
    const googleChartsData = this.translateGoogleChartsData(records);
    this.setState({ lastGoogleChartsData: googleChartsData });
  }

  translateGoogleChartsData = (records: IRecords): Array<any> => {
    const recordArray = Object.entries(records).map(m => {
      const { displayingAreaCode } = this.state;
      const areaCode = m[0];
      const areaScore = m[1];
      const areaName = countries[areaCode][0];
      const areaNameSub = countries[areaCode][1];
      const displayAreaNameSub = areaNameSub ? ` (${areaNameSub})` : "";
      const displayAreaName = `${areaName}${displayAreaNameSub}`;
      let append = null;
      if (displayingAreaCode === "world" || !areaCode.startsWith(displayingAreaCode)) {
        const score: number = Math.round(areaScore * 1000) / 10;
        append = `${score}%`;
      } else {
        const check = areaScore ? "☑️" : "⬛️";
        append = check;
      }
      return [...m, `${displayAreaName} ${append}`];
    });
    const googleChartsData = [["Country", "Value", { role: "tooltip", p: { html: true } }], ...recordArray];
    return googleChartsData;
  };

  lastParametersRecords = (): IRecords | null => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.records) {
      return null;
    }
    const recordString = typeof getParams.records === "string" ? getParams.records : "";
    return JSON.parse(recordString);
  };

  onClickAreaNameHandler = (e: React.MouseEvent, countryCode: string) => {
    this.choiseCountry(countryCode);
    e.stopPropagation();
  };

  selectCountryOnMapHandler = ({ chartWrapper }: any) => {
    const { lastGoogleChartsData } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = lastGoogleChartsData[selectedAreaIndex][0];

    const { displayingAreaCode } = chartWrapper.getOptions();
    if (displayingAreaCode === "world" || !selectedAreaCode.startsWith(displayingAreaCode)) {
      this.choiseCountry(selectedAreaCode);
      return;
    }

    this.choiseCountryDistrict(selectedAreaCode);
  };

  choiseCountry = (countryCode: string) => {
    const { records } = this.state;
    const recordArray = Object.entries(records);
    const countriesDistricts = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    // 行政区がある場合
    if (0 < countriesDistricts.length) {
      this.setState({
        displayingAreaCode: countryCode,
        resolution: "provinces",
      });
      return;
    }

    records[countryCode] = records[countryCode] ? 0 : 1;
    this.setState({ records });
  };

  choiseCountryDistrict = (countryDistrictCode: string) => {
    const { records } = this.state;
    records[countryDistrictCode] = records[countryDistrictCode] ? 0 : 1;

    const countryCode: string = countryDistrictCode.split("-")[0];
    const recordArray = Object.entries(records);

    const countriesDistricts = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    const countriesDistrictsVisited = countriesDistricts.filter(areaData => areaData[1]);
    const countryScore: number = Math.round((countriesDistrictsVisited.length / countriesDistricts.length) * 1000) / 1000;
    records[countryCode] = countryScore;

    this.setState({ records });
  };

  generateRecordParameter = (records: IRecords): string => {
    const hasValueRecordArray: Array<any> = Object.entries(records).filter(m => 0 < m[1]);
    const hasValueRecords = hasValueRecordArray.reduce((obj, data) => ({ ...obj, [data[0]]: data[1] }), {});
    return `records=${JSON.stringify(hasValueRecords)}`;
  }

  goToTopHandler = () => {
    this.setState({
      displayingAreaCode: "world",
      resolution: "",
    });
  };

  goToMiddleRegionHandler = () => {
    const { displayingAreaCode, countryMiddleRegion } = this.state;
    this.setState({
      displayingAreaCode: regions[countryMiddleRegion[displayingAreaCode]],
      resolution: "",
    });
  }

  onClickContinentRegionHandler = (continentRegionCode: string) => {
    const displayingAreaCode: string = regions[continentRegionCode];
    const resolution = "";
    this.setState({ displayingAreaCode, resolution });
  };

  onClickMiddleRegionHandler = (e: React.MouseEvent, middleRegionCode: string) => {
    const selectedMiddleRegion = middleRegionCode === this.state.selectedMiddleRegion ? "" : middleRegionCode;
    const displayingAreaCode: string = regions[middleRegionCode];
    const resolution = "";
    this.setState({ selectedMiddleRegion, displayingAreaCode, resolution });
    e.stopPropagation();
  };

  CountriesList = () => {
    const isDisplay: boolean = !(this.state.displayingAreaCode in countries);
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
    const { records } = this.state;
    const score: number = Math.round(records[countryCode] * 1000) / 10;
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
    const isDisplay: boolean = this.state.displayingAreaCode in countries;
    if (!isDisplay) {
      return null;
    }
    const recordArray = Object.entries(countries);
    const countryCode = this.state.displayingAreaCode;
    const subdivisions = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
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
    const { records } = this.state;
    const {
      subdivisionCode,
      subdivisionName,
      subdivisionNameSub,
    } = props;
    const displayingSubdivisionNameSub = subdivisionNameSub ? `(${subdivisionNameSub})` : "";
    const check = records[subdivisionCode] ? "☑️" : "⬛️";
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
    const { records, displayingAreaCode, resolution, countryMiddleRegion } = this.state;

    const googleChartsData = this.translateGoogleChartsData(records);

    const options = {
      region: displayingAreaCode,
      resolution,
      legend: "none",
      colorAxis: { colors: ["white", "#EDEDCC", "#CCEDCC"] },
      backgroundColor: "#90C0E0",
    };

    const recordParameter = this.generateRecordParameter(records);
    const url = `${document.domain}?${recordParameter}`;

    const isDisplayWorld = displayingAreaCode === "world";
    const isDisplayCountry = displayingAreaCode in countryMiddleRegion;

    return (
      <div>
        <img src="img/logo.png" alt="Logo" />
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
          data={googleChartsData}
        />
        {!isDisplayWorld && <button onClick={this.goToTopHandler}>Topへ</button>}
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
