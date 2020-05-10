import React, { useContext } from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';
import regions from '@/data/regions';
import relations from '@/data/relations';
import { ActionType, AppContext } from '@/components/pages/Top';

const SecondaryRegionSelectorList: React.FC = () => {
  const { state } = useContext(AppContext);
  const { selectedPrimaryRegionCode, selectedSecondaryRegionCode } = state;

  if (!selectedPrimaryRegionCode) {
    return null;
  }

  let secondaryRegions;
  if (selectedSecondaryRegionCode) {
    secondaryRegions = {
      [selectedSecondaryRegionCode]: relations[selectedPrimaryRegionCode][selectedSecondaryRegionCode],
    };
  } else {
    secondaryRegions = relations[selectedPrimaryRegionCode];
  }

  return (
    <div>
      {Object.keys(secondaryRegions).map((secondaryRegionCode, i) => (
        <SecondaryRegionSelector secondaryRegionCode={secondaryRegionCode} key={i} />
      ))}
    </div>
  );
};

const SecondaryRegionSelector: React.FC<{
  secondaryRegionCode: string;
}> = ({ secondaryRegionCode }) => {
  const { dispatch } = useContext(AppContext);

  const onClickSecondaryRegionHandler = () => {
    dispatch({
      type: ActionType.CHOICE_SECONDARY_REGION,
      payload: {
        secondaryRegionCode,
      },
    });
  };

  return (
    <SecondaryRegionSelectorWrapper onClick={onClickSecondaryRegionHandler}>
      <div>{regions[secondaryRegionCode]}</div>
    </SecondaryRegionSelectorWrapper>
  );
};

const SecondaryRegionSelectorWrapper = styled(AreaButton)`
  background-color: #edddcc;
  border: 1px solid #ddcdbc;
  text-align: center;
`;

export default SecondaryRegionSelectorList;
