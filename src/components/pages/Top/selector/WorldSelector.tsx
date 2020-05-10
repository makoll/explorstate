import React, { useContext } from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';
import { ActionType, AppContext } from '@/components/pages/Top';

const WorldSelector: React.FC = () => {
  const { dispatch } = useContext(AppContext);
  const goToWorldHandler = () => {
    dispatch({
      type: ActionType.CHOICE_WORLD,
    });
  };

  return (
    <Wrapper onClick={goToWorldHandler}>
      <div>WORLD</div>
    </Wrapper>
  );
};

const Wrapper = styled(AreaButton)`
  background-color: #edbccc;
  border: 1px solid #ddacbc;
  text-align: center;
`;

export default WorldSelector;
