import React from 'react';
import styled from 'styled-components';

type Props = {
  recordsParameter: string;
};

const UrlCopy: React.FC<Props> = ({ recordsParameter }) => {
  const url = `${document.domain}?${recordsParameter}`;
  return <Input type='text' value={url} readOnly />;
};

const Input = styled.input`
  width: 296px;
`;

export default UrlCopy;
