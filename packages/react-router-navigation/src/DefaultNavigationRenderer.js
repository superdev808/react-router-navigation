import * as React from 'react'
import { NativeModules } from 'react-native'
import {
  Transitioner,
  CardStack,
  StackRouter,
  NavigationActions,
  addNavigationHelpers,
} from 'react-navigation'
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator'
import TransitionConfigs from 'react-navigation/src/views/CardStack/TransitionConfigs'

const NativeAnimatedModule = NativeModules && NativeModules.NativeAnimatedModule

class DefaultNavigationRenderer extends React.Component {
  constructor(props) {
    super(props)
    this.state = { router: this.getRouter(props) }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.cards !== nextProps.cards) {
      this.setState({ router: this.getRouter(nextProps) })
    }
  }

  getRouter = props => {
    const { renderHeader, cards } = props
    const routeConfigMap = cards.reduce((acc, card) => {
      return {
        ...acc,
        [card.path]: {
          screen: this.getScreenComponent(card),
          navigationOptions: {
            ...props,
            ...card,
            header: sceneProps => {
              return renderHeader({ ...props, ...sceneProps })
            },
          },
        },
      }
    }, {})
    return StackRouter(routeConfigMap)
  }

  getScreenComponent = () => {
    return this.renderScreenComponent
  }

  renderScreenComponent = ({ navigation }) => {
    const { renderCard } = this.props
    const { state: route } = navigation
    return renderCard(route)
  }

  configureTransition = (transitionProps, prevTransitionProps) => {
    const isModal = this.props.mode === 'modal'
    const transitionSpec = {
      ...TransitionConfigs.getTransitionConfig(
        undefined,
        transitionProps,
        prevTransitionProps,
        isModal,
      ).transitionSpec,
    }
    if (
      !!NativeAnimatedModule &&
      CardStackStyleInterpolator.canUseNativeDriver()
    ) {
      transitionSpec.useNativeDriver = true
    }
    return transitionSpec
  }

  renderStack = (props, prevProps) => {
    const { cards } = this.props
    const { router } = this.state
    const {
      scene: { route },
    } = props
    const cardStackProps = cards.find(card => card.path === route.routeName)
    const {
      screenProps,
      headerMode,
      headerTransitionPreset,
      mode,
      cardStyle,
      transitionConfig,
    } = cardStackProps
    return (
      <CardStack
        screenProps={screenProps}
        headerMode={headerMode}
        headerTransitionPreset={headerTransitionPreset}
        mode={mode}
        router={router}
        cardStyle={cardStyle}
        transitionConfig={transitionConfig}
        transitionProps={props}
        prevTransitionProps={prevProps}
      />
    )
  }

  render() {
    const { cards, navigationState, onNavigateBack } = this.props
    const route = navigationState.routes[navigationState.index]
    const transitionerProps = cards.find(card => card.path === route.routeName)
    const {
      configureTransition,
      onTransitionStart,
      onTransitionEnd,
    } = transitionerProps
    return (
      <Transitioner
        render={this.renderStack}
        configureTransition={configureTransition || this.configureTransition}
        onTransitionStart={onTransitionStart}
        onTransitionEnd={onTransitionEnd}
        navigation={addNavigationHelpers({
          state: navigationState,
          addListener: () => ({}),
          dispatch: action => {
            if (action.type === NavigationActions.back().type) {
              onNavigateBack()
            }
          },
        })}
      />
    )
  }
}

export default DefaultNavigationRenderer
