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
  selectedSecondaryRegion: string;
  countrySecondaryRegionMap: { [key: string]: string };
}

const getInitRecords = (): IRecords => {
  const records = Object.keys(countries).reduce((obj, areaCode) => Object.assign(obj, { [areaCode]: 0 }), {});
  return records;
};

class Map extends React.Component<OuterProps, AppState> {
  constructor(props: OuterProps) {
    super(props);
    const records: IRecords = Object.assign(getInitRecords(), this.getParametersLastRecords());
    const countrySecondaryRegionMap = this.generateCountrySecondaryRegionMap();
    this.state = {
      displayingAreaCode: "world",
      resolution: "",
      records,
      lastGoogleChartsData: [],
      selectedSecondaryRegion: "",
      countrySecondaryRegionMap,
    };
  }

  generateCountrySecondaryRegionMap = () => {
    const countrySecondaryRegionMap = Object.keys(relations).reduce((o1, primaryRegion) => {
      return Object.keys(relations[primaryRegion]).reduce((o2, SecondaryRegion) => {
        return relations[primaryRegion][SecondaryRegion].reduce((o3, country) => {
          return Object.assign(o3, { [country]: SecondaryRegion })
        }, o2)
      }, o1);
    }, {});
    return countrySecondaryRegionMap
  }

  generateCountriesSubdivision = (countryCode: string) => {
    const { records } = this.state;
    const recordArray = Object.entries(records);
    const countriesSubdivision = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    return countriesSubdivision;
  }

  componentDidMount = () => {
    const { records } = this.state;
    const googleChartsData = this.translateGoogleChartsData(records);
    this.setState({ lastGoogleChartsData: googleChartsData });
  }

  translateGoogleChartsData = (records: IRecords): Array<any> => {
    const googleChartsDataNoHeader = Object.entries(records).map(record => {
      const { displayingAreaCode } = this.state;
      const areaCode = record[0];
      const areaScore = record[1];
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
      return [...record, `${displayAreaName} ${append}`];
    });
    const googleChartsData = [["Country", "Value", { role: "tooltip", p: { html: true } }], ...googleChartsDataNoHeader];
    return googleChartsData;
  };

