import React, { useContext } from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';
import AreaCheck from '@/components/atoms/AreaCheck';
import countries from '@/data/countries';
import { ActionType, AppContext } from '@/components/pages/Top';

const SubdivisionSelectorList: React.FC = () => {
  const { state } = useContext(AppContext);
  const { selectedCountryCode } = state;

  if (!selectedCountryCode) {
    return null;
  }

  const countriesArray = Object.entries(countries);
  const subdivisions = countriesArray.filter(areaData => areaData[0].startsWith(`${selectedCountryCode}-`));
  return (
    <SubdivisionSelectorListWrapper>
      {subdivisions.map((subdivision, i) => {
        const subdivisionCode = subdivision[0];
        const subdivisionName = subdivision[1][0];
        const subdivisionNameSub = subdivision[1][1];
        return (
          <SubdivisionSelector
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

const SubdivisionSelectorListWrapper = styled.div`
  height: ${window.innerHeight - 90}px;
  overflow: scroll;
`;

const SubdivisionSelector: React.FC<{
  subdivisionCode: string;
  subdivisionName: string;
  subdivisionNameSub: string;
}> = ({ subdivisionCode, subdivisionName, subdivisionNameSub }) => {
  const { state, dispatch } = useContext(AppContext);
  const { records } = state;
  const displayingSubdivisionNameSub = subdivisionNameSub ? `(${subdivisionNameSub})` : '';
  const isCheck = Boolean(records[subdivisionCode]);

  const onClickSubdivisionHandler = () => {
    dispatch({
      type: ActionType.CHOICE_SUBDIVISION,
      payload: { subdivisionCode },
    });
  };

  return (
    <SubdivisionSelectorWrapper onClick={onClickSubdivisionHandler}>
      <span>
        {subdivisionCode}: {subdivisionName} {displayingSubdivisionNameSub}
      </span>
      <AreaCheck isCheck={isCheck} />
    </SubdivisionSelectorWrapper>
  );
};

const SubdivisionSelectorWrapper = styled(AreaButton)`
  background-color: #edfdcc;
  border: 1px solid #ddedbc;
`;

export default SubdivisionSelectorList;
