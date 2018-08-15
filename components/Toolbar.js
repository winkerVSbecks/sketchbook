import React from 'react';
import { Toolbar, NavLink, Text, Box, Caps } from 'rebass';
import { Arrow } from 'reline';

export default ({ name, onLeft, onRight, onHome }) => (
  <Toolbar px={0} mb={5}>
    <NavLink px={0} onClick={onHome}>
      <Caps fontWeight="bold">sketchbook</Caps>
    </NavLink>
    <Box mx="auto" />
    <Text fontWeight="bold" fontSize={1} px={4}>
      {name === 'index' ? '' : name}
    </Text>
    <NavLink
      bg="transparent"
      onClick={onLeft}
      focus={{
        outline: 'none',
        boxShadow: 'none',
        color: 'red',
      }}
    >
      <Arrow left />
    </NavLink>
    <NavLink
      bg="transparent"
      onClick={onRight}
      focus={{
        outline: 'none',
        boxShadow: 'none',
        color: 'red',
      }}
    >
      <Arrow />
    </NavLink>
  </Toolbar>
);
