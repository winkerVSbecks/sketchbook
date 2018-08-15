import React from 'react';
import { BlockLink, Banner, Heading, Flex } from 'rebass';

export default ({ routes, goTo }) => (
  <Flex flexWrap="wrap" mx={-2}>
    {routes.filter(route => route.name !== 'index').map(route => (
      <BlockLink
        px={2}
        py={2}
        width={[1, 1 / 2, 1 / 3]}
        key={route.name}
        color="white"
        onClick={() => goTo(route.name)}
      >
        <Banner color="white" backgroundImage={route.featured} minHeight="25vh">
          <Heading
            bg="rgba(0, 0, 0, 0.75)"
            color="dark-gray"
            px={3}
            py={2}
            fontSize={3}
          >
            {route.name}
          </Heading>
        </Banner>
      </BlockLink>
    ))}
  </Flex>
);
