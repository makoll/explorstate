import React from 'react';
import styled from 'styled-components';

const AreaCheck: React.FC<{ isCheck: boolean }> = ({ isCheck }) => {
  const check = isCheck ? '☑️' : '⬛️';
  return <AreaCheckWrapper>{check}</AreaCheckWrapper>;
};

const AreaCheckWrapper = styled.span`
  float: right;
`;

export default AreaCheck;
