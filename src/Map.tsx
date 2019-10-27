import * as React from "react";
import * as queryString from "query-string";
import * as H from "history";
import Chart from "react-google-charts";
import styled from "styled-components";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

import countries from "./data/countries";
import relations from "./data/relations";
import regions from "./data/regions";

const AREA_CODE_WORLD = "world";

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
  selectedPrimaryRegionCode: string;
  selectedSecondaryRegionCode: string;
  selectedCountryCode: string;
  secondaryRegionPrimaryRegionMap: { [key: string]: string };
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
    const secondaryRegionPrimaryRegionMap = this.generateSecondaryRegionPrimaryRegionMap();
    const countrySecondaryRegionMap = this.generateCountrySecondaryRegionMap();
    this.state = {
      displayingAreaCode: AREA_CODE_WORLD,
      resolution: "",
      records,
      lastGoogleChartsData: [],
      selectedPrimaryRegionCode: "",
      selectedSecondaryRegionCode: "",
      selectedCountryCode: "",
      secondaryRegionPrimaryRegionMap,
      countrySecondaryRegionMap,
    };
    const countryCodes = Object.keys(countries).filter(countryCode => countryCode.length === 2);
    countryCodes.map(countryCode => this.recalculationCountryScore(countryCode));
  }

  generateSecondaryRegionPrimaryRegionMap = () => {
    const secondaryRegionPrimaryRegionMap = Object.keys(relations).reduce((o1, primaryRegion) => {
      return Object.keys(relations[primaryRegion]).reduce((o2, secondaryRegion) => {
        return Object.assign(o2, { [secondaryRegion]: primaryRegion });
      }, o1);
    }, {});
    return secondaryRegionPrimaryRegionMap;
  };

  generateCountrySecondaryRegionMap = () => {
    const countrySecondaryRegionMap = Object.keys(relations).reduce((o1, primaryRegion) => {
      return Object.keys(relations[primaryRegion]).reduce((o2, secondaryRegion) => {
        return relations[primaryRegion][secondaryRegion].reduce((o3, country) => {
          return Object.assign(o3, { [country]: secondaryRegion });
        }, o2);
      }, o1);
    }, {});
    return countrySecondaryRegionMap;
  };

  generateCountriesSubdivision = (countryCode: string) => {
    const { records } = this.state;
    const recordArray = Object.entries(records);
    const countriesSubdivision = recordArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    return countriesSubdivision;
  };

  componentDidMount = () => {
    const { records } = this.state;
    const googleChartsData = this.translateGoogleChartsData(records);
    this.setState({ lastGoogleChartsData: googleChartsData });
  };

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
      if (displayingAreaCode === AREA_CODE_WORLD || !areaCode.startsWith(displayingAreaCode)) {
        const score: number = Math.round(areaScore * 1000) / 10;
        append = `${score}%`;
      } else {
        const check = areaScore ? "☑️" : "⬛️";
        append = check;
      }
      return [...record, `${displayAreaName} ${append}`];
    });
    const googleChartsData = [
      ["Country", "Value", { role: "tooltip", p: { html: true } }],
      ...googleChartsDataNoHeader,
    ];
    return googleChartsData;
  };

  getParametersLastRecords = (): IRecords | null => {
    const getParams = queryString.parse(this.props.location.search);
    if (!getParams.records || getParams.records instanceof Array) {
      return null;
    }
    const paramsRecords: string = getParams.records;
    const records = this.decompressRecords(paramsRecords);
    return records;
  };

  decompressRecords = (compressed: string): IRecords => {
    const recordsString = decompressFromEncodedURIComponent(compressed);
    const countryDataArray = recordsString.split(";");
    const records = countryDataArray.reduce((o: IRecords, c) => {
      const splittedCompnayAndSubdivision = c.split(":");
      const countryCode = splittedCompnayAndSubdivision[0];
      const subdivisionCodesWithoutCountryCode = splittedCompnayAndSubdivision[1].split(",");
      const subdivisionRecords = subdivisionCodesWithoutCountryCode.reduce(
        (tmpSubdivisonRecords, subdivisionCodeWithoutCountryCode) => {
          return Object.assign(tmpSubdivisonRecords, { [`${countryCode}-${subdivisionCodeWithoutCountryCode}`]: 1 });
        },
        {}
      );
      return Object.assign(o, subdivisionRecords);
    }, {});
    return records;
  };

  selectAreaOnMapHandler = ({ chartWrapper }: any) => {
    const {
      lastGoogleChartsData,
      displayingAreaCode,
      secondaryRegionPrimaryRegionMap,
      countrySecondaryRegionMap,
    } = this.state;

    const chart = chartWrapper.getChart();
    const selection = chart.getSelection();
    const selectedAreaIndex = selection[0].row + 1;
    const selectedAreaCode = lastGoogleChartsData[selectedAreaIndex][0];

    if (displayingAreaCode === AREA_CODE_WORLD || !selectedAreaCode.startsWith(displayingAreaCode)) {
      this.choiseCountry(selectedAreaCode);
      const secondaryRegionCode = countrySecondaryRegionMap[selectedAreaCode];
      this.setState({
        selectedPrimaryRegionCode: secondaryRegionPrimaryRegionMap[secondaryRegionCode],
        selectedSecondaryRegionCode: secondaryRegionCode,
      });
      return;
    }

    this.choiseSubdivision(selectedAreaCode);
  };

  generateRecordsParameter = (records: IRecords): string => {
    const recordParams = this.compressRecords(records);
    return `records=${recordParams}`;
  };

  compressRecords = (records: IRecords): string => {
    const visitedSubdivisionCodes = Object.keys(records).filter(subdivisionCode => {
      return subdivisionCode.length !== 2 && records[subdivisionCode] === 1;
    });
    // {countryCode: [subdivisionCode]}のフォーマットに
    // subdivisionCodeからはcountryCodeを除く
    const changedFormat = visitedSubdivisionCodes.reduce((o: { [key: string]: Array<string> }, subdivisionCode) => {
      const splitedSubdivisionCode = subdivisionCode.split("-");
      const countryCode = splitedSubdivisionCode[0];
      const existed = countryCode in o ? o[countryCode] : [];
      existed.push(splitedSubdivisionCode[1]);
      return Object.assign(o, { [countryCode]: existed });
    }, {});

    // countryCode(CC),subdivisionCode(SC)を、CC:SC,SC;CC:SC,SC;...のフォーマットの文字列に変換
    let formatted = Object.keys(changedFormat).reduce((s, countryCode) => {
      const countriesFormatted = `${countryCode}:${changedFormat[countryCode].join(",")};`;
      return `${s}${countriesFormatted}`;
    }, "");
    formatted = formatted.replace(/;$/g, "");

    const compressed = compressToEncodedURIComponent(formatted);
    return compressed;
  };

  goToWorldHandler = () => {
    this.setState({
      displayingAreaCode: AREA_CODE_WORLD,
      resolution: "",
      selectedPrimaryRegionCode: "",
      selectedSecondaryRegionCode: "",
      selectedCountryCode: "",
    });
  };

  onClickPrimaryRegionHandler = (primaryRegionCode: string) => {
    this.setState({
      displayingAreaCode: primaryRegionCode,
      selectedPrimaryRegionCode: primaryRegionCode,
      selectedSecondaryRegionCode: "",
      selectedCountryCode: "",
      resolution: "",
    });
  };

  onClickSecondaryRegionHandler = (secondaryRegionCode: string) => {
    this.setState({
      displayingAreaCode: secondaryRegionCode,
      selectedSecondaryRegionCode: secondaryRegionCode,
      resolution: "",
    });
  };

  onClickCountryHandler = (countryCode: string) => {
    this.choiseCountry(countryCode);
  };

  choiseCountry = (countryCode: string) => {
    const { records } = this.state;
    const countriesSubdivisions = this.generateCountriesSubdivision(countryCode);
    // 行政区がある場合
    if (0 < countriesSubdivisions.length) {
      this.setState({
        displayingAreaCode: countryCode,
        selectedCountryCode: countryCode,
        resolution: "provinces",
      });
      return;
    }

    records[countryCode] = records[countryCode] ? 0 : 1;
    this.setState({ records });
  };

  onClickSubdivisionHandler = (subdivisionCode: string) => {
    this.choiseSubdivision(subdivisionCode);
  };

  choiseSubdivision = (subdivisionCode: string) => {
    const { records } = this.state;
    records[subdivisionCode] = records[subdivisionCode] ? 0 : 1;
    this.setState({ records });

    const countryCode: string = subdivisionCode.split("-")[0];
    this.recalculationCountryScore(countryCode);
  };

  recalculationCountryScore = (countryCode: string) => {
    const { records } = this.state;
    const countriesSubdivisions = this.generateCountriesSubdivision(countryCode);
    const visitedCountriesSubdivisions = countriesSubdivisions.filter(areaData => areaData[1]);
    const countryScore: number =
      Math.round((visitedCountriesSubdivisions.length / countriesSubdivisions.length) * 1000) / 1000 || 0;
    records[countryCode] = countryScore;

    this.setState({ records });
  };

  WorldSelector = () => (
    <WorldSelectorWrapper onClick={this.goToWorldHandler}>
      <div>WORLD</div>
    </WorldSelectorWrapper>
  );

  PrimaryRegionSelector = (props: primaryRegionSelectorProps) => {
    const { primaryRegionCode } = props;
    return (
      <PrimaryRegionSelectorWrapper onClick={() => this.onClickPrimaryRegionHandler(primaryRegionCode)}>
        <div>{regions[primaryRegionCode]}</div>
      </PrimaryRegionSelectorWrapper>
    );
  };

  SecondaryRegionSelector = (props: SecondaryRegionSelectorProps) => {
    const { secondaryRegionCode } = props;
    return (
      <SecondaryRegionSelectorWrapper onClick={() => this.onClickSecondaryRegionHandler(secondaryRegionCode)}>
        <div>{regions[secondaryRegionCode]}</div>
      </SecondaryRegionSelectorWrapper>
    );
  };

  CountrySelector = (props: CountrySelectorProps) => {
    const { countryCode } = props;
    const countryName = countries[countryCode][0];
    const countryNameSub = countries[countryCode][1];
    const { records } = this.state;
    const score: number = Math.round(records[countryCode] * 1000) / 10;
    return (
      <CountrySelectorWrapper onClick={() => this.onClickCountryHandler(countryCode)}>
        <div>
          {countryName} ({countryNameSub}): {score}%
        </div>
      </CountrySelectorWrapper>
    );
  };

  SubdivisionSelector = (props: SubdivisionSelectorProps) => {
    const { records } = this.state;
    const { subdivisionCode, subdivisionName, subdivisionNameSub } = props;
    const displayingSubdivisionNameSub = subdivisionNameSub ? `(${subdivisionNameSub})` : "";
    const check = records[subdivisionCode] ? "☑️" : "⬛️";
    return (
      <SubdivisionSelectorWrapper onClick={() => this.onClickSubdivisionHandler(subdivisionCode)}>
        <div>
          <span>
            {subdivisionCode}: {subdivisionName} {displayingSubdivisionNameSub}
          </span>
          <SubdivisionCheck>{check}</SubdivisionCheck>
        </div>
      </SubdivisionSelectorWrapper>
    );
  };

  PrimaryRegionSelectorList = () => {
    return (
      <div>
        {Object.keys(relations).map((primaryRegionCode, i) => {
          const isDisplay: boolean =
            AREA_CODE_WORLD === this.state.displayingAreaCode ||
            primaryRegionCode === this.state.selectedPrimaryRegionCode;
          if (isDisplay) {
            return <this.PrimaryRegionSelector primaryRegionCode={primaryRegionCode} key={i} />;
          }
        })}
      </div>
    );
  };

  SecondaryRegionSelectorList = () => {
    if (!this.state.selectedPrimaryRegionCode) {
      return null;
    }
    const secondaryRegions = relations[this.state.selectedPrimaryRegionCode];
    return (
      <div>
        {Object.keys(secondaryRegions).map((secondaryRegionCode, i) => {
          const isDisplay: boolean =
            this.state.displayingAreaCode in relations ||
            secondaryRegionCode === this.state.selectedSecondaryRegionCode;
          if (isDisplay) {
            return <this.SecondaryRegionSelector secondaryRegionCode={secondaryRegionCode} key={i} />;
          }
        })}
      </div>
    );
  };

  CountrySelectorList = () => {
    if (!this.state.selectedSecondaryRegionCode) {
      return null;
    }
    const _countries = relations[this.state.selectedPrimaryRegionCode][this.state.selectedSecondaryRegionCode];
    return (
      <div>
        {_countries.map((countryCode, i) => {
          const isDisplay: boolean =
            this.state.displayingAreaCode in relations[this.state.selectedPrimaryRegionCode] ||
            countryCode === this.state.selectedCountryCode;
          if (isDisplay) {
            return <this.CountrySelector countryCode={countryCode} key={i} />;
          }
        })}
      </div>
    );
  };

  SubdivisionSelectorList = () => {
    const isDisplay: boolean = this.state.displayingAreaCode in countries;
    if (!isDisplay) {
      return null;
    }
    const countriesArray = Object.entries(countries);
    const countryCode = this.state.displayingAreaCode;
    const subdivisions = countriesArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
    return (
      <SubdivisionSelectorListWrapper>
        {subdivisions.map((subdivision, i) => {
          const subdivisionCode = subdivision[0];
          const subdivisionName = subdivision[1][0];
          const subdivisionNameSub = subdivision[1][1];
          return (
            <this.SubdivisionSelector
              subdivisionCode={subdivisionCode}
              subdivisionName={subdivisionName}
              subdivisionNameSub={subdivisionNameSub}
              key={i}
            />
          );
        })}
      </SubdivisionSelectorListWrapper>
    );
  };

  render() {
    const { records, displayingAreaCode, resolution } = this.state;

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

    return (
      <TopContainer>
        <ControllerContainer>
          <img src="img/logo.png" alt="Logo" />
          <UrlCopy type="text" value={url} readOnly />
          <AreaListContainer>
            <this.WorldSelector />
            <this.PrimaryRegionSelectorList />
            <this.SecondaryRegionSelectorList />
            <this.CountrySelectorList />
            <this.SubdivisionSelectorList />
          </AreaListContainer>
        </ControllerContainer>
        <MapContainer>
          <Chart
            chartEvents={[
              {
                eventName: "select",
                callback: this.selectAreaOnMapHandler,
              },
            ]}
            chartType="GeoChart"
            height={`${window.innerHeight}px`}
            width={`${window.innerWidth - 300}px`}
            options={options}
            data={googleChartsData}
          />
        </MapContainer>
      </TopContainer>
    );
  }
}

