import React, { Reducer, createContext, useEffect, useReducer } from 'react';
import styled from 'styled-components';

import {
  generateCountriesSubdivision,
  generateCountrySecondaryRegionMap,
  generateInitRecords,
  generateSecondaryRegionPrimaryRegionMap,
  getParametersAreaCode,
  getParametersRecords,
  translateGoogleChartsData,
} from './data/Generator';

import Logo from '@/components/atoms/Logo';
import LinkBox from '@/components/organisms/LinkBox';
import MapView from '@/components/pages/Top/MapView';
import CountrySelectorList from '@/components/pages/Top/selector/CountrySelectorList';
import PrimaryRegionSelectorList from '@/components/pages/Top/selector/PrimaryRegionSelectorList';
import SecondaryRegionSelectorList from '@/components/pages/Top/selector/SecondaryRegionSelectorList';
import SubdivisionSelectorList from '@/components/pages/Top/selector/SubdivisionSelectorList';
import WorldSelector from '@/components/pages/Top/selector/WorldSelector';
import UrlCopy from '@/components/pages/Top/UrlCopy';
import { GoogleChartsData } from '@/types/GoogleChartsData';
import { Records } from '@/types/Records';
import { isCountryCode, isPrimaryRegionCode, isSecondaryRegionCode } from '@/types/AreaCode';

export const AREA_CODE_WORLD = 'world';

interface ContextProps {
  state: State;
  dispatch: React.Dispatch<Actions>;
}

export const AppContext = createContext<ContextProps>({} as ContextProps);

interface State {
  displayingAreaCode: string;
  resolution: string;
  records: Records;
  lastGoogleChartsData: GoogleChartsData[];
  selectedPrimaryRegionCode: string;
  selectedSecondaryRegionCode: string;
  selectedCountryCode: string;
  secondaryRegionPrimaryRegionMap: { [key: string]: string };
  countrySecondaryRegionMap: { [key: string]: string };
}

export enum ActionType {
  CHOICE_WORLD = 'CHOICE_WORLD',
  CHOICE_PRIMARY_REGION = 'CHOICE_PRIMARY_REGION',
  CHOICE_SECONDARY_REGION = 'CHOICE_SECONDARY_REGION',
  CHOICE_COUNTRY = 'CHOICE_COUNTRY',
  CHOICE_SUBDIVISION = 'CHOICE_SUBDIVISION',
}

interface ChoiceWorld {
  type: ActionType.CHOICE_WORLD;
}

interface ChoicePrimaryRegion {
  type: ActionType.CHOICE_PRIMARY_REGION;
  payload: { primaryRegionCode: string };
}

interface ChoiceSecondaryRegion {
  type: ActionType.CHOICE_SECONDARY_REGION;
  payload: { secondaryRegionCode: string };
}

interface ChoiceCountry {
  type: ActionType.CHOICE_COUNTRY;
  payload: { countryCode: string };
}

interface ChoiceSubdivision {
  type: ActionType.CHOICE_SUBDIVISION;
  payload: { subdivisionCode: string };
}

type Actions = ChoicePrimaryRegion | ChoiceSecondaryRegion | ChoiceWorld | ChoiceCountry | ChoiceSubdivision;

