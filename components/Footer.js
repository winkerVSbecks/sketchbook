import React from 'react';
import { Flex, Box, ButtonTransparent } from 'rebass';

const Footer = () => (
  <Flex mt={5} py={4} alignItems="flex-end" justifyContent="flex-end">
    <ButtonTransparent
      is="a"
      color="white"
      href="https://github.com/winkerVSbecks/sketchbook"
      mr={3}
    >
      GitHub
    </ButtonTransparent>
    <ButtonTransparent is="a" color="white" href="https://varun.ca">
      Varun Vachhar
    </ButtonTransparent>
  </Flex>
);

export default Footer;