const TopContainer = styled.div`
  display: flex;
`;

const MapContainer = styled.div``;

const ControllerContainer = styled.div``;

const AreaListContainer = styled.div``;

const AreaSelectorButton = styled.div`
  width: 300px;
  cursor: pointer;
`;

const WorldSelectorWrapper = styled(AreaSelectorButton)`
  background-color: #edbccc;
  border: 1px solid #ddacbc
  text-align: center;
`;

const PrimaryRegionSelectorWrapper = styled(AreaSelectorButton)`
  background-color: #edcccc;
  border: 1px solid #ddbcbc
  text-align: center;
`;

const SecondaryRegionSelectorWrapper = styled(AreaSelectorButton)`
  background-color: #edddcc;
  border: 1px solid #ddcdbc;
  text-align: center;
`;

const CountrySelectorWrapper = styled(AreaSelectorButton)`
  background-color: #ededcc;
  border: 1px solid #ddddbc;
`;

const SubdivisionSelectorWrapper = styled(AreaSelectorButton)`
  background-color: #edfdcc;
  border: 1px solid #ddedbc;
`;

const SubdivisionSelectorListWrapper = styled.div`
  height: ${window.innerHeight - 90}px;
  overflow: scroll;
`;

const UrlCopy = styled.input`
  width: 296px;
`;

const SubdivisionCheck = styled.span`
  float: right;
`;

interface primaryRegionSelectorProps {
  primaryRegionCode: string;
}

interface SecondaryRegionSelectorProps {
  secondaryRegionCode: string;
}

interface CountrySelectorProps {
  countryCode: string;
}

interface SubdivisionSelectorProps {
  subdivisionCode: string;
  subdivisionName: string;
  subdivisionNameSub: string;
}

export default Map;
