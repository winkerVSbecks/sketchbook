import React from 'react';
import { Container, Box } from 'rebass';
import Keyboard from '../components/Keyboard';
import Toolbar from '../components/Toolbar';
import Footer from '../components/Footer';

class App extends React.Component {
  navigate = ({ forward } = { forward: true }) => {
    const { location, routes, history } = this.props;
    const index = routes.findIndex(
      route => route.path.toLowerCase() === location.pathname.toLowerCase(),
    );

    const next = forward
      ? index === routes.length - 1
        ? routes[0]
        : routes[index + 1]
      : index === 0
        ? routes[routes.length - 1]
        : routes[index - 1];

    history.push(next.path);
  };

  render() {
    const { location, render, routes } = this.props;

    const route = routes.find(
      route => route.path.toLowerCase() === location.pathname.toLowerCase(),
    );

    return (
      <Box bg="black">
        <Container
          pt={5}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Toolbar
            name={route.name}
            onLeft={() => this.navigate({ forward: false })}
            onRight={() => this.navigate()}
          />
          <Keyboard
            onLeft={() => this.navigate({ forward: false })}
            onRight={() => this.navigate()}
          />
          <Box flex="1 1 auto">{render({ routes })}</Box>
          <Footer />
        </Container>
      </Box>
    );
  }
}

export default App;
