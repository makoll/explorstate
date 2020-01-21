import React from 'react';
import styled from 'styled-components';

import Link from '@/components/atoms/Link'

export const LinkBox: React.FC = () => {
  return (
    <Wrapper>
      <Link href='about.html' target='_blank'>
        About
      </Link>
      <Link href='https://github.com/makoll' target='_blank'>
        Contact
      </Link>
      <Link href='https://github.com/makoll/explorstate' target='_blank'>
        Github
      </Link>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  height: 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
`;

export default LinkBox;