const reducer = (state: State, action: Actions) => {
  switch (action.type) {
    case ActionType.CHOICE_WORLD:
      return {
        ...state,
        displayingAreaCode: AREA_CODE_WORLD,
        resolution: '',
        selectedPrimaryRegionCode: '',
        selectedSecondaryRegionCode: '',
        selectedCountryCode: '',
      };
    case ActionType.CHOICE_PRIMARY_REGION: {
      const { primaryRegionCode } = action.payload;

      // 表示中のPrimaryRegionを再度選択した場合
      // WORLDに移動 (上のページに戻るイメージ)
      if (primaryRegionCode === state.selectedPrimaryRegionCode) {
        return {
          ...state,
          displayingAreaCode: AREA_CODE_WORLD,
          resolution: '',
          selectedPrimaryRegionCode: '',
          selectedSecondaryRegionCode: '',
          selectedCountryCode: '',
        };
      }
      // PrimaryRegionに移動
      return {
        ...state,
        displayingAreaCode: primaryRegionCode,
        resolution: '',
        selectedPrimaryRegionCode: primaryRegionCode,
        selectedSecondaryRegionCode: '',
        selectedCountryCode: '',
      };
    }
    case ActionType.CHOICE_SECONDARY_REGION: {
      const { secondaryRegionCode } = action.payload;
      const { secondaryRegionPrimaryRegionMap } = state;
      const selectedPrimaryRegionCode = secondaryRegionPrimaryRegionMap[secondaryRegionCode];

      // 表示中のSecondaryRegionを再度選択した場合
      // PrimaryRegionに移動 (上のページに戻るイメージ)
      if (secondaryRegionCode === state.selectedSecondaryRegionCode) {
        return {
          ...state,
          displayingAreaCode: state.selectedPrimaryRegionCode,
          resolution: '',
          selectedPrimaryRegionCode,
          selectedSecondaryRegionCode: '',
          selectedCountryCode: '',
        };
      }
      // SecondaryRegionに移動
      return {
        ...state,
        displayingAreaCode: secondaryRegionCode,
        resolution: '',
        selectedPrimaryRegionCode,
        selectedSecondaryRegionCode: secondaryRegionCode,
        selectedCountryCode: '',
      };
    }
    case ActionType.CHOICE_COUNTRY: {
      const { countryCode } = action.payload;
      const { secondaryRegionPrimaryRegionMap, countrySecondaryRegionMap, records } = state;
      const countriesSubdivisions = generateCountriesSubdivision(countryCode, records);
      const selectedSecondaryRegionCode = countrySecondaryRegionMap[countryCode];
      const selectedPrimaryRegionCode = secondaryRegionPrimaryRegionMap[selectedSecondaryRegionCode];

      // 行政区がない場合
      // 国自体のチェックを切り替え
      if (countriesSubdivisions.length === 0) {
        records[countryCode] = records[countryCode] ? 0 : 1;
        return {
          ...state,
          displayingAreaCode: selectedSecondaryRegionCode,
          resolution: '',
          records,
          selectedPrimaryRegionCode,
          selectedSecondaryRegionCode,
          selectedCountryCode: '',
        };
      }
      // 表示中の国を再度選択した場合
      // SecondaryRegionに移動 (上のページに戻るイメージ)
      if (countryCode === state.selectedCountryCode) {
        return {
          ...state,
          displayingAreaCode: selectedSecondaryRegionCode,
          resolution: '',
          selectedPrimaryRegionCode,
          selectedSecondaryRegionCode,
          selectedCountryCode: '',
        };
      }
      // 国に移動
      return {
        ...state,
        displayingAreaCode: countryCode,
        resolution: 'provinces',
        selectedPrimaryRegionCode,
        selectedSecondaryRegionCode,
        selectedCountryCode: countryCode,
      };
    }
    case ActionType.CHOICE_SUBDIVISION: {
      const calculationCountryScore = (countryCode: string, records: Records) => {
        const countriesSubdivisions = generateCountriesSubdivision(countryCode, records);
        const visitedCountriesSubdivisions = countriesSubdivisions.filter(areaData => areaData[1]);
        const countryScore: number =
          Math.round((visitedCountriesSubdivisions.length / countriesSubdivisions.length) * 1000) / 1000 || 0;
        records[countryCode] = countryScore;
        return records;
      };

      const { subdivisionCode } = action.payload;
      const { records } = state;
      records[subdivisionCode] = records[subdivisionCode] ? 0 : 1;

      const countryCode: string = subdivisionCode.split('-')[0];
      calculationCountryScore(countryCode, records);

      return { ...state, records };
    }
    default:
      return state;
  }
};

const Top: React.FC = () => {
  const records: Records = Object.assign(generateInitRecords(), getParametersRecords());
  const secondaryRegionPrimaryRegionMap = generateSecondaryRegionPrimaryRegionMap();
  const countrySecondaryRegionMap = generateCountrySecondaryRegionMap();
  const googleChartsData = translateGoogleChartsData('', records);
  const initialState: State = {
    displayingAreaCode: AREA_CODE_WORLD,
    resolution: '',
    records,
    lastGoogleChartsData: googleChartsData,
    selectedPrimaryRegionCode: '',
    selectedSecondaryRegionCode: '',
    selectedCountryCode: '',
    secondaryRegionPrimaryRegionMap,
    countrySecondaryRegionMap,
  };
  const [state, dispatch] = useReducer<Reducer<State, Actions>>(reducer, initialState);

  const displayingAreaCode = getParametersAreaCode();

  useEffect(() => {
    if (isPrimaryRegionCode(displayingAreaCode)) {
      dispatch({
        type: ActionType.CHOICE_PRIMARY_REGION,
        payload: { primaryRegionCode: displayingAreaCode },
      });
    }
    if (isSecondaryRegionCode(displayingAreaCode)) {
      dispatch({
        type: ActionType.CHOICE_SECONDARY_REGION,
        payload: { secondaryRegionCode: displayingAreaCode },
      });
    }
    if (isCountryCode(displayingAreaCode)) {
      dispatch({
        type: ActionType.CHOICE_COUNTRY,
        payload: { countryCode: displayingAreaCode },
      });
    }
  }, [displayingAreaCode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <Wrapper>
        <ControllerContainer>
          <Logo />
          <UrlCopy />
          <AreaListContainer>
            <WorldSelector />
            <PrimaryRegionSelectorList />
            <SecondaryRegionSelectorList />
            <CountrySelectorList />
            <SubdivisionSelectorList />
          </AreaListContainer>
        </ControllerContainer>
        <MapContainer>
          <MapView />
          <LinkBox />
        </MapContainer>
      </Wrapper>
    </AppContext.Provider>
  );
};

const Wrapper = styled.div`
  display: flex;
`;

const MapContainer = styled.div``;

const ControllerContainer = styled.div``;

const AreaListContainer = styled.div``;

export default Top;
