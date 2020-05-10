import React, { useContext } from 'react';
import styled from 'styled-components';

import { generateRecordsParameter } from './data/Generator';

import { AppContext } from '@/components/pages/Top';

const UrlCopy: React.FC = () => {
  const { state } = useContext(AppContext);
  const { records } = state;
  const recordsParameter = generateRecordsParameter(records);
  const url = `${document.domain}?${recordsParameter}`;
  return <Input type='text' value={url} readOnly />;
};

const Input = styled.input`
  width: 296px;
`;

export default UrlCopy;
