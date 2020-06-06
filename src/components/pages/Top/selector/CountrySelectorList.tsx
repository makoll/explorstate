import React, { useContext } from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';
import AreaCheck from '@/components/atoms/AreaCheck';
import countries from '@/data/countries';
import flags from '@/data/flags';
import relations from '@/data/relations';
import { ActionType, AppContext } from '@/components/pages/Top';

const CountrySelectorList: React.FC = () => {
  const { state } = useContext(AppContext);
  const { selectedPrimaryRegionCode, selectedSecondaryRegionCode, selectedCountryCode } = state;

  if (!selectedSecondaryRegionCode) {
    return null;
  }

  let countries;
  if (selectedCountryCode) {
    countries = [selectedCountryCode];
  } else {
    countries = relations[selectedPrimaryRegionCode][selectedSecondaryRegionCode];
  }

  return (
    <div>
      {countries.map((countryCode, i) => (
        <CountrySelector countryCode={countryCode} key={i} />
      ))}
    </div>
  );
};

const CountrySelector: React.FC<{ countryCode: string }> = ({ countryCode }) => {
  const { state, dispatch } = useContext(AppContext);
  const { records } = state;
  const countryName = countries[countryCode][0];
  const countryNameSub = countries[countryCode][1];
  const countriesArray = Object.entries(countries);
  const flag = flags[countryCode];

  const subdivisions = countriesArray.filter(areaData => areaData[0].startsWith(`${countryCode}-`));
  let countrySuffix;
  if (0 === subdivisions.length) {
    const isCheck = Boolean(records[countryCode]);
    countrySuffix = <AreaCheck isCheck={isCheck} />;
  } else {
    const score: number = Math.round(records[countryCode] * 1000) / 10;
    countrySuffix = <AreaScore score={score} />;
  }

  const onClickCountryHandler = () => {
    dispatch({
      type: ActionType.CHOICE_COUNTRY,
      payload: { countryCode },
    });
  };

  return (
    <CountrySelectorWrapper onClick={onClickCountryHandler}>
      <span>
        {flag}
        {countryName} ({countryNameSub}) {countrySuffix}
      </span>
    </CountrySelectorWrapper>
  );
};

const CountrySelectorWrapper = styled(AreaButton)`
  background-color: #ededcc;
  border: 1px solid #ddddbc;
`;

const AreaScore: React.FC<{ score: number }> = ({ score }) => {
  return <AreaScoreWrapper>{score}%</AreaScoreWrapper>;
};

const AreaScoreWrapper = styled.span`
  float: right;
`;

export default CountrySelectorList;
