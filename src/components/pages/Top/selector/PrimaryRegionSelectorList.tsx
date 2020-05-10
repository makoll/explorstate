import React, { useContext } from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';
import regions from '@/data/regions';
import relations from '@/data/relations';
import { ActionType, AppContext } from '@/components/pages/Top';

const PrimaryRegionSelectorList: React.FC = () => {
  const { state } = useContext(AppContext);
  const { selectedPrimaryRegionCode } = state;

  let primaryRegions;
  if (selectedPrimaryRegionCode) {
    primaryRegions = {
      [selectedPrimaryRegionCode]: relations[selectedPrimaryRegionCode],
    };
  } else {
    primaryRegions = relations;
  }

  return (
    <div>
      {Object.keys(primaryRegions).map((primaryRegionCode, i) => (
        <PrimaryRegionSelector primaryRegionCode={primaryRegionCode} key={i} />
      ))}
    </div>
  );
};

const PrimaryRegionSelector: React.FC<{
  primaryRegionCode: string;
}> = ({ primaryRegionCode }) => {
  const { dispatch } = useContext(AppContext);

  const onClickPrimaryRegionHandler = () => {
    dispatch({
      type: ActionType.CHOICE_PRIMARY_REGION,
      payload: {
        primaryRegionCode,
      },
    });
  };

  return (
    <PrimaryRegionSelectorWrapper onClick={onClickPrimaryRegionHandler}>
      <div>{regions[primaryRegionCode]}</div>
    </PrimaryRegionSelectorWrapper>
  );
};

const PrimaryRegionSelectorWrapper = styled(AreaButton)`
  background-color: #edcccc;
  border: 1px solid #ddbcbc;
  text-align: center;
`;

export default PrimaryRegionSelectorList;