  getParametersLastRecords = (): IRecords | null => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.records) {
      return null;
    }
    const recordsString = typeof getParams.records === "string" ? getParams.records : "";
    const records = JSON.parse(recordsString);
    return records
  };

  onClickAreaNameHandler = (e: React.MouseEvent, countryCode: string) => {
    this.choiseCountry(countryCode);
    e.stopPropagation();
  };

  selectAreaOnMapHandler = ({ chartWrapper }: any) => {
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

    this.choiseSubdivision(selectedAreaCode);
  };

  choiseCountry = (countryCode: string) => {
    const { records } = this.state;
    const countriesSubdivisions = this.generateCountriesSubdivision(countryCode);
    // 行政区がある場合
    if (0 < countriesSubdivisions.length) {
      this.setState({
        displayingAreaCode: countryCode,
        resolution: "provinces",
      });
      return;
    }

    records[countryCode] = records[countryCode] ? 0 : 1;
    this.setState({ records });
  };

  choiseSubdivision = (subdivisionCode: string) => {
    const { records } = this.state;
    records[subdivisionCode] = records[subdivisionCode] ? 0 : 1;

    const countryCode: string = subdivisionCode.split("-")[0];
    const countriesSubdivisions = this.generateCountriesSubdivision(countryCode);
    const visitedCountriesSubdivisions = countriesSubdivisions.filter(areaData => areaData[1]);
    const countryScore: number = Math.round((visitedCountriesSubdivisions.length / countriesSubdivisions.length) * 1000) / 1000;
    records[countryCode] = countryScore;

    this.setState({ records });
  };

  generateRecordsParameter = (records: IRecords): string => {
    const hasValueRecordsArray: Array<any> = Object.entries(records).filter(m => 0 < m[1]);
    const hasValueRecords = hasValueRecordsArray.reduce((obj, data) => ({ ...obj, [data[0]]: data[1] }), {});
    return `records=${JSON.stringify(hasValueRecords)}`;
  }

  goToWorldHandler = () => {
    this.setState({
      displayingAreaCode: "world",
      resolution: "",
    });
  };

  goToSecondaryRegionHandler = () => {
    const { displayingAreaCode, countrySecondaryRegionMap } = this.state;
    this.setState({
      displayingAreaCode: regions[countrySecondaryRegionMap[displayingAreaCode]],
      resolution: "",
    });
  }

  onClickPrimaryRegionHandler = (primaryRegionCode: string) => {
    const displayingAreaCode: string = regions[primaryRegionCode];
    const resolution = "";
    this.setState({ displayingAreaCode, resolution });
  };

  onClickSecondaryRegionHandler = (e: React.MouseEvent, SecondaryRegionCode: string) => {
    const selectedSecondaryRegion = SecondaryRegionCode === this.state.selectedSecondaryRegion ? "" : SecondaryRegionCode;
    const displayingAreaCode: string = regions[SecondaryRegionCode];
    const resolution = "";
    this.setState({ selectedSecondaryRegion, displayingAreaCode, resolution });
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
          const primaryRegionCode = relation[0];
          const primaryRegionRelations = relation[1];
          return (
            <this.primaryRegion
              primaryRegionCode={primaryRegionCode}
              primaryRegionRelations={primaryRegionRelations}
              key={i}
            />
          );
        })}
      </CountriesListWrapper>
    )
  };

  primaryRegion = (props: primaryRegionProps) => {
    const {
      primaryRegionCode,
      primaryRegionRelations,
    } = props;
    return (
      <PrimaryRegionWrapper onClick={() => this.onClickPrimaryRegionHandler(primaryRegionCode)}>
        <div>{primaryRegionCode}</div>
        {Object.entries(primaryRegionRelations).map((secondaryRegion, i) => {
          const SecondaryRegionCode = secondaryRegion[0];
          const SecondaryRegionCountries = secondaryRegion[1];
          return (
            <this.SecondaryRegion
              SecondaryRegionCode={SecondaryRegionCode}
              SecondaryRegionCountries={SecondaryRegionCountries}
              key={i}
            />
          );
        })}
      </PrimaryRegionWrapper>
    )
  };

  SecondaryRegion = (props: SecondaryRegionProps) => {
    const {
      SecondaryRegionCode,
      SecondaryRegionCountries,
    } = props;
    return (
      <SecondaryRegionWrapper onClick={(e) => this.onClickSecondaryRegionHandler(e, SecondaryRegionCode)}>
        <div>{SecondaryRegionCode}</div>
        {SecondaryRegionCountries.map((countryCode, i) => {
          const countryName = countries[countryCode];
          if (!countryName) {
            return null;
          }
          const isDisplay: boolean = this.state.selectedSecondaryRegion === SecondaryRegionCode;
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
      </SecondaryRegionWrapper>
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
    const countriesArray = Object.entries(countries);
    const countryCode = this.state.displayingAreaCode;
    const subdivisions = countriesArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
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
    const { records, displayingAreaCode, resolution, countrySecondaryRegionMap } = this.state;

    const googleChartsData = this.translateGoogleChartsData(records);

    const options = {
      region: displayingAreaCode,
      resolution,
      legend: "none",
      colorAxis: { colors: ["white", "#EDEDCC", "#CCEDCC"] },
      backgroundColor: "#90C0E0",
    };

    const recordsParameter = this.generateRecordsParameter(records);
    const url = `${document.domain}?${recordsParameter}`;

    const isDisplayWorld = displayingAreaCode === "world";
    const isDisplayCountry = displayingAreaCode in countrySecondaryRegionMap;

    return (
      <div>
        <img src="img/logo.png" alt="Logo" />
        <Chart
          chartEvents={[
            {
              eventName: "select",
              callback: this.selectAreaOnMapHandler,
            },
          ]}
          chartType="GeoChart"
          width="100%"
          height="600px"
          options={options}
          data={googleChartsData}
        />
        {!isDisplayWorld && <button onClick={this.goToWorldHandler}>世界地図表示</button>}
        {isDisplayCountry && <button onClick={this.goToSecondaryRegionHandler}>広域へ</button>}
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

const PrimaryRegionWrapper = styled.div`
  background-color: #edcccc;
  border: 1px solid #ddbcbc
  border-right: 0px;
  width: 300px;
  height: 100%;
`;

const SecondaryRegionWrapper = styled.div`
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

interface primaryRegionProps {
  primaryRegionCode: string;
  primaryRegionRelations: { [key: string]: Array<string> };
}

interface SecondaryRegionProps {
  SecondaryRegionCode: string;
  SecondaryRegionCountries: Array<string>;
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
