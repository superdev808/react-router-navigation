/* @flow */

import React, { PropTypes, Component } from 'react'
import { BackAndroid, NavigationExperimental } from 'react-native'
import _ from 'lodash'
import { matchPattern } from 'react-router'
import type { NavigationState, NavigationTransitionProps } from 'react-native/Libraries/NavigationExperimental/NavigationTypeDefinition'
import type { Cards, CardProps } from './CardTypeDefinitions'
import type { Match, History } from './HistoryTypeDefinitions'
import { getCurrentRoute, buildCards, normalizeRoute, getCleanedHistory } from './utils'

const {
  Transitioner: NavigationTransitioner,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental

type Props = {
  children: Array<React$Element<CardProps>>,
  render: (
    props: NavigationTransitionProps & {
      cards: Cards,
      onNavigateBack: Function,
    }) => React$Element<any>,
}

type Context = {
  match: Match,
  history: History,
}

type State = {
  navigationState: NavigationState,
  cards: Cards,
}

class CardStack extends Component<void, Props, State> {

  props: Props
  state: State
  context: Context

  unlistenHistory: Function

  static contextTypes = {
    history: PropTypes.object,
    match: PropTypes.object,
  }

  // Initialyze navigation state with
  // initial history
  constructor(props: Props, context: Context): void {
    super(props, context)
    // Build the card stack
    const { children } = props
    const cards = buildCards(children)
    // Get initial route of navigation state
    const { match, history } = context
    const { location } = history
    const parent = match && match.parent
    const currentRoute = getCurrentRoute(cards, parent, location)
    const currentCard = currentRoute && cards.find((card) => card.key === currentRoute.key)
    // Build navigation state
    const entries = history.entries.filter((entry) => {
      return cards.find((card) => matchPattern(card.pattern, entry, card.exactly))
    })
    const index = entries.findIndex((entry) => {
      if (!currentCard) return false
      return matchPattern(currentCard.pattern, entry, currentCard.exactly)
    })
    const routes = entries.map((entry) => {
      const card = cards.find(({ pattern, exactly }) => matchPattern(pattern, entry, exactly))
      if (!card) return { key: entry.pathname } // @TODO use to fix flow issue
      return { key: card.key }
    })
    const navigationState = { index, routes }
    // Save everything in local state
    this.state = { navigationState, cards }
  }

  // Listen history from <MemoryRouter /> and
  // hardware BackAndroid event
  componentDidMount(): void {
    const { history } = this.context
    // @TODO $FlowFixMe
    this.unlistenHistory = history.listen(this.onListenHistory)
    BackAndroid.addEventListener('hardwareBackPress', this.onNavigateBack)
  }

  // Remove all listeners
  componentWillUnmount(): void {
    this.unlistenHistory()
    BackAndroid.removeEventListener('hardwareBackPress', this.onNavigateBack)
  }

  // Listen all history events
  onListenHistory = (): void => {
    // Get current route
    const { cards, navigationState } = this.state
    const currentRoute = normalizeRoute(navigationState.routes[navigationState.index])
    const currentCard = cards.find((card) => card.key === currentRoute.key)
    // Get next route
    const { history, match } = this.context
    const { entries, index, location, action } = history
    const parent = match && match.parent
    const nextRoute = getCurrentRoute(cards, parent, location)
    // Local state and history must be updated ?
    if (
      nextRoute && currentCard && (
      // Basic pathname
      (currentRoute.key !== nextRoute.key) ||
      // Pathname with query params
      // Ex: with same pattern article/:id,
      //     pathname article/2 !== article/3
      (matchPattern(currentRoute.key, location, true) &&
       matchPattern(nextRoute.key, location, true) && (
       ((action === 'PUSH' || action === 'REPLACE') &&
         entries[index - 1] &&
         matchPattern(nextRoute.key, entries[index - 1], true) &&
         entries[index].pathname !== entries[index - 1].pathname) ||
        (action === 'POP' &&
         entries[index + 1] &&
         matchPattern(nextRoute.key, entries[index + 1], true) &&
         entries[index].pathname !== entries[index + 1].pathname)
      )))
    ) {
      const key = `${nextRoute.key}@@${Date.now()}`
      switch (action) {
        case 'PUSH': {
          this.setState({
            navigationState: NavigationStateUtils.push(
              navigationState,
              { key },
            ),
          })
          break
        }
        case 'POP': {
          // @TODO support NavigationStateUtils.go(state, n = 0) {...}
          const n = (history.length - 1) - history.index
          if (n > 1) {
            // @TODO add NavigationStateUtils.pop(state, n = 0) {...}
            this.setState({
              navigationState: NavigationStateUtils.reset(
                navigationState,
                navigationState.routes.slice(
                  0,
                  (navigationState.index - n) + 1,
                ),
                navigationState.index - n,
              ),
            })
          } else {
            this.setState({
              navigationState: NavigationStateUtils.pop(navigationState),
            })
          }
          break
        }
        case 'REPLACE': {
          this.setState({
            navigationState: NavigationStateUtils.replaceAtIndex(
              navigationState,
              navigationState.index,
              { key },
            ),
          })
          break
        }
        default:
      }
      // Sync history with next navigation state
      // @TODO - add pop(n) action to history context
      //         > https://github.com/LeoLeBras/history/
      const newHistory = getCleanedHistory(this.context.history)
      if (!_.isEqual(history, newHistory)) {
        Object.assign(history, newHistory)
      }
    }
  }

  // Pop to previous scene (n-1)
  onNavigateBack = (): boolean => {
    if (this.state.navigationState.index > 0) {
      this.context.history.goBack()
      return true
    }
    return false
  }


  // Render view in <Static /> with
  // conditoinnal updates
  renderView = (transitionProps: NavigationTransitionProps): React$Element<any> => {
    return this.props.render({
      ...transitionProps,
      cards: this.state.cards,
      onNavigateBack: this.onNavigateBack,
    })
  }

  // Render into <NavigationTransitioner /> with
  // custom render() prop
  // !! Warning: transitions are disabled by default !!
  render(): React$Element<any> {
    return (
      <NavigationTransitioner
        navigationState={this.state.navigationState}
        configureTransition={() => null}
        render={this.renderView}
      />
    )
  }

}

export default CardStack