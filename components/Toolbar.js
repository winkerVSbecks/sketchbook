import React from 'react';
import {
  Toolbar,
  NavLink,
  Heading,
  Box,
  Caps,
  ButtonTransparent,
} from 'rebass';
import { Arrow } from 'reline';
import { Link } from 'react-router-dom';

export default ({ name, onLeft, onRight }) => (
  <Toolbar px={0} mb={5}>
    <NavLink is={Link} px={0} to="/">
      <Caps fontWeight="bold">sketchbook</Caps>
    </NavLink>
    <Box mx="auto" />
    <NavLink px={4}>{name === 'index' ? '' : name}</NavLink>
    <ButtonTransparent
      onClick={onLeft}
      focus={{
        outline: 'none',
        boxShadow: 'none',
        color: 'red',
      }}
    >
      <Arrow left />
    </ButtonTransparent>
    <ButtonTransparent
      onClick={onRight}
      focus={{
        outline: 'none',
        boxShadow: 'none',
        color: 'red',
      }}
    >
      <Arrow />
    </ButtonTransparent>
  </Toolbar>
);
