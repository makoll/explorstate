import React from 'react';
import styled from 'styled-components';

import AreaButton from '@/components/atoms/AreaButton';

type Props = {
  onClick: () => void;
};

const WorldSelector: React.FC<Props> = ({ onClick }) => {
  return (
    <Wrapper onClick={onClick}>
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
